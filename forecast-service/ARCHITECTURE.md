# Forecast Service Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         APPLICATION ECOSYSTEM                        │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────┐
│   Browser    │
│   (User)     │
└──────┬───────┘
       │ HTTP
       ▼
┌──────────────────────────────────────────────────────────────────────┐
│                           Frontend (Angular)                          │
│                              Port: 80                                 │
├──────────────────────────────────────────────────────────────────────┤
│  - Dashboard with Chart Widgets                                       │
│  - Forecast Button on Each Widget                                    │
│  - ForecastService (TypeScript)                                      │
│  - Chart Rendering (Highcharts/etc)                                 │
└────────┬──────────────────────────────────────────────┬──────────────┘
         │                                              │
         │ HTTP /api/...                                │ HTTP /api/v1/forecast
         ▼                                              ▼
┌─────────────────────────┐              ┌────────────────────────────┐
│    Go API Service       │              │   Forecast Service         │
│      Port: 8081         │              │   (Python/FastAPI)         │
├─────────────────────────┤              │      Port: 8082            │
│ - REST Endpoints        │              ├────────────────────────────┤
│ - Auth (Keycloak)       │              │ - POST /api/v1/forecast    │
│ - Dashboard CRUD        │              │ - GET /health              │
│ - Metrics Catalog       │              │ - Prophet ML Engine        │
│ - Mon Objects           │              │ - VictoriaMetrics Client   │
└────┬────────────────────┘              └──────┬─────────────────────┘
     │                                          │
     │                                          │ Query/Write
     │                                          │
     │ Read/Write                               │
     ▼                                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      VictoriaMetrics (TSDB)                          │
│                          Port: 8428                                  │
├─────────────────────────────────────────────────────────────────────┤
│  Storage:                                                            │
│  - Actual metrics: metric_name{mon_obj="X"}                         │
│  - Forecasted metrics: metric_name{mon_obj="X",type="forecast"}    │
│                                                                      │
│  APIs:                                                               │
│  - /api/v1/query_range (read)                                      │
│  - /api/v1/import/prometheus (write)                               │
└─────────────────────────────────────────────────────────────────────┘
```

## Forecast Request Flow

```
┌──────────┐
│   User   │
└────┬─────┘
     │ 1. Clicks "Forecast" button on widget
     ▼
┌────────────────────┐
│  Angular Frontend  │
├────────────────────┤
│ ForecastService    │
│  .generateForecast()
└────┬───────────────┘
     │ 2. HTTP POST /api/v1/forecast
     │    {
     │      metric_name: "cpu_usage",
     │      mon_obj: "server-01",
     │      from_timestamp: 1704067200,
     │      forecast_periods: 24,
     │      freq: "H"
     │    }
     ▼
┌────────────────────────────────────────┐
│     Forecast Service (FastAPI)         │
│                                         │
│  main.py                                │
│    └─► @app.post("/api/v1/forecast")  │
│           └─► forecast_service.       │
│                forecast_and_write()   │
└───┬─────────────────────────────────┬──┘
    │                                 │
    │ 3. Query historical data        │ 6. Write forecast
    │                                 │
    ▼                                 ▼
┌────────────────────────────────────────────────┐
│      VictoriaMetrics Client                    │
│                                                 │
│  victoria_client.py                            │
│    ├─► query_range()                          │
│    │   GET /api/v1/query_range                │
│    │   ?query=cpu_usage{mon_obj="server-01"} │
│    │   &start=...&end=...&step=1h            │
│    │                                           │
│    └─► write_forecast()                       │
│        POST /api/v1/import/prometheus         │
│        Body: metric{labels} value timestamp   │
└────┬──────────────────────────────────┬───────┘
     │                                   │
     │ 4. Returns time-series data       │ 7. Writes labeled data
     │    [{timestamp, value}, ...]      │    type="forecast"
     │                                   │
     ▼                                   ▼
┌────────────────────────────────────────────────┐
│          VictoriaMetrics (TSDB)                │
│                                                 │
│  Data Storage:                                 │
│  ├─ cpu_usage{mon_obj="server-01"}           │
│  │  [actual historical data]                  │
│  │                                             │
│  └─ cpu_usage{mon_obj="server-01",           │
│               type="forecast"}                │
│     [forecasted future data]                  │
└────────────────────────────────────────────────┘
     │
     │ 5. Prophet processes data
     ▼
┌────────────────────────────────────────────────┐
│         Prophet Forecasting Engine             │
│                                                 │
│  forecast_service.py                           │
│    ├─► Prepare data (Pandas DataFrame)        │
│    │   df = pd.DataFrame({'ds': ..., 'y': ...})│
│    │                                            │
│    ├─► Train model                             │
│    │   model = Prophet()                       │
│    │   model.fit(df)                           │
│    │                                            │
│    ├─► Generate predictions                    │
│    │   future = model.make_future_dataframe() │
│    │   forecast = model.predict(future)       │
│    │                                            │
│    └─► Return forecast DataFrame               │
│        [ds, yhat, yhat_lower, yhat_upper]     │
└────────────────────────────────────────────────┘
```

## Component Interaction

```
┌─────────────────────────────────────────────────────────────────┐
│                      Forecast Service Internals                  │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────┐
│   main.py        │  ◄─── Entry Point
│   (FastAPI App)  │
├──────────────────┤
│ - Routes         │
│ - Middleware     │
│ - CORS           │
│ - Error handlers │
└────────┬─────────┘
         │
         │ Depends on
         ▼
