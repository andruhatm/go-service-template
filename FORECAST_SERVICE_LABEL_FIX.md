# Forecast Service Label Format Fix - Verification Report

**Date**: January 13, 2026  
**Status**: ✅ **COMPLETED AND VERIFIED**

## Summary

Successfully updated the forecast service to use the correct label format: `{name="enb27738",type="actual"}` and `{name="enb27738",type="forecast"}` instead of the old format `{mon_obj="enb27738"}`.

---

## Changes Made

### 1. Code Already Updated (No Changes Needed)

The following files **already had the correct code**:

#### `forecast-service/victoria_client.py`
- **Line 49**: Query uses `{name="...",type="actual"}` format
- **Line 127**: Write uses `{name="...",type="forecast"}` format

```python
# Reading actual data
promql = f'{metric_name}{{name="{mon_obj}",type="actual"}}'

# Writing forecast data
line = f'{metric_name}{{name="{mon_obj}",type="forecast"}} {value} {timestamp_ms}'
```

### 2. Container Rebuild

**Problem**: The Docker container was running old code despite correct source files.

**Solution**: Rebuilt the forecast-service container to load the updated code:
```bash
docker-compose up -d --build forecast-service
```

### 3. Dependency Fix

**Problem**: Prophet library had AttributeError: `'Prophet' object has no attribute 'stan_backend'`

**Solution**: 
- Added `cmdstanpy==1.2.0` to `requirements.txt`
- Added logging suppression in `forecast_service.py` to reduce noise

---

## Verification Steps

### Step 1: Load Test Data ✅

```bash
curl -X POST http://localhost:8428/api/v1/import/prometheus \
  --data-binary @victoria-samples/test_enb27738_past_3_months_hourly.prom
```

**Result**: 2162 data points loaded with `{name="enb27738",type="actual"}` labels

### Step 2: Verify Data Exists ✅

```bash
curl -s -G 'http://localhost:8428/api/v1/query_range' \
  --data-urlencode 'query=test{name="enb27738",type="actual"}' \
  --data-urlencode 'start=1759960000' \
  --data-urlencode 'end=1768254309' \
  --data-urlencode 'step=1h' | jq '.data.result[0].metric'
```

**Result**:
```json
{
  "__name__": "test",
  "name": "enb27738",
  "type": "actual"
}
```

### Step 3: Generate Forecast ✅

```bash
curl -X POST http://localhost:8082/api/v1/forecast \
  -H "Content-Type: application/json" \
  -d '{
    "metric_name": "test",
    "mon_obj": "enb27738",
    "from_timestamp": 1759960000,
    "forecast_periods": 24,
    "freq": "H",
    "step": "1h",
    "seasonality_mode": "additive",
    "changepoint_prior_scale": 0.05
  }'
```

**Result**:
```json
{
  "status": "success",
  "message": "Forecast completed and written to VictoriaMetrics",
  "forecast_points": 24,
  "metric_name": "test",
  "mon_obj": "enb27738",
  "start_date": "2026-01-07T00:00:00",
  "end_date": "2026-01-07T23:00:00"
}
```

### Step 4: Verify Forecast Data ✅

```bash
curl -s -G 'http://localhost:8428/api/v1/query_range' \
  --data-urlencode 'query=test{name="enb27738",type="forecast"}' \
  --data-urlencode 'start=1704067200' \
  --data-urlencode 'end=1768254500' \
  --data-urlencode 'step=1h'
```

**Result**:
```json
{
  "metric": {
    "__name__": "test",
    "name": "enb27738",
    "type": "forecast"
  },
  "values": 25
}
```

### Step 5: Query Both Data Types Together ✅

```bash
curl -s -G 'http://localhost:8428/api/v1/query_range' \
  --data-urlencode 'query=test{name="enb27738"}' \
  --data-urlencode 'start=1759960000' \
  --data-urlencode 'end=1768254500' \
  --data-urlencode 'step=6h'
```

**Result**:
```json
[
  {
    "type": "actual",
    "count": 361
  },
  {
    "type": "forecast",
    "count": 5
  }
]
```

---

## Service Logs Verification

