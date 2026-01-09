"""Forecasting service using Facebook Prophet."""
import logging
from typing import Optional
import pandas as pd
from prophet import Prophet
from victoria_client import VictoriaMetricsClient


logger = logging.getLogger(__name__)


class ForecastService:
    """Service for time-series forecasting using Prophet."""
    
    def __init__(self, victoria_client: VictoriaMetricsClient):
        """Initialize forecast service.
        
        Args:
            victoria_client: VictoriaMetrics client for data access
        """
        self.victoria_client = victoria_client
    
    def forecast(
        self,
        metric_name: str,
        mon_obj: str,
        from_timestamp: int,
        forecast_periods: int,
        freq: str = 'H',
        step: str = '1h',
        seasonality_mode: str = 'additive',
        changepoint_prior_scale: float = 0.05,
        include_history: bool = False
    ) -> pd.DataFrame:
        """Generate forecast for a metric.
        
        Args:
            metric_name: Name of the metric to forecast
            mon_obj: Monitoring object identifier
            from_timestamp: Unix timestamp from which to use existing data
            forecast_periods: Number of periods to forecast
            freq: Frequency of forecast ('H' for hourly, 'D' for daily, etc.)
            step: Step size for VictoriaMetrics query
            seasonality_mode: Prophet seasonality mode ('additive' or 'multiplicative')
            changepoint_prior_scale: Prophet parameter for trend flexibility
            include_history: Whether to include historical fitted values
            
        Returns:
            DataFrame with forecast data (ds, yhat, yhat_lower, yhat_upper)
            
        Raises:
            ValueError: If insufficient data or invalid parameters
        """
        # Get current timestamp for end of historical data
        import time
        end_timestamp = int(time.time())
        
        # Fetch historical data
        logger.info(f"Fetching historical data for {metric_name} from {from_timestamp} to {end_timestamp}")
        historical_df = self.victoria_client.query_range(
            metric_name=metric_name,
            mon_obj=mon_obj,
            start_timestamp=from_timestamp,
            end_timestamp=end_timestamp,
            step=step
        )
        
        if historical_df.empty:
            raise ValueError(f"No historical data found for metric {metric_name} and mon_obj {mon_obj}")
        
        if len(historical_df) < 2:
            raise ValueError(f"Insufficient data points ({len(historical_df)}). Need at least 2 points for forecasting.")
        
        # Prepare data for Prophet (requires 'ds' and 'y' columns)
        prophet_df = pd.DataFrame({
            'ds': historical_df['timestamp'],
            'y': historical_df['value']
        })
        
        logger.info(f"Training Prophet model with {len(prophet_df)} data points")
        
        # Initialize and fit Prophet model
        model = Prophet(
            seasonality_mode=seasonality_mode,
            changepoint_prior_scale=changepoint_prior_scale,
            daily_seasonality='auto',
            weekly_seasonality='auto',
            yearly_seasonality='auto'
        )
        
        try:
            model.fit(prophet_df)
        except Exception as e:
            logger.error(f"Failed to fit Prophet model: {e}")
            raise ValueError(f"Model fitting failed: {str(e)}")
        
        # Create future dataframe for forecasting
        future = model.make_future_dataframe(periods=forecast_periods, freq=freq, include_history=include_history)
        
        logger.info(f"Generating forecast for {forecast_periods} periods with frequency {freq}")
        
        # Generate forecast
        try:
            forecast = model.predict(future)
        except Exception as e:
            logger.error(f"Failed to generate forecast: {e}")
            raise ValueError(f"Forecast generation failed: {str(e)}")
        
        # If not including history, only return future predictions
        if not include_history:
            # Get only the forecasted periods (not the historical ones)
            forecast = forecast.tail(forecast_periods)
        
        logger.info(f"Forecast generated with {len(forecast)} points")
        
        # Return relevant columns
        return forecast[['ds', 'yhat', 'yhat_lower', 'yhat_upper']]
    
    def forecast_and_write(
        self,
        metric_name: str,
        mon_obj: str,
        from_timestamp: int,
        forecast_periods: int,
        freq: str = 'H',
        step: str = '1h',
        seasonality_mode: str = 'additive',
        changepoint_prior_scale: float = 0.05
    ) -> dict:
        """Generate forecast and write to VictoriaMetrics.
        
        Args:
            metric_name: Name of the metric to forecast
            mon_obj: Monitoring object identifier
            from_timestamp: Unix timestamp from which to use existing data
            forecast_periods: Number of periods to forecast
            freq: Frequency of forecast
            step: Step size for VictoriaMetrics query
            seasonality_mode: Prophet seasonality mode
            changepoint_prior_scale: Prophet parameter for trend flexibility
            
        Returns:
            Dict with forecast summary
            
        Raises:
            ValueError: If forecasting fails
        """
        # Generate forecast
        forecast_df = self.forecast(
            metric_name=metric_name,
            mon_obj=mon_obj,
            from_timestamp=from_timestamp,
            forecast_periods=forecast_periods,
            freq=freq,
            step=step,
            seasonality_mode=seasonality_mode,
            changepoint_prior_scale=changepoint_prior_scale,
            include_history=False
        )
        
        # Write forecast to VictoriaMetrics
        self.victoria_client.write_forecast(
            metric_name=metric_name,
            mon_obj=mon_obj,
            forecast_df=forecast_df
        )
        
        return {
            'status': 'success',
            'message': 'Forecast completed and written to VictoriaMetrics',
            'forecast_points': len(forecast_df),
            'metric_name': metric_name,
            'mon_obj': mon_obj,
            'start_date': forecast_df['ds'].min().isoformat(),
            'end_date': forecast_df['ds'].max().isoformat()
        }