┌──────────────────────────┐
│  forecast_service.py     │  ◄─── Business Logic
├──────────────────────────┤
│ ForecastService          │
│  ├─► forecast()         │
│  │   - Fetch data       │
│  │   - Train Prophet    │
│  │   - Generate forecast│
│  │                      │
│  └─► forecast_and_write()│
│      - Forecast + Write │
└──────┬───────────────────┘
       │
       │ Uses
       ▼
┌──────────────────────────┐
│  victoria_client.py      │  ◄─── Data Access Layer
├──────────────────────────┤
│ VictoriaMetricsClient    │
│  ├─► query_range()      │
│  │   - HTTP GET         │
│  │   - Parse JSON       │
│  │   - Return DataFrame │
│  │                      │
│  └─► write_forecast()   │
│      - Format Prometheus│
│      - HTTP POST        │
└──────────────────────────┘
       │
       │ Validated by
       ▼
┌──────────────────────────┐
│     models.py            │  ◄─── Data Models
├──────────────────────────┤
│ Pydantic Models          │
│  ├─► ForecastRequest    │
│  ├─► ForecastResponse   │
│  ├─► ErrorResponse      │
│  └─► HealthResponse     │
└──────────────────────────┘
```

## Data Flow Detail

### Request Processing

```
1. Request Reception
   ────────────────────────────────────────
   POST /api/v1/forecast
   Content-Type: application/json
   
   {
     "metric_name": "cpu_usage",
     "mon_obj": "server-01",
     "from_timestamp": 1704067200,
     "forecast_periods": 24,
     "freq": "H"
   }
   
   │
   ▼
   
2. Validation (Pydantic)
   ────────────────────────────────────────
   ForecastRequest model validates:
   - Required fields present
   - Types correct (int, str, etc.)
   - Values in valid ranges
   - Enum values valid
   
   │
   ▼
   
3. Historical Data Query
   ────────────────────────────────────────
   VictoriaMetrics Query:
   GET /api/v1/query_range
   
   Parameters:
   - query: cpu_usage{mon_obj="server-01"}
   - start: 1704067200
   - end: current_timestamp
   - step: 1h
   
   Response:
   {
     "status": "success",
     "data": {
       "resultType": "matrix",
       "result": [{
         "metric": {...},
         "values": [
           [1704067200, "45.2"],
           [1704070800, "46.1"],
           ...
         ]
       }]
     }
   }
   
   │
   ▼
   
4. Data Preparation
   ────────────────────────────────────────
   Convert to Prophet format:
   
   pandas DataFrame:
   ┌─────────────────────┬────────┐
   │ ds (datetime)       │ y      │
   ├─────────────────────┼────────┤
   │ 2024-01-01 00:00:00 │ 45.2   │
   │ 2024-01-01 01:00:00 │ 46.1   │
   │ 2024-01-01 02:00:00 │ 44.8   │
   │ ...                 │ ...    │
   └─────────────────────┴────────┘
   
   │
   ▼
   
5. Prophet Training
   ────────────────────────────────────────
   model = Prophet(
     seasonality_mode='additive',
     changepoint_prior_scale=0.05
   )
   model.fit(df)
   
   Prophet analyzes:
   - Trend
   - Yearly seasonality
   - Weekly seasonality
   - Daily seasonality
   - Holiday effects
   
   │
   ▼
   
6. Forecast Generation
   ────────────────────────────────────────
   future = model.make_future_dataframe(
     periods=24,
     freq='H'
   )
   forecast = model.predict(future)
   
   Result DataFrame:
   ┌─────────────────────┬────────┬─────────────┬─────────────┐
   │ ds                  │ yhat   │ yhat_lower  │ yhat_upper  │
   ├─────────────────────┼────────┼─────────────┼─────────────┤
   │ 2024-01-02 00:00:00 │ 45.5   │ 42.1        │ 48.9        │
   │ 2024-01-02 01:00:00 │ 46.2   │ 42.8        │ 49.6        │
   │ ...                 │ ...    │ ...         │ ...         │
   └─────────────────────┴────────┴─────────────┴─────────────┘
   
   │
   ▼
   
7. Write to VictoriaMetrics
   ────────────────────────────────────────
   POST /api/v1/import/prometheus
   Content-Type: text/plain
   
   cpu_usage{mon_obj="server-01",type="forecast"} 45.5 1704153600000
   cpu_usage{mon_obj="server-01",type="forecast"} 46.2 1704157200000
   cpu_usage{mon_obj="server-01",type="forecast"} 44.9 1704161200000
   ...
   
   │
   ▼
   
