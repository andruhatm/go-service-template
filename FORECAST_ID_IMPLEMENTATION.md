# Forecast ID Label Implementation

**Date**: January 13, 2026  
**Status**: ✅ **IMPLEMENTED**

## Problem Statement

When creating multiple forecasts for the same metric-object pair, they were overwriting each other in VictoriaMetrics because they had identical labels:

```promql
test{name="enb27738",type="forecast"}  ← All forecasts had same labels!
```

This made it impossible to:
- Keep historical forecasts for comparison
- A/B test different forecasting parameters
- Track forecast accuracy over time
- Maintain multiple forecast scenarios

## Solution

Added `forecast_id` label to uniquely identify each forecast using the UUID from the `forecasts` table:

```promql
test{name="enb27738",type="forecast",forecast_id="550e8400-e29b-41d4-a716-446655440000"}
test{name="enb27738",type="forecast",forecast_id="661f9510-f39c-52e5-b827-557766551111"}
test{name="enb27738",type="forecast",forecast_id="772g0621-g40d-63f6-c938-668877662222"}
```

Now each forecast is stored separately and can be queried individually or compared.

---

## Architecture Flow

```
┌──────────────┐     ┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Frontend   │────▶│  Go Backend │────▶│ Forecast Service │────▶│ VictoriaMetrics │
│   (Angular)  │     │  (forecast  │     │    (Python)      │     │                 │
│              │     │   handler)  │     │                  │     │                 │
└──────────────┘     └─────────────┘     └──────────────────┘     └─────────────────┘
                            │                      │
                            ▼                      ▼
                     ┌─────────────┐        Writes with labels:
                     │  PostgreSQL │        {name="X",
                     │  forecasts  │         type="forecast",
                     │   table     │         forecast_id="UUID"}
                     └─────────────┘
                     
                     Stores:
                     - forecast_id (UUID)
                     - parameters
                     - status
                     - results
```

---

## Changes Made

### 1. Go Backend (`forecast_handler.go`)

**Modified**: `triggerForecastService()` function

```go
// BEFORE:
reqBody := map[string]interface{}{
    "metric_name":             forecast.MetricName,
    "mon_obj":                 forecast.MonObjectName,
    // ... other fields
}

// AFTER:
reqBody := map[string]interface{}{
    "forecast_id":             forecast.ID, // ← Added this
    "metric_name":             forecast.MetricName,
    "mon_obj":                 forecast.MonObjectName,
    // ... other fields
}
```

### 2. Python Forecast Service

#### a. `models.py` - Request Model

```python
class ForecastRequest(BaseModel):
    forecast_id: Optional[str] = Field(None, description="Unique forecast identifier")
    metric_name: str = Field(...)
    mon_obj: str = Field(...)
    # ... other fields
```

#### b. `forecast_service.py` - Service Layer

```python
def forecast_and_write(
    self,
    # ... existing parameters
    forecast_id: str = None  # ← Added
) -> dict:
    # Pass forecast_id to write method
    self.victoria_client.write_forecast(
        metric_name=metric_name,
        mon_obj=mon_obj,
        forecast_df=forecast_df,
        forecast_id=forecast_id  # ← Added
    )
```

#### c. `victoria_client.py` - VictoriaMetrics Client

```python
def write_forecast(
    self,
    metric_name: str,
    mon_obj: str,
    forecast_df: pd.DataFrame,
    forecast_id: Optional[str] = None  # ← Added
) -> None:
    for _, row in forecast_df.iterrows():
        timestamp_ms = int(row['ds'].timestamp() * 1000)
        value = row['yhat']
        
        if forecast_id:
            # New format with forecast_id
            line = f'{metric_name}{{name="{mon_obj}",type="forecast",forecast_id="{forecast_id}"}} {value} {timestamp_ms}'
        else:
            # Fallback for backward compatibility
            line = f'{metric_name}{{name="{mon_obj}",type="forecast"}} {value} {timestamp_ms}'
        
        lines.append(line)
```

#### d. `main.py` - API Endpoint

```python
result = forecast_service.forecast_and_write(
    # ... existing parameters
    forecast_id=request.forecast_id  # ← Added
)
```

---

## Label Format Specification

### Complete Label Structure

```promql
metric_name{
  name="monitoring_object_identifier",
  type="actual|forecast",
  forecast_id="uuid-v4-string"  ← Optional, only for forecasts
}
```

### Examples

