"""Main FastAPI application for forecast service."""
import logging
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from victoria_client import VictoriaMetricsClient
from forecast_service import ForecastService
from models import (
    ForecastRequest,
    ForecastResponse,
    ErrorResponse,
    HealthResponse
)


# Configure logging
LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO').upper()
logging.basicConfig(
    level=getattr(logging, LOG_LEVEL),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Configuration
VICTORIA_METRICS_URL = os.getenv('VICTORIA_METRICS_URL', 'http://victoriametrics:8428')
PORT = int(os.getenv('PORT', '8082'))
HOST = os.getenv('HOST', '0.0.0.0')

# Global service instances
victoria_client: VictoriaMetricsClient = None
forecast_service: ForecastService = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown."""
    # Startup
    global victoria_client, forecast_service
    
    logger.info(f"Starting Forecast Service")
    logger.info(f"VictoriaMetrics URL: {VICTORIA_METRICS_URL}")
    
    # Initialize clients
    victoria_client = VictoriaMetricsClient(VICTORIA_METRICS_URL)
    forecast_service = ForecastService(victoria_client)
    
    logger.info("Forecast Service initialized successfully")
    
    yield
    
    # Shutdown
    logger.info("Shutting down Forecast Service")


# Create FastAPI app
app = FastAPI(
    title="Forecast Service",
    description="Time-series forecasting service using Facebook Prophet",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify actual origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler."""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "status": "error",
            "message": "Internal server error",
            "detail": str(exc)
        }
    )


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint."""
    return HealthResponse(
        status="healthy",
        service="forecast-service",
        victoria_metrics_url=VICTORIA_METRICS_URL
    )


@app.post("/api/v1/forecast", response_model=ForecastResponse, responses={
    400: {"model": ErrorResponse},
    500: {"model": ErrorResponse}
})
async def create_forecast(request: ForecastRequest):
    """
    Generate forecast for a metric and write to VictoriaMetrics.
    
    This endpoint:
    1. Fetches historical data from VictoriaMetrics
    2. Trains a Prophet model on the data
    3. Generates forecast for specified periods
    4. Writes forecast back to VictoriaMetrics with type=forecast label
    """
    try:
        logger.info(f"Received forecast request: {request.dict()}")
        
        # Generate forecast and write to VictoriaMetrics
        result = forecast_service.forecast_and_write(
            metric_name=request.metric_name,
            mon_obj=request.mon_obj,
            from_timestamp=request.from_timestamp,
            forecast_periods=request.forecast_periods,
            freq=request.freq,
            step=request.step,
            seasonality_mode=request.seasonality_mode,
            changepoint_prior_scale=request.changepoint_prior_scale,
            forecast_id=request.forecast_id
        )
        
        logger.info(f"Forecast completed successfully: {result}")
        
        return ForecastResponse(**result)
        
    except ValueError as e:
        logger.error(f"Validation error: {e}")
        raise HTTPException(
            status_code=400,
            detail={
                "status": "error",
                "message": "Invalid request",
                "detail": str(e)
            }
        )
    except Exception as e:
        logger.error(f"Forecast generation failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail={
                "status": "error",
                "message": "Forecast generation failed",
                "detail": str(e)
            }
        )


@app.get("/")
async def root():
    """Root endpoint with service information."""
    return {
        "service": "forecast-service",
        "version": "1.0.0",
        "description": "Time-series forecasting service using Facebook Prophet",
        "endpoints": {
            "health": "/health",
            "forecast": "/api/v1/forecast"
        }
    }


if __name__ == "__main__":
    logger.info(f"Starting server on {HOST}:{PORT}")
    uvicorn.run(
        "main:app",
        host=HOST,
        port=PORT,
        log_level=LOG_LEVEL.lower(),
        reload=False
    )