### Before Fix (Old Container)
```
victoria_client - INFO - Querying VictoriaMetrics: ... with params: {'query': 'test{mon_obj="enb27738"}', ...}
victoria_client - WARNING - No data found for metric test and mon_obj enb27738
```

### After Fix (New Container)
```
victoria_client - INFO - Querying VictoriaMetrics: ... with params: {'query': 'test{name="enb27738",type="actual"}', ...}
victoria_client - INFO - Retrieved 2162 data points from VictoriaMetrics
forecast_service - INFO - Training Prophet model with 2162 data points
```

---

## Label Format Specification

### Reading Historical Data
```promql
metric_name{name="enb27738",type="actual"}
```

### Writing Forecast Data
```promql
metric_name{name="enb27738",type="forecast"}
```

### Querying Both
```promql
# All data (actual + forecast)
metric_name{name="enb27738"}

# Only actual
metric_name{name="enb27738",type="actual"}

# Only forecast
metric_name{name="enb27738",type="forecast"}

# Both with explicit OR
metric_name{name="enb27738",type="actual"} or metric_name{name="enb27738",type="forecast"}
```

---

## Files Modified

1. **forecast-service/requirements.txt**
   - Added: `cmdstanpy==1.2.0`

2. **forecast-service/forecast_service.py**
   - Added: Prophet and cmdstanpy logging suppression (lines 84-86)

3. **forecast-service/victoria_client.py**
   - ✅ Already correct (no changes needed)

4. **forecast-service/main.py**
   - ✅ No changes needed

---

## Integration Points

### Frontend Integration

The frontend can now query metrics using the new label format:

```typescript
// Query actual data
const actualQuery = `${metricName}{name="${monObj}",type="actual"}`;

// Query forecast data
const forecastQuery = `${metricName}{name="${monObj}",type="forecast"}`;

// Query both
const bothQuery = `${metricName}{name="${monObj}"}`;
```

### Dashboard Widgets

Dashboard widgets should be updated to:
1. Query actual data with `type="actual"` label
2. Query forecast data with `type="forecast"` label
3. Display both on the same chart for comparison

---

## Testing Checklist

- [x] Rebuild forecast-service container
- [x] Load test data into VictoriaMetrics
- [x] Verify historical data query works
- [x] Generate forecast successfully
- [x] Verify forecast data written with correct labels
- [x] Query both actual and forecast data together
- [x] Check service logs for correct query format
- [x] Verify Prophet model training works
- [x] Test with 2162 historical data points
- [x] Confirm 24-hour forecast generation

---

## Known Limitations

1. **Old Data Cleanup**: If old data with `mon_obj` label exists, it won't be automatically migrated. You may need to:
   - Delete old forecast data: `curl -X POST 'http://localhost:8428/api/v1/admin/tsdb/delete_series?match[]=test{mon_obj=~".+"}'`
   - Re-import historical data with correct labels

2. **Timestamp Age**: VictoriaMetrics may show warnings for data older than `-search.cacheTimestampOffset` (default 5m). This is normal for historical data import.

---

## Next Steps

1. **Update Frontend Components**
   - Update chart widgets to use new label format
   - Add forecast visualization support
   - Implement actual vs forecast comparison views

2. **Update Documentation**
   - Update API documentation with new label format
   - Update dashboard creation guides
   - Update metric catalog with label examples

3. **Batch Forecasting**
   - Implement batch forecasting for multiple metrics
   - Use parameters from `FORECAST_PARAMETERS_GUIDE.md`
   - Schedule regular forecast updates

---

## References

- [FORECASTING_SERVICE_GUIDE.md](FORECASTING_SERVICE_GUIDE.md) - Full service documentation
- [FORECAST_PARAMETERS_GUIDE.md](FORECAST_PARAMETERS_GUIDE.md) - Optimal parameters for 3GPP metrics
- VictoriaMetrics Label Documentation: https://docs.victoriametrics.com/keyConcepts.html#labels

---

## Conclusion

✅ **The forecast service now correctly uses the `{name="...",type="..."}` label format for both reading historical data and writing forecasts.**

All verification tests passed successfully. The service is ready for production use with the updated label format.


