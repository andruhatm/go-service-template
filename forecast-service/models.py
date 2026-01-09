"""Pydantic models for API request/response."""
from typing import Optional
from pydantic import BaseModel, Field, validator


class ForecastRequest(BaseModel):
    """Request model for forecast endpoint."""
    
    metric_name: str = Field(..., description="Name of the metric to forecast")
    mon_obj: str = Field(..., description="Monitoring object identifier")
    from_timestamp: int = Field(..., description="Unix timestamp from which to use existing data points", gt=0)
    forecast_periods: int = Field(..., description="Number of periods to forecast into the future", gt=0, le=1000)
    freq: str = Field(default='H', description="Frequency of forecast (H=hourly, D=daily, etc.)")
    step: str = Field(default='1h', description="Step size for querying VictoriaMetrics")
    seasonality_mode: str = Field(default='additive', description="Prophet seasonality mode")
    changepoint_prior_scale: float = Field(default=0.05, description="Prophet changepoint prior scale", gt=0, le=1)
    
    @validator('freq')
    def validate_freq(cls, v):
        """Validate frequency parameter."""
        valid_freqs = ['H', 'D', 'W', 'M', 'Y', 'T', 'S', 'min', 'h', 'd', 'w', 'm', 'y']
        if v not in valid_freqs:
            raise ValueError(f"Invalid frequency. Must be one of: {', '.join(valid_freqs)}")
        return v
    
    @validator('seasonality_mode')
    def validate_seasonality_mode(cls, v):
        """Validate seasonality mode."""
        if v not in ['additive', 'multiplicative']:
            raise ValueError("seasonality_mode must be 'additive' or 'multiplicative'")
        return v
    
    class Config:
        json_schema_extra = {
            "example": {
                "metric_name": "cpu_usage",
                "mon_obj": "server-01",
                "from_timestamp": 1704067200,
                "forecast_periods": 24,
                "freq": "H",
                "step": "1h",
                "seasonality_mode": "additive",
                "changepoint_prior_scale": 0.05
            }
        }


class ForecastResponse(BaseModel):
    """Response model for forecast endpoint."""
    
    status: str = Field(..., description="Status of the forecast operation")
    message: str = Field(..., description="Human-readable message")
    forecast_points: int = Field(..., description="Number of forecasted points generated")
    metric_name: str = Field(..., description="Name of the forecasted metric")
    mon_obj: str = Field(..., description="Monitoring object identifier")
    start_date: Optional[str] = Field(None, description="Start date of forecast (ISO format)")
    end_date: Optional[str] = Field(None, description="End date of forecast (ISO format)")
    
    class Config:
        json_schema_extra = {
            "example": {
                "status": "success",
                "message": "Forecast completed and written to VictoriaMetrics",
                "forecast_points": 24,
                "metric_name": "cpu_usage",
                "mon_obj": "server-01",
                "start_date": "2024-01-01T12:00:00",
                "end_date": "2024-01-02T11:00:00"
            }
        }


class ErrorResponse(BaseModel):
    """Error response model."""
    
    status: str = Field(default="error", description="Status of the operation")
    message: str = Field(..., description="Error message")
    detail: Optional[str] = Field(None, description="Detailed error information")
    
    class Config:
        json_schema_extra = {
            "example": {
                "status": "error",
                "message": "Forecast generation failed",
                "detail": "Insufficient data points for forecasting"
            }
        }


class HealthResponse(BaseModel):
    """Health check response model."""
    
    status: str = Field(..., description="Health status")
    service: str = Field(..., description="Service name")
    victoria_metrics_url: str = Field(..., description="VictoriaMetrics URL")
    
    class Config:
        json_schema_extra = {
            "example": {
                "status": "healthy",
                "service": "forecast-service",
                "victoria_metrics_url": "http://victoriametrics:8428"
            }
        }