#### 1. Historical/Actual Data
```promql
RRC_Setup_Success_Rate{name="enb27738",type="actual"}
PRB_Utilization_Mean{name="cell_001",type="actual"}
```

#### 2. Single Forecast (without forecast_id - backward compatible)
```promql
RRC_Setup_Success_Rate{name="enb27738",type="forecast"}
```

#### 3. Multiple Forecasts (with forecast_id)
```promql
# Forecast created on Jan 10 with conservative parameters
RRC_Setup_Success_Rate{name="enb27738",type="forecast",forecast_id="550e8400-e29b-41d4-a716-446655440000"}

# Forecast created on Jan 11 with aggressive parameters
RRC_Setup_Success_Rate{name="enb27738",type="forecast",forecast_id="661f9510-f39c-52e5-b827-557766551111"}

# Forecast created on Jan 12 with latest data
RRC_Setup_Success_Rate{name="enb27738",type="forecast",forecast_id="772g0621-g40d-63f6-c938-668877662222"}
```

---

## Query Examples

### 1. Get Latest Forecast for a Metric

```sql
-- Get latest forecast from database
SELECT id, metric_name, mon_object_name, created_at, status
FROM forecasts
WHERE metric_name = 'RRC_Setup_Success_Rate'
  AND mon_object_name = 'enb27738'
  AND status = 'completed'
ORDER BY created_at DESC
LIMIT 1;
```

```promql
# Query forecast data from VictoriaMetrics
RRC_Setup_Success_Rate{name="enb27738",type="forecast",forecast_id="550e8400-..."}
```

### 2. Compare Multiple Forecasts

```promql
# Query all forecasts for comparison
RRC_Setup_Success_Rate{name="enb27738",type="forecast"}
```

This will return multiple time series, one for each forecast_id.

### 3. Query Specific Forecast

```promql
RRC_Setup_Success_Rate{name="enb27738",type="forecast",forecast_id="550e8400-e29b-41d4-a716-446655440000"}
```

### 4. Actual vs Forecast Comparison

```promql
# Both actual and specific forecast
RRC_Setup_Success_Rate{name="enb27738"} and 
(
  type="actual" or 
  (type="forecast" and forecast_id="550e8400-...")
)
```

### 5. Latest Forecast Only (Application Logic)

```typescript
// 1. Get latest forecast_id from API
const response = await fetch('/api/forecasts?mon_object=enb27738&metric=RRC_Setup_Success_Rate&limit=1');
const forecast = await response.json();
const forecastId = forecast.forecasts[0].id;

// 2. Query VictoriaMetrics with that forecast_id
const query = `RRC_Setup_Success_Rate{name="enb27738",type="forecast",forecast_id="${forecastId}"}`;
```

---

## Database Schema

The `forecasts` table already exists with the necessary structure:

```sql
CREATE TABLE IF NOT EXISTS forecasts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),  ← Used as forecast_id label
    user_id VARCHAR(255) NOT NULL,
    mon_object_name VARCHAR(255) NOT NULL,
    metric_name VARCHAR(255) NOT NULL,
    from_timestamp BIGINT NOT NULL,
    forecast_periods INTEGER NOT NULL,
    freq VARCHAR(10) NOT NULL DEFAULT 'H',
    step VARCHAR(20) DEFAULT '1h',
    seasonality_mode VARCHAR(20) DEFAULT 'additive',
    changepoint_prior_scale DECIMAL(5,4) DEFAULT 0.05,
    status VARCHAR(50) DEFAULT 'pending',
    forecast_start_date TIMESTAMP,
    forecast_end_date TIMESTAMP,
    forecast_points INTEGER,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## API Usage

### Create Forecast (via Go Backend)

```bash
curl -X POST http://localhost:8080/api/forecasts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "mon_object_name": "enb27738",
    "metric_name": "RRC_Setup_Success_Rate",
    "from_timestamp": 1704067200,
    "forecast_periods": 720,
    "freq": "H",
    "step": "1h",
    "seasonality_mode": "additive",
    "changepoint_prior_scale": 0.02
  }'
```

**Response**:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "user-123",
  "mon_object_name": "enb27738",
  "metric_name": "RRC_Setup_Success_Rate",
  "status": "pending",
  "created_at": "2026-01-13T00:00:00Z",
  ...
}
```

The backend will:
1. Create a record in `forecasts` table with UUID
2. Trigger forecast-service with `forecast_id`
3. Forecast-service writes to VictoriaMetrics with `forecast_id` label

### List Forecasts