8. Response
   ────────────────────────────────────────
   {
     "status": "success",
     "message": "Forecast completed and written to VictoriaMetrics",
     "forecast_points": 24,
     "metric_name": "cpu_usage",
     "mon_obj": "server-01",
     "start_date": "2024-01-02T00:00:00",
     "end_date": "2024-01-02T23:00:00"
   }
```

## Technology Stack

```
┌────────────────────────────────────────┐
│         Forecast Service Stack         │
└────────────────────────────────────────┘

Runtime:
  ├─ Python 3.11
  └─ ASGI Server (Uvicorn)

Web Framework:
  ├─ FastAPI (REST API)
  ├─ Pydantic (Validation)
  └─ Starlette (ASGI framework)

ML/Data Science:
  ├─ Prophet (Facebook)
  │  ├─ Stan (Bayesian modeling)
  │  └─ PyMC (Probabilistic programming)
  ├─ Pandas (Data manipulation)
  └─ NumPy (Numerical computing)

HTTP Client:
  └─ Requests (VictoriaMetrics API)

Container:
  ├─ Docker
  └─ docker-compose

Storage:
  └─ VictoriaMetrics (Time-series DB)
```

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Docker Compose Stack                     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Host Machine (macOS/Linux/Windows)                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │  frontend    │  │   api        │  │ forecast-service│  │
│  │  (nginx)     │  │   (golang)   │  │  (python)       │  │
│  │  :80         │  │   :8081      │  │  :8082          │  │
│  └──────────────┘  └──────────────┘  └─────────────────┘  │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │ keycloak     │  │ victoriametrics │ │  PostgreSQL    │  │
│  │  :8080       │  │   :8428      │  │  :5432          │  │
│  └──────────────┘  └──────────────┘  └─────────────────┘  │
│                                                              │
│  Networks:                                                   │
│  └─ default (bridge)                                        │
│                                                              │
│  Volumes:                                                    │
│  ├─ keycloak-db-data                                        │
│  ├─ app-db-data                                             │
│  └─ victoria-data                                           │
└─────────────────────────────────────────────────────────────┘
```

## Security Considerations

```
Current:
  ├─ No authentication on forecast endpoint
  ├─ CORS enabled (all origins)
  └─ Input validation (Pydantic)

Recommended for Production:
  ├─ Add API key or JWT authentication
  ├─ Restrict CORS to specific origins
  ├─ Add rate limiting
  ├─ Enable HTTPS/TLS
  ├─ Add request logging
  └─ Implement audit trail
```

## Scalability

```
Horizontal Scaling:
  ├─ Multiple forecast-service instances
  ├─ Load balancer (nginx/HAProxy)
  └─ Shared VictoriaMetrics backend

Vertical Scaling:
  ├─ Increase CPU cores (Prophet benefits)
  ├─ Increase memory (large datasets)
  └─ SSD storage (VictoriaMetrics)

Optimization:
  ├─ Cache forecast results (Redis)
  ├─ Async job processing (Celery)
  ├─ Model persistence (save trained models)
  └─ Data sampling (reduce historical data)
```

## Monitoring & Observability

```
Logs:
  ├─ Application logs (stdout/stderr)
  ├─ Docker logs (docker-compose logs)
  └─ Log level: DEBUG, INFO, WARNING, ERROR

Metrics:
  ├─ Request count
  ├─ Response time
  ├─ Error rate
  └─ Resource usage (CPU, memory)

Health Checks:
  ├─ /health endpoint
  ├─ Docker healthcheck
  └─ Dependency checks (VictoriaMetrics)

Tracing (Future):
  ├─ OpenTelemetry
  ├─ Jaeger/Zipkin
  └─ Distributed tracing
```

## Future Architecture

```
Potential Enhancements:

┌────────────────────────────────────────────────────────────┐
│                  Enhanced Architecture                      │
└────────────────────────────────────────────────────────────┘

                  ┌──────────────┐
                  │   Frontend   │
                  └──────┬───────┘
                         │
                         ▼
                  ┌──────────────┐
                  │  API Gateway │
                  │  (Kong/Tyk)  │
                  └──────┬───────┘
                         │
           ┌─────────────┼─────────────┐
           │             │             │
           ▼             ▼             ▼
    ┌──────────┐  ┌─────────────┐  ┌──────────┐
    │ Go API   │  │  Forecast   │  │  Other   │
    │          │  │  Service    │  │ Services │
    └──────────┘  └─────┬───────┘  └──────────┘
                        │
                        │ Async Jobs
                        ▼
                  ┌─────────────┐
                  │ Message     │
                  │ Queue       │
                  │ (RabbitMQ)  │
                  └─────┬───────┘
                        │
                        ▼
                  ┌─────────────┐
                  │ Worker Pool │
                  │ (Celery)    │
                  └─────┬───────┘
                        │
                        ▼
                  ┌─────────────┐
                  │    Cache    │
                  │   (Redis)   │
                  └─────────────┘
```


