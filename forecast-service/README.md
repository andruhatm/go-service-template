# Forecast Service

A Python microservice for time-series forecasting using Facebook Prophet library.

## Features

- REST API for forecasting requests
- Integration with VictoriaMetrics for data retrieval and storage
- Facebook Prophet for time-series forecasting
- Standardized label format: `{name="...", type="actual"}` and `{name="...", type="forecast"}`
- Automatic forecasting with configurable seasonality and trend parameters

## Label Format

**v1.1.0+**: The service uses standardized labels:
- **Actual/Historical data**: `{name="enb27738", type="actual"}`
- **Forecast data**: `{name="enb27738", type="forecast"}`

This allows clear distinction between real measurements and predictions in queries.

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
- `mon_obj` (required): Monitoring object identifier (mapped to `name` label in VictoriaMetrics)
- `from_timestamp` (required): Unix timestamp from which to use existing data points
- `forecast_periods` (required): Number of periods to forecast into the future (max: 1000)
- `freq` (optional): Frequency of forecast ('H' for hourly, 'D' for daily, etc.). Default: 'H'
- `step` (optional): Step size for querying VictoriaMetrics. Default: '1h'
- `seasonality_mode` (optional): Prophet seasonality mode ('additive' or 'multiplicative'). Default: 'additive'
- `changepoint_prior_scale` (optional): Prophet trend flexibility (0.001-1.0). Default: 0.05

**Note**: The service queries actual data with filter `{name="...", type="actual"}` and writes forecasts with `{name="...", type="forecast"}`.

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

## Testing

Run the test script to verify the service with new label format:

```bash
./test_forecast_with_labels.sh
```

This will:
1. Check service health
2. Ingest test data with `type="actual"` label
3. Generate a forecast
4. Verify forecast data has `type="forecast"` label
5. Test various query patterns

## Querying Data

### Query actual data only:
```bash
curl "http://localhost:8428/api/v1/query?query=PRB_Utilization_Mean{name=\"enb27738\",type=\"actual\"}"
```

### Query forecast data only:
```bash
curl "http://localhost:8428/api/v1/query?query=PRB_Utilization_Mean{name=\"enb27738\",type=\"forecast\"}"
```

### Query both:
```bash
curl "http://localhost:8428/api/v1/query?query=PRB_Utilization_Mean{name=\"enb27738\"}"
```

## Documentation

- **[FORECASTING_SERVICE_GUIDE.md](../FORECASTING_SERVICE_GUIDE.md)**: Complete usage guide
- **[FORECAST_PARAMETERS_GUIDE.md](../FORECAST_PARAMETERS_GUIDE.md)**: Optimal parameters for 3GPP metrics
- **[LABEL_FORMAT_MIGRATION.md](./LABEL_FORMAT_MIGRATION.md)**: Migration guide for new label format
- **[CHANGELOG.md](./CHANGELOG.md)**: Version history and breaking changes
- **[ARCHITECTURE.md](./ARCHITECTURE.md)**: Technical architecture details

