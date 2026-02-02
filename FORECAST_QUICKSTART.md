# Forecast Service Quick Start Guide

## Overview

The Forecast Service is now integrated into your application! It provides time-series forecasting using Facebook Prophet, with seamless VictoriaMetrics integration.

## What's Been Created

```
forecast-service/
├── main.py                    # FastAPI application
├── forecast_service.py        # Prophet forecasting logic
├── victoria_client.py         # VictoriaMetrics client
├── models.py                  # Pydantic models
├── requirements.txt           # Python dependencies
├── Dockerfile                 # Docker configuration
├── test_forecast_api.sh       # API test script
└── README.md                  # Service documentation
```

## Quick Start

### 1. Start the Service

```bash
cd /Users/andrewgerasimov/GolandProjects/go-service-template

# Start all services including forecast-service
docker-compose up -d

# Or start only the forecast service
docker-compose up -d forecast-service
```

### 2. Verify Service is Running

```bash
# Check health
curl http://localhost:8082/health

# Expected response:
# {
#   "status": "healthy",
#   "service": "forecast-service",
#   "victoria_metrics_url": "http://victoriametrics:8428"
# }
```

### 3. Generate Your First Forecast

```bash
# Calculate timestamp for 7 days ago
FROM_TIMESTAMP=$(($(date +%s) - 604800))

# Generate forecast
curl -X POST http://localhost:8082/api/v1/forecast \
  -H "Content-Type: application/json" \
  -d "{
    \"metric_name\": \"your_metric_name\",
    \"mon_obj\": \"your_mon_obj\",
    \"from_timestamp\": $FROM_TIMESTAMP,
    \"forecast_periods\": 24,
    \"freq\": \"H\"
  }"
```

### 4. Query Forecasted Data

```bash
# Query forecasted data from VictoriaMetrics
curl 'http://localhost:8428/api/v1/query?query=your_metric_name{mon_obj="your_mon_obj",type="forecast"}'
```

## Service Flow

```
┌─────────────┐
│   UI Call   │
│ (Frontend)  │
└──────┬──────┘
       │ POST /api/v1/forecast
       │ {metric_name, mon_obj, from_timestamp, forecast_periods, ...}
       ▼
┌──────────────────┐
│ Forecast Service │
│   (FastAPI)      │
└────┬─────────────┘
     │
     │ 1. Query historical data
     ├────────────────────────┐
     │                        ▼
     │              ┌─────────────────┐
     │              │ VictoriaMetrics │◄──── Read actual data
     │              └─────────────────┘
     │                        │
     │ 2. Train Prophet model │
     ├──────────────────────► │
     │                        │
     │ 3. Generate forecast   │
     ├──────────────────────► │
     │                        │
     │ 4. Write forecast      │
     └───────────────────────►│
                              │
                    Write with type=forecast label
                              │
                              ▼
                    ┌─────────────────┐
                    │ VictoriaMetrics │
                    │  (Forecasted)   │
                    └─────────────────┘
                              │
                              │ Query forecast
                              ▼
                    ┌─────────────────┐
                    │   UI Display    │
                    │  (Dashboard)    │
                    └─────────────────┘
```

## Architecture

### Services Overview

| Service | Port | Purpose |
|---------|------|---------|
| Frontend | 80 | Angular UI |
| Go API | 8081 | Main REST API |
| **Forecast Service** | **8082** | **Time-series forecasting** |
| Keycloak | 8080 | Authentication |
| VictoriaMetrics | 8428 | Time-series database |
| PostgreSQL | 5432 | Relational database |

### Key Features

1. **REST API**: Simple HTTP endpoints for forecasting
2. **Facebook Prophet**: State-of-the-art ML forecasting
3. **VictoriaMetrics Integration**: Seamless data flow
4. **Docker-Ready**: Fully containerized
5. **Type Labeling**: Forecasted data marked with `type=forecast`

## API Reference

### Forecast Endpoint

**POST** `/api/v1/forecast`

**Request Body:**
```json
{
  "metric_name": "cpu_usage",           // Required: Metric name
  "mon_obj": "server-01",               // Required: Monitoring object
  "from_timestamp": 1704067200,         // Required: Start time (Unix timestamp)
  "forecast_periods": 24,               // Required: Number of periods to forecast
  "freq": "H",                          // Optional: Frequency (H/D/W/M)
  "step": "1h",                         // Optional: Query step size
  "seasonality_mode": "additive",       // Optional: additive/multiplicative
  "changepoint_prior_scale": 0.05       // Optional: Trend flexibility (0.001-1.0)
}
```

