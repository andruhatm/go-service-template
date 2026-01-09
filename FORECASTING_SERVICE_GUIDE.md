# Forecasting Service Guide

## Overview

The Forecast Service is a Python-based microservice that provides time-series forecasting capabilities using Facebook's Prophet library. It integrates seamlessly with VictoriaMetrics to fetch historical data and store predictions.

## Architecture

```
┌─────────────┐      ┌──────────────────┐      ┌─────────────────┐
│   Frontend  │─────▶│ Forecast Service │─────▶│ VictoriaMetrics │
│   (Angular) │      │    (Python)      │      │                 │
└─────────────┘      └──────────────────┘      └─────────────────┘
                              │
                              │ Prophet ML
                              ▼
                        Time-series
                        Forecasting
```

## Features

- **RESTful API**: Simple HTTP API for forecast requests
- **Facebook Prophet**: State-of-the-art time-series forecasting
- **VictoriaMetrics Integration**: Seamless data ingestion and storage
- **Flexible Parameters**: Customizable forecast periods, frequencies, and model parameters
- **Labeled Forecasts**: Automatic labeling with `type=forecast` for easy querying

## Getting Started

### 1. Start the Services

```bash
cd /path/to/go-service-template
docker-compose up -d forecast-service
```

The service will be available at `http://localhost:8082`

### 2. Verify Service Health

```bash
curl http://localhost:8082/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "forecast-service",
  "victoria_metrics_url": "http://victoriametrics:8428"
}
```

## API Reference

### POST /api/v1/forecast

Generate a forecast for a specific metric.

#### Request Body

```json
{
  "metric_name": "cpu_usage",
  "mon_obj": "server-01",
  "from_timestamp": 1704067200,
  "forecast_periods": 24,
  "freq": "H",
  "step": "1h",
  "seasonality_mode": "additive",
  "changepoint_prior_scale": 0.05
}
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `metric_name` | string | Yes | Name of the metric to forecast |
| `mon_obj` | string | Yes | Monitoring object identifier |
| `from_timestamp` | integer | Yes | Unix timestamp from which to use data |
| `forecast_periods` | integer | Yes | Number of periods to forecast (max: 1000) |
| `freq` | string | No | Frequency: 'H' (hourly), 'D' (daily), 'W' (weekly), 'M' (monthly). Default: 'H' |
| `step` | string | No | VictoriaMetrics query step (e.g., '1h', '5m'). Default: '1h' |
| `seasonality_mode` | string | No | 'additive' or 'multiplicative'. Default: 'additive' |
| `changepoint_prior_scale` | float | No | Trend flexibility (0.001-1.0). Default: 0.05 |

#### Response

```json
{
  "status": "success",
  "message": "Forecast completed and written to VictoriaMetrics",
  "forecast_points": 24,
  "metric_name": "cpu_usage",
  "mon_obj": "server-01",
  "start_date": "2024-01-01T12:00:00",
  "end_date": "2024-01-02T11:00:00"
}
```

#### Error Response

```json
{
  "status": "error",
  "message": "Invalid request",
  "detail": "Insufficient data points for forecasting"
}
```

## Usage Examples

### Example 1: Basic Hourly Forecast

Forecast the next 24 hours of CPU usage:

```bash
curl -X POST http://localhost:8082/api/v1/forecast \
  -H "Content-Type: application/json" \
  -d '{
    "metric_name": "cpu_usage",
    "mon_obj": "server-01",
    "from_timestamp": 1704067200,
    "forecast_periods": 24,
    "freq": "H"
  }'
```

### Example 2: Daily Forecast with Custom Parameters

Forecast the next 7 days with multiplicative seasonality:

```bash
curl -X POST http://localhost:8082/api/v1/forecast \
  -H "Content-Type: application/json" \
  -d '{
    "metric_name": "memory_usage",
    "mon_obj": "server-02",
    "from_timestamp": 1704067200,
    "forecast_periods": 7,
    "freq": "D",
    "step": "1d",
    "seasonality_mode": "multiplicative",
    "changepoint_prior_scale": 0.1
  }'
```

### Example 3: Using Current Time

Forecast from the last 30 days:

```bash
FROM_TIMESTAMP=$(($(date +%s) - 2592000))