```bash
curl http://localhost:8080/api/forecasts?limit=10 \
  -H "Authorization: Bearer $TOKEN"
```

**Response**:
```json
{
  "forecasts": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "metric_name": "RRC_Setup_Success_Rate",
      "mon_object_name": "enb27738",
      "status": "completed",
      "forecast_points": 720,
      "created_at": "2026-01-13T00:00:00Z"
    },
    ...
  ],
  "total": 15,
  "limit": 10,
  "offset": 0
}
```

### Direct Call to Forecast Service (with forecast_id)

```bash
curl -X POST http://localhost:8082/api/v1/forecast \
  -H "Content-Type: application/json" \
  -d '{
    "forecast_id": "550e8400-e29b-41d4-a716-446655440000",
    "metric_name": "RRC_Setup_Success_Rate",
    "mon_obj": "enb27738",
    "from_timestamp": 1704067200,
    "forecast_periods": 720,
    "freq": "H",
    "step": "1h",
    "seasonality_mode": "additive",
    "changepoint_prior_scale": 0.02
  }'
```

---

## Frontend Integration

### TypeScript Example

```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Forecast {
  id: string;
  metric_name: string;
  mon_object_name: string;
  status: string;
  forecast_start_date?: string;
  forecast_end_date?: string;
  forecast_points?: number;
  created_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class ForecastService {
  private apiUrl = 'http://localhost:8080/api';

  constructor(private http: HttpClient) {}

  // Create new forecast
  createForecast(request: any): Observable<Forecast> {
    return this.http.post<Forecast>(`${this.apiUrl}/forecasts`, request);
  }

  // List user's forecasts
  listForecasts(monObject?: string, metric?: string): Observable<any> {
    let url = `${this.apiUrl}/forecasts?limit=50`;
    if (monObject) url += `&mon_object=${monObject}`;
    if (metric) url += `&metric=${metric}`;
    return this.http.get(url);
  }

  // Get specific forecast
  getForecast(id: string): Observable<Forecast> {
    return this.http.get<Forecast>(`${this.apiUrl}/forecasts/${id}`);
  }

  // Build VictoriaMetrics query for specific forecast
  buildForecastQuery(forecast: Forecast): string {
    return `${forecast.metric_name}{name="${forecast.mon_object_name}",type="forecast",forecast_id="${forecast.id}"}`;
  }

  // Build query for actual + specific forecast
  buildComparisonQuery(forecast: Forecast): string[] {
    return [
      `${forecast.metric_name}{name="${forecast.mon_object_name}",type="actual"}`,
      `${forecast.metric_name}{name="${forecast.mon_object_name}",type="forecast",forecast_id="${forecast.id}"}`
    ];
  }
}
```

### Dashboard Widget Example

```typescript
export class ForecastChartComponent implements OnInit {
  forecasts: Forecast[] = [];
  selectedForecastId: string;

  ngOnInit() {
    // Load available forecasts for this metric
    this.forecastService.listForecasts(this.monObject, this.metricName)
      .subscribe(response => {
        this.forecasts = response.forecasts;
        if (this.forecasts.length > 0) {
          // Auto-select latest forecast
          this.selectedForecastId = this.forecasts[0].id;
          this.loadChartData();
        }
      });
  }

  loadChartData() {
    const queries = [
      // Actual data
      `${this.metricName}{name="${this.monObject}",type="actual"}`,
      // Selected forecast
      `${this.metricName}{name="${this.monObject}",type="forecast",forecast_id="${this.selectedForecastId}"}`
    ];

    // Query VictoriaMetrics and render chart
    // ...
  }

  onForecastChange(forecastId: string) {
    this.selectedForecastId = forecastId;
    this.loadChartData();
  }
}
```

```html
<div class="forecast-selector">
  <label>Select Forecast:</label>
  <select [(ngModel)]="selectedForecastId" (change)="onForecastChange($event.target.value)">
    <option *ngFor="let f of forecasts" [value]="f.id">
      {{ f.created_at | date:'short' }} - {{ f.status }}
    </option>
  </select>
</div>

<div class="chart-container">
  <!-- Chart showing actual + selected forecast -->
</div>
```

---

## Benefits

### 1. **Multiple Forecast Scenarios**
- Test different parameters (additive vs multiplicative)
- Compare conservative vs aggressive predictions
- A/B test forecasting models

### 2. **Historical Tracking**
- Keep all previous forecasts
- Compare forecast accuracy over time
- Analyze which parameters work best

