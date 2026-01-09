# Forecast Service

A Python microservice for time-series forecasting using Facebook Prophet library.

## Features

- REST API for forecasting requests
- Integration with VictoriaMetrics for data retrieval and storage
- Facebook Prophet for time-series forecasting
- Automatic labeling of forecasted data with `type=forecast`

## API Endpoints

### POST /api/v1/forecast

Forecasts future values for a given metric.

**Request Body:**
```json
{
  "metric_name": "cpu_usage",
  "mon_obj": "server-01",
  "from_timestamp": 1704067200,
  "forecast_periods": 24,
  "freq": "H",
  "step": "1h"
}
```

**Parameters:**
- `metric_name` (required): Name of the metric to forecast
- `mon_obj` (required): Monitoring object identifier
- `from_timestamp` (required): Unix timestamp from which to use existing data points
- `forecast_periods` (required): Number of periods to forecast into the future
- `freq` (optional): Frequency of forecast ('H' for hourly, 'D' for daily, etc.). Default: 'H'
- `step` (optional): Step size for querying VictoriaMetrics. Default: '1h'

**Response:**
```json
{
  "status": "success",
  "message": "Forecast completed and written to VictoriaMetrics",
  "forecast_points": 24,
  "metric_name": "cpu_usage",
  "mon_obj": "server-01"
}
```

### GET /health

Health check endpoint.

## Environment Variables

- `VICTORIA_METRICS_URL`: URL of VictoriaMetrics instance (default: http://victoriametrics:8428)
- `LOG_LEVEL`: Logging level (default: INFO)

## Running Locally

```bash
pip install -r requirements.txt
python main.py
```

Service will be available at http://localhost:8082

## Docker

Build and run with Docker:

```bash
docker build -t forecast-service .
docker run -p 8082:8082 -e VICTORIA_METRICS_URL=http://victoriametrics:8428 forecast-service
```