curl -X POST http://localhost:8082/api/v1/forecast \
  -H "Content-Type: application/json" \
  -d "{
    \"metric_name\": \"network_throughput\",
    \"mon_obj\": \"router-01\",
    \"from_timestamp\": $FROM_TIMESTAMP,
    \"forecast_periods\": 48,
    \"freq\": \"H\"
  }"
```

## Querying Forecast Data

After generating a forecast, you can query the forecasted data from VictoriaMetrics:

### Query Forecasted Data Only

```bash
curl 'http://localhost:8428/api/v1/query_range?query=cpu_usage{mon_obj="server-01",type="forecast"}&start=1704067200&end=1704153600&step=1h'
```

### Query Both Actual and Forecasted Data

```bash
curl 'http://localhost:8428/api/v1/query_range?query=cpu_usage{mon_obj="server-01"}&start=1704067200&end=1704153600&step=1h'
```

### Distinguish in PromQL

```promql
# Actual data only
cpu_usage{mon_obj="server-01",type!="forecast"}

# Forecasted data only
cpu_usage{mon_obj="server-01",type="forecast"}

# Both with legend
cpu_usage{mon_obj="server-01"} or cpu_usage{mon_obj="server-01",type="forecast"}
```

## Integration with Frontend

### TypeScript Service Example

```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ForecastRequest {
  metric_name: string;
  mon_obj: string;
  from_timestamp: number;
  forecast_periods: number;
  freq?: string;
  step?: string;
  seasonality_mode?: string;
  changepoint_prior_scale?: number;
}

export interface ForecastResponse {
  status: string;
  message: string;
  forecast_points: number;
  metric_name: string;
  mon_obj: string;
  start_date: string;
  end_date: string;
}

@Injectable({
  providedIn: 'root'
})
export class ForecastService {
  private apiUrl = 'http://localhost:8082/api/v1';

  constructor(private http: HttpClient) {}

  generateForecast(request: ForecastRequest): Observable<ForecastResponse> {
    return this.http.post<ForecastResponse>(`${this.apiUrl}/forecast`, request);
  }

  checkHealth(): Observable<any> {
    return this.http.get(`${this.apiUrl.replace('/api/v1', '')}/health`);
  }
}
```

### Component Example

```typescript
import { Component } from '@angular/core';
import { ForecastService } from './forecast.service';

@Component({
  selector: 'app-forecast',
  template: `
    <button (click)="generateForecast()">Generate Forecast</button>
    <div *ngIf="result">{{ result | json }}</div>
  `
})
export class ForecastComponent {
  result: any;

  constructor(private forecastService: ForecastService) {}