### 3. **User Isolation**
- Each user can have their own forecasts
- No conflicts between users
- Easy to manage and delete

### 4. **Audit Trail**
- Full history in `forecasts` table
- Know who created what forecast when
- Track forecast performance

### 5. **Flexible Querying**
- Query all forecasts: `type="forecast"`
- Query specific forecast: `forecast_id="..."`
- Query latest: Application logic + DB
- Compare multiple: Select multiple forecast_ids

---

## Testing

### Test Multiple Forecasts

```bash
#!/bin/bash
# Create 3 forecasts with different parameters

# Conservative
curl -X POST http://localhost:8080/api/forecasts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "mon_object_name": "enb27738",
    "metric_name": "test",
    "from_timestamp": 1759960000,
    "forecast_periods": 24,
    "freq": "H",
    "seasonality_mode": "additive",
    "changepoint_prior_scale": 0.01
  }'

sleep 15

# Moderate
curl -X POST http://localhost:8080/api/forecasts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "mon_object_name": "enb27738",
    "metric_name": "test",
    "from_timestamp": 1759960000,
    "forecast_periods": 24,
    "freq": "H",
    "seasonality_mode": "additive",
    "changepoint_prior_scale": 0.05
  }'

sleep 15

# Aggressive
curl -X POST http://localhost:8080/api/forecasts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "mon_object_name": "enb27738",
    "metric_name": "test",
    "from_timestamp": 1759960000,
    "forecast_periods": 24,
    "freq": "H",
    "seasonality_mode": "multiplicative",
    "changepoint_prior_scale": 0.15
  }'
```

### Verify in VictoriaMetrics

```bash
# List all forecasts for the metric
curl -s -G 'http://localhost:8428/api/v1/label/forecast_id/values' \
  --data-urlencode 'match[]=test{name="enb27738",type="forecast"}' | jq '.'
```

**Expected Output**:
```json
{
  "status": "success",
  "data": [
    "550e8400-e29b-41d4-a716-446655440000",
    "661f9510-f39c-52e5-b827-557766551111",
    "772g0621-g40d-63f6-c938-668877662222"
  ]
}
```

---

## Backward Compatibility

The implementation maintains backward compatibility:

1. **forecast_id is optional** in the API
2. **Fallback behavior** when forecast_id is not provided:
   ```python
   if forecast_id:
       # Use new format
       line = f'metric{{name="X",type="forecast",forecast_id="{forecast_id}"}}'
   else:
       # Use old format (no forecast_id)
       line = f'metric{{name="X",type="forecast"}}'
   ```

3. **Existing forecasts** without forecast_id will continue to work
4. **Direct calls** to forecast-service without forecast_id still work

---

## Migration Strategy

### For Existing Systems

1. **No data migration needed** - old forecasts can coexist
2. **Update code** - deploy new version
3. **Start using forecast_id** - new forecasts will have it
4. **Optional cleanup** - delete old forecasts without forecast_id

```bash
# Delete old forecasts without forecast_id (optional)
curl -X POST 'http://localhost:8428/api/v1/admin/tsdb/delete_series?match[]=test{name="enb27738",type="forecast"}' \
  --data-urlencode 'match[]=test{name="enb27738",type="forecast",forecast_id=""}'
```

---

## Next Steps

1. ✅ Rebuild forecast-service container
2. ✅ Rebuild go-api container
3. ⬜ Update frontend to show forecast selector
4. ⬜ Implement forecast comparison UI
5. ⬜ Add forecast accuracy tracking
6. ⬜ Implement forecast cleanup (delete old forecasts)

---

## References

- [FORECASTING_SERVICE_GUIDE.md](FORECASTING_SERVICE_GUIDE.md) - Main service documentation
- [FORECAST_PARAMETERS_GUIDE.md](FORECAST_PARAMETERS_GUIDE.md) - Optimal parameters for metrics
- [FORECAST_SERVICE_LABEL_FIX.md](FORECAST_SERVICE_LABEL_FIX.md) - Label format fix documentation
- VictoriaMetrics Labels: https://docs.victoriametrics.com/keyConcepts.html#labels

---

## Conclusion

✅ **Successfully implemented forecast_id label to uniquely identify each forecast in VictoriaMetrics.**

This allows:
- Multiple forecasts for the same metric-object pair
- Historical forecast tracking
- Forecast comparison and accuracy analysis
- Better user experience with forecast selection

The implementation is backward compatible and doesn't require data migration.

