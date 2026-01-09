"""VictoriaMetrics client for reading and writing metrics."""
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
import requests
import pandas as pd


logger = logging.getLogger(__name__)


class VictoriaMetricsClient:
    """Client for interacting with VictoriaMetrics."""
    
    def __init__(self, base_url: str):
        """Initialize VictoriaMetrics client.
        
        Args:
            base_url: Base URL of VictoriaMetrics instance (e.g., http://victoriametrics:8428)
        """
        self.base_url = base_url.rstrip('/')
        self.session = requests.Session()
        
    def query_range(
        self,
        metric_name: str,
        mon_obj: str,
        start_timestamp: int,
        end_timestamp: int,
        step: str = "1h"
    ) -> pd.DataFrame:
        """Query metric data from VictoriaMetrics.
        
        Args:
            metric_name: Name of the metric to query
            mon_obj: Monitoring object identifier
            start_timestamp: Start time as Unix timestamp
            end_timestamp: End time as Unix timestamp
            step: Step size for the query (e.g., '1h', '5m', '1d')
            
        Returns:
            DataFrame with columns: timestamp, value
            
        Raises:
            requests.RequestException: If query fails
        """
        # Build PromQL query
        promql = f'{metric_name}{{mon_obj="{mon_obj}"}}'
        
        params = {
            'query': promql,
            'start': start_timestamp,
            'end': end_timestamp,
            'step': step
        }
        
        url = f"{self.base_url}/api/v1/query_range"
        logger.info(f"Querying VictoriaMetrics: {url} with params: {params}")
        
        try:
            response = self.session.get(url, params=params, timeout=30)
            response.raise_for_status()
            data = response.json()
            
            if data.get('status') != 'success':
                raise ValueError(f"VictoriaMetrics query failed: {data.get('error', 'Unknown error')}")
            
            # Parse response
            results = data.get('data', {}).get('result', [])
            
            if not results:
                logger.warning(f"No data found for metric {metric_name} and mon_obj {mon_obj}")
                return pd.DataFrame(columns=['timestamp', 'value'])
            
            # Extract values from first result (should be only one with specific labels)
            values = results[0].get('values', [])
            
            if not values:
                logger.warning(f"Empty values for metric {metric_name} and mon_obj {mon_obj}")
                return pd.DataFrame(columns=['timestamp', 'value'])
            
            # Convert to DataFrame
            df = pd.DataFrame(values, columns=['timestamp', 'value'])
            df['timestamp'] = pd.to_datetime(df['timestamp'], unit='s')
            df['value'] = pd.to_numeric(df['value'], errors='coerce')
            
            # Drop any NaN values
            df = df.dropna()
            
            logger.info(f"Retrieved {len(df)} data points from VictoriaMetrics")
            return df
            
        except requests.RequestException as e:
            logger.error(f"Failed to query VictoriaMetrics: {e}")
            raise
        except Exception as e:
            logger.error(f"Error parsing VictoriaMetrics response: {e}")
            raise
    
    def write_forecast(
        self,
        metric_name: str,
        mon_obj: str,
        forecast_df: pd.DataFrame
    ) -> None:
        """Write forecast data to VictoriaMetrics.
        
        Args:
            metric_name: Name of the metric
            mon_obj: Monitoring object identifier
            forecast_df: DataFrame with columns: ds (datetime), yhat (forecast value)
            
        Raises:
            requests.RequestException: If write fails
        """
        if forecast_df.empty:
            logger.warning("Empty forecast DataFrame, nothing to write")
            return
        
        # Convert forecast to Prometheus format
        lines = []
        for _, row in forecast_df.iterrows():
            timestamp_ms = int(row['ds'].timestamp() * 1000)
            value = row['yhat']
            # Add type=forecast label to distinguish from actual data
            line = f'{metric_name}{{mon_obj="{mon_obj}",type="forecast"}} {value} {timestamp_ms}'
            lines.append(line)
        
        prometheus_data = '\n'.join(lines)
        
        url = f"{self.base_url}/api/v1/import/prometheus"
        logger.info(f"Writing {len(lines)} forecast points to VictoriaMetrics")
        
        try:
            response = self.session.post(
                url,
                data=prometheus_data.encode('utf-8'),
                headers={'Content-Type': 'text/plain'},
                timeout=30
            )
            response.raise_for_status()
            logger.info(f"Successfully wrote forecast data to VictoriaMetrics")
            
        except requests.RequestException as e:
            logger.error(f"Failed to write forecast to VictoriaMetrics: {e}")
            raise