  generateForecast(): void {
    const request = {
      metric_name: 'cpu_usage',
      mon_obj: 'server-01',
      from_timestamp: Math.floor(Date.now() / 1000) - 604800, // Last 7 days
      forecast_periods: 24,
      freq: 'H'
    };

    this.forecastService.generateForecast(request).subscribe(
      response => {
        this.result = response;
        console.log('Forecast generated:', response);
      },
      error => {
        console.error('Forecast failed:', error);
      }
    );
  }
}
```

## Prophet Parameters Explained

### Seasonality Mode

- **additive**: Use when seasonal variations are constant over time
- **multiplicative**: Use when seasonal variations increase with trend

### Changepoint Prior Scale

Controls how flexible the trend is:
- **Low (0.001-0.05)**: Conservative, less responsive to changes
- **Medium (0.05-0.5)**: Balanced (default: 0.05)
- **High (0.5-1.0)**: Aggressive, very responsive to trend changes

### Frequency Options

- `H` or `h`: Hourly
- `D` or `d`: Daily
- `W` or `w`: Weekly
- `M` or `m`: Monthly
- `T` or `min`: Minutely
- `S` or `s`: Secondly

## Best Practices

### 1. Data Requirements

- **Minimum Points**: At least 2 data points (preferably 10+)
- **Recommended History**: 
  - For hourly forecasts: 7-30 days of data
  - For daily forecasts: 3-12 months of data
  - For weekly forecasts: 1-3 years of data

### 2. Forecast Periods

- Don't forecast too far into the future
- Rule of thumb: Forecast no more than 50% of your historical data length
- Example: With 30 days of data, forecast max 15 days ahead

### 3. Step Size

Match the step size to your data granularity:
- For hourly forecasts: `step: "1h"`
- For 5-minute data: `step: "5m"`
- For daily forecasts: `step: "1d"`

### 4. Seasonality Mode

- Use `additive` for metrics with stable seasonal patterns (CPU usage, memory)
- Use `multiplicative` for metrics that grow over time (traffic, revenue)

### 5. Error Handling

Always handle potential errors:
- Insufficient data
- Invalid metric names
- VictoriaMetrics connectivity issues
- Model fitting failures

## Troubleshooting

### Issue: "No historical data found"

**Cause**: Metric or mon_obj doesn't exist in VictoriaMetrics, or time range is incorrect.

**Solution**:
1. Verify metric exists: `curl 'http://localhost:8428/api/v1/query?query=metric_name{mon_obj="value"}'`
2. Check timestamp is in the past
3. Ensure data exists in the specified time range

### Issue: "Insufficient data points"

**Cause**: Less than 2 data points returned from VictoriaMetrics.

**Solution**:
1. Increase time range (lower `from_timestamp`)
2. Check if metric has enough historical data
3. Verify `step` parameter matches data granularity

### Issue: "Model fitting failed"

**Cause**: Prophet couldn't fit the model to the data (often due to all-zero or constant values).

**Solution**:
1. Check if data has variation (not all same values)
2. Try adjusting `changepoint_prior_scale`
3. Ensure data isn't all zeros or NaN

### Issue: Service is slow

**Cause**: Prophet model training can be CPU-intensive.

**Solution**:
1. Reduce the amount of historical data
2. Increase forecast-service resources in docker-compose
3. Consider caching results for frequently requested forecasts

## Monitoring

### Check Service Logs

```bash
docker-compose logs -f forecast-service
```

### Monitor Resource Usage

```bash
docker stats forecast-service
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VICTORIA_METRICS_URL` | `http://victoriametrics:8428` | VictoriaMetrics base URL |
| `LOG_LEVEL` | `INFO` | Logging level (DEBUG, INFO, WARNING, ERROR) |
| `HOST` | `0.0.0.0` | Service bind host |
| `PORT` | `8082` | Service port |

## Development

### Local Development Without Docker

1. Create virtual environment:
```bash
cd forecast-service
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Set environment variables:
```bash
export VICTORIA_METRICS_URL=http://localhost:8428
export LOG_LEVEL=DEBUG
```

4. Run the service:
```bash
python main.py
```

### Running Tests

```bash
# Make test script executable
chmod +x test_forecast_api.sh

# Run tests
./test_forecast_api.sh http://localhost:8082
```

## Security Considerations

### Production Deployment

1. **Add Authentication**: The service currently has no authentication. Consider adding:
   - API keys
   - OAuth2/JWT tokens
   - Integration with existing auth middleware

2. **CORS Configuration**: Update allowed origins in production:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://yourdomain.com"],  # Specify actual origins
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)
```

3. **Rate Limiting**: Consider adding rate limiting to prevent abuse

4. **Input Validation**: The service validates inputs, but consider additional checks

## Performance Tips

1. **Adjust forecast_periods**: Smaller forecasts are faster
2. **Optimize step size**: Larger steps mean less data to process
3. **Cache results**: Consider caching forecasts that don't change frequently
4. **Scale horizontally**: Deploy multiple instances behind a load balancer

## Future Enhancements

Potential improvements:
- [ ] Support for multiple metrics in a single request
- [ ] Confidence intervals in response
- [ ] Model persistence and reuse
- [ ] Advanced Prophet parameters (holidays, regressors)
- [ ] Alternative forecasting algorithms (ARIMA, LSTM)
- [ ] Forecast comparison and accuracy metrics
- [ ] Scheduled forecasting jobs
- [ ] Webhook notifications when forecast completes

## Support

For issues or questions:
1. Check service logs: `docker-compose logs forecast-service`
2. Review this guide
3. Consult Prophet documentation: https://facebook.github.io/prophet/
4. Check VictoriaMetrics connectivity

## References

- [Facebook Prophet Documentation](https://facebook.github.io/prophet/)
- [VictoriaMetrics API](https://docs.victoriametrics.com/Single-server-VictoriaMetrics.html#prometheus-querying-api-usage)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)