**Success Response (200):**
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

**Error Response (400/500):**
```json
{
  "status": "error",
  "message": "Invalid request",
  "detail": "Insufficient data points for forecasting"
}
```

## Common Use Cases

### 1. Hourly CPU Forecast (Next 24 Hours)

```bash
curl -X POST http://localhost:8082/api/v1/forecast \
  -H "Content-Type: application/json" \
  -d "{
    \"metric_name\": \"cpu_usage\",
    \"mon_obj\": \"server-01\",
    \"from_timestamp\": $(($(date +%s) - 604800)),
    \"forecast_periods\": 24,
    \"freq\": \"H\"
  }"
```

### 2. Daily Memory Forecast (Next 7 Days)

```bash
curl -X POST http://localhost:8082/api/v1/forecast \
  -H "Content-Type: application/json" \
  -d "{
    \"metric_name\": \"memory_usage\",
    \"mon_obj\": \"server-02\",
    \"from_timestamp\": $(($(date +%s) - 2592000)),
    \"forecast_periods\": 7,
    \"freq\": \"D\",
    \"step\": \"1d\"
  }"
```

### 3. Network Traffic Forecast with Multiplicative Seasonality

```bash
curl -X POST http://localhost:8082/api/v1/forecast \
  -H "Content-Type: application/json" \
  -d "{
    \"metric_name\": \"network_throughput\",
    \"mon_obj\": \"router-01\",
    \"from_timestamp\": $(($(date +%s) - 2592000)),
    \"forecast_periods\": 48,
    \"freq\": \"H\",
    \"seasonality_mode\": \"multiplicative\",
    \"changepoint_prior_scale\": 0.1
  }"
```

## Frontend Integration

### Quick Integration Steps

1. **Create Angular Service** (see `FORECAST_INTEGRATION_EXAMPLE.md`)
2. **Add Forecast Button** to chart widgets
3. **Call Forecast API** when button clicked
4. **Refresh Chart** to display forecasted data
5. **Style Differently** (e.g., dashed line for forecast)

### Example TypeScript Code

```typescript
// Call forecast service
this.forecastService.generateForecast({
  metric_name: 'cpu_usage',
  mon_obj: 'server-01',
  from_timestamp: Math.floor(Date.now() / 1000) - 604800,
  forecast_periods: 24,
  freq: 'H'
}).subscribe(response => {
  console.log('Forecast generated:', response);
  this.refreshChart(); // Reload chart with forecast
});
```

### Querying Forecasted Data

```typescript
// Query both actual and forecasted data
const query = `cpu_usage{mon_obj="server-01"} or cpu_usage{mon_obj="server-01",type="forecast"}`;

// Or query separately
const actualQuery = `cpu_usage{mon_obj="server-01",type!="forecast"}`;
const forecastQuery = `cpu_usage{mon_obj="server-01",type="forecast"}`;
```

## Testing

### Run Test Script

```bash
cd forecast-service
./test_forecast_api.sh http://localhost:8082
```

### Manual Testing

```bash
# 1. Health check
curl http://localhost:8082/health

# 2. Service info
curl http://localhost:8082/

# 3. Generate test forecast (requires existing data)
curl -X POST http://localhost:8082/api/v1/forecast \
  -H "Content-Type: application/json" \
  -d @- <<EOF
{
  "metric_name": "test_metric",
  "mon_obj": "test_obj",
  "from_timestamp": $(($(date +%s) - 86400)),
  "forecast_periods": 12,
  "freq": "H"
}
EOF
```

## Troubleshooting

### Service Won't Start

```bash
# Check logs
docker-compose logs forecast-service

# Common issues:
# - Python dependencies failed to install
# - Port 8082 already in use
# - VictoriaMetrics not accessible
```

### "No historical data found"

**Cause**: No data exists in VictoriaMetrics for the specified metric/mon_obj.

**Solution**:
```bash
# Verify data exists
curl 'http://localhost:8428/api/v1/query?query=your_metric{mon_obj="your_obj"}'

# Write test data if needed
curl -d 'test_metric{mon_obj="test_obj"} 42' http://localhost:8428/api/v1/import/prometheus
```

### "Insufficient data points"

**Cause**: Less than 2 data points found.

**Solution**:
- Increase time range (lower `from_timestamp`)
- Verify data exists in the specified time window
- Check `step` parameter matches data granularity

### Forecast Takes Too Long

**Cause**: Large dataset or complex seasonality.

**Solutions**:
- Reduce historical data range
- Increase `step` size (e.g., use '1h' instead of '5m')
- Adjust `changepoint_prior_scale` (lower = faster)

## Monitoring

### Check Service Health

```bash
# Basic health
curl http://localhost:8082/health

# Docker stats
docker stats forecast-service

# Service logs
docker-compose logs -f forecast-service
```

### View Logs

```bash
# All logs
docker-compose logs forecast-service

# Follow logs
docker-compose logs -f forecast-service

# Last 100 lines
docker-compose logs --tail=100 forecast-service
```

## Production Considerations

### 1. Authentication

The service currently has no authentication. For production:

- Add API key validation
- Integrate with existing auth (Keycloak)
- Use middleware for token validation

### 2. Rate Limiting

Consider adding rate limiting to prevent abuse:

```python
# Example with slowapi
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@app.post("/api/v1/forecast")
@limiter.limit("10/minute")
async def create_forecast(...):
    ...
```

### 3. Async Processing

For large forecasts, consider async processing:

- Queue forecast requests (Celery, RabbitMQ)
- Return job ID immediately
- Poll for completion status

### 4. Caching

Cache forecast results to avoid recomputation:

```python
# Example with Redis
from redis import Redis
import pickle

cache = Redis(host='redis', port=6379)

def get_cached_forecast(key):
    data = cache.get(key)
    return pickle.loads(data) if data else None

def cache_forecast(key, forecast, ttl=3600):
    cache.setex(key, ttl, pickle.dumps(forecast))
```

### 5. Resource Limits

Set resource limits in docker-compose.yaml:

```yaml
forecast-service:
  # ... existing config ...
  deploy:
    resources:
      limits:
        cpus: '2'
        memory: 2G
      reservations:
        cpus: '1'
        memory: 1G
```

## Advanced Configuration

### Environment Variables

Customize behavior via environment variables:

```yaml
# docker-compose.yaml
forecast-service:
  environment:
    - VICTORIA_METRICS_URL=http://victoriametrics:8428
    - LOG_LEVEL=DEBUG          # DEBUG, INFO, WARNING, ERROR
    - HOST=0.0.0.0
    - PORT=8082
```

### Nginx Reverse Proxy (Production)

```nginx
# nginx.conf
location /forecast-api/ {
    proxy_pass http://forecast-service:8082/api/v1/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    # Increase timeout for long-running forecasts
    proxy_read_timeout 300s;
    proxy_connect_timeout 75s;
}
```

## Documentation

- **Service README**: `forecast-service/README.md`
- **Detailed Guide**: `FORECASTING_SERVICE_GUIDE.md`
- **Frontend Integration**: `frontend/FORECAST_INTEGRATION_EXAMPLE.md`
- **Prophet Documentation**: https://facebook.github.io/prophet/

## Next Steps

1. ✅ Service is ready to use
2. 🔄 Add forecast button to dashboard widgets
3. 🎨 Customize UI to show forecast vs actual data
4. 🔐 Add authentication (if needed)
5. 📊 Monitor forecast accuracy
6. 🚀 Deploy to production

## Example Complete Workflow

```bash
# 1. Start services
docker-compose up -d

# 2. Verify forecast service
curl http://localhost:8082/health

# 3. Generate forecast (adjust metric_name and mon_obj)
curl -X POST http://localhost:8082/api/v1/forecast \
  -H "Content-Type: application/json" \
  -d "{
    \"metric_name\": \"cpu_usage\",
    \"mon_obj\": \"server-01\",
    \"from_timestamp\": $(($(date +%s) - 604800)),
    \"forecast_periods\": 24,
    \"freq\": \"H\"
  }"

# 4. Query forecasted data
curl "http://localhost:8428/api/v1/query?query=cpu_usage{mon_obj=\"server-01\",type=\"forecast\"}"

# 5. View in dashboard (after frontend integration)
# Open http://localhost:80 and view chart with forecast
```

## Support

For issues or questions:
1. Check service logs: `docker-compose logs forecast-service`
2. Review documentation in this repo
3. Verify VictoriaMetrics connectivity
4. Test with curl before integrating frontend

Happy Forecasting! 🚀📈


