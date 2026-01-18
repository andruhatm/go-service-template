# Label Format Migration Guide

## Overview

The forecast service has been updated to use a new label format that better aligns with time-series best practices and improves query clarity.

## Changes

### Old Format (Deprecated)
```promql
metric_name{mon_obj="server-01"}                    # All data (actual + forecast)
metric_name{mon_obj="server-01", type="forecast"}   # Only forecast
```

### New Format (Current)
```promql
metric_name{name="server-01", type="actual"}    # Only actual/historical data
metric_name{name="server-01", type="forecast"}  # Only forecast data
metric_name{name="server-01"}                   # All data (both types)
```

## Key Differences

| Aspect | Old Format | New Format |
|--------|-----------|------------|
| Object identifier | `mon_obj` | `name` |
| Actual data label | No label | `type="actual"` |
| Forecast data label | `type="forecast"` | `type="forecast"` |
| Query clarity | Implicit actual data | Explicit type labels |

## Benefits

1. **Explicit Type Labels**: Both actual and forecast data are explicitly labeled
2. **Better Filtering**: Easy to filter by data type in queries
3. **Clearer Intent**: Query intent is immediately obvious
4. **Standard Naming**: `name` is more common in Prometheus/Victoria ecosystems

## API Usage

### The API remains backwards compatible

The API still accepts `mon_obj` parameter:

```json
{
  "metric_name": "RRC_Setup_Success_Rate",
  "mon_obj": "enb27738",
  "from_timestamp": 1704067200,
  "forecast_periods": 720,
  "freq": "H"
}
```

**Internally**, the service maps:
- `mon_obj` → `name` label in VictoriaMetrics
- Historical data queried with: `metric_name{name="enb27738", type="actual"}`
- Forecast written with: `metric_name{name="enb27738", type="forecast"}`

## Query Examples

### Query Only Actual Data

```bash
# Get historical measurements
curl 'http://localhost:8428/api/v1/query_range?query=PRB_Utilization_Mean{name="enb27738",type="actual"}&start=1704067200&end=1704153600&step=1h'
```

### Query Only Forecast Data

```bash
# Get forecast predictions
curl 'http://localhost:8428/api/v1/query_range?query=PRB_Utilization_Mean{name="enb27738",type="forecast"}&start=1704153600&end=1704240000&step=1h'
```

### Query Both (For Comparison)

```bash
# Get both actual and forecast for comparison
curl 'http://localhost:8428/api/v1/query_range?query=PRB_Utilization_Mean{name="enb27738"}&start=1704067200&end=1704240000&step=1h'
```

### PromQL for Grafana

```promql
# Show actual data as one series
PRB_Utilization_Mean{name="enb27738", type="actual"}

# Show forecast data as another series
PRB_Utilization_Mean{name="enb27738", type="forecast"}

# Both in same graph with legend showing type
PRB_Utilization_Mean{name="enb27738"}
```

### Advanced Filtering

```promql
# All actual data for multiple nodes
{type="actual", name=~"enb.*"}

# All forecasts for a specific metric across all nodes
RRC_Setup_Success_Rate{type="forecast"}

# Compare actual vs forecast for multiple metrics
{name="enb27738", type="actual"} or {name="enb27738", type="forecast"}

# Calculate difference between forecast and actual (for validation)
PRB_Utilization_Mean{name="enb27738", type="actual"} 
- 
PRB_Utilization_Mean{name="enb27738", type="forecast"} offset 24h
```

## Data Ingestion

### Historical/Actual Data Format

When ingesting actual measurements into VictoriaMetrics, use:

```bash
# Prometheus exposition format
curl -X POST http://localhost:8428/api/v1/import/prometheus -d '
PRB_Utilization_Mean{name="enb27738",type="actual"} 65.5 1704067200000
RRC_Setup_Success_Rate{name="enb27738",type="actual"} 99.2 1704067200000
'
```

### Forecast Data Format (Automatic)

The forecast service automatically writes forecasts with the correct labels:

```
PRB_Utilization_Mean{name="enb27738",type="forecast"} 67.3 1704153600000
```

## Migration Checklist

If you're migrating from the old format:

- [ ] Update data ingestion scripts to add `type="actual"` label
- [ ] Update monitoring dashboards to use `name` instead of `mon_obj`
- [ ] Update alert rules to filter by `type="actual"` for real-time alerts
- [ ] Update queries to explicitly specify `type="actual"` or `type="forecast"`
- [ ] Test forecast service with new label format
- [ ] Update documentation and examples

## Dashboard Configuration

### Grafana Variable for Node Selection

```
# Variable: node
Query: label_values(name)
```

### Grafana Panel Query

```promql
# Actual data
PRB_Utilization_Mean{name="$node", type="actual"}

# Forecast data
PRB_Utilization_Mean{name="$node", type="forecast"}
```

### Grafana Alert (Only on Actual Data)

```promql
# Alert when actual PRB utilization exceeds 80%
PRB_Utilization_Mean{type="actual"} > 80
```

**Important**: Always use `type="actual"` in alerts to avoid alerting on forecast data!

## FAQ

### Q: Do I need to change my API calls?

**A**: No, the API still accepts `mon_obj` parameter. The label translation happens internally.

### Q: What happens to old data without type labels?

**A**: Old data without `type` labels will not be queried by the forecast service. You should:
1. Re-import historical data with `type="actual"` label, OR
2. Keep old data as-is and start using new format going forward

### Q: Can I query old and new format together?

**A**: Yes, but you need to query them separately:

```promql
# Old format (if still present)
metric_name{mon_obj="enb27738", type!="forecast"}

# New format
metric_name{name="enb27738", type="actual"}

# Combined (if needed during migration)
metric_name{mon_obj="enb27738", type!="forecast"} or metric_name{name="enb27738", type="actual"}
```

### Q: Why not just use `__name__` magic label?

**A**: Using explicit `name` label provides better query performance and clearer semantics. It also allows for future extensions like adding `cluster`, `region`, etc.

### Q: Can I use different label names?

**A**: The forecast service is hardcoded to use `name` and `type` labels. Changing this would require modifying `victoria_client.py`.

## Performance Considerations

### Query Performance

```promql
# ✅ GOOD - Uses labels for filtering
PRB_Utilization_Mean{name="enb27738", type="actual"}

# ❌ BAD - Regex on metric name
{__name__=~".*Utilization.*", name="enb27738"}

# ✅ GOOD - Specific metric + label filters
PRB_Utilization_Mean{type="actual", name=~"enb.*"}
```

### Storage Optimization

- Each label combination creates a separate time series
- `type` label adds minimal overhead (only 2 values: "actual" and "forecast")
- `name` label should have reasonable cardinality (don't use UUIDs or high-cardinality IDs)

## Examples by Use Case

### 1. Real-time Monitoring Dashboard

Show only actual data for operational monitoring:

```promql
PRB_Utilization_Mean{type="actual"}
RRC_Setup_Success_Rate{type="actual"}
```

### 2. Capacity Planning Dashboard

Show actual historical data + forecast:

```promql
# Actual (last 7 days)
PRB_Utilization_Mean{name="enb27738", type="actual"}[7d]

# Forecast (next 30 days)
PRB_Utilization_Mean{name="enb27738", type="forecast"}
```

### 3. Forecast Accuracy Analysis

Compare forecast vs actual after the fact:

```promql
# What was forecasted for yesterday
PRB_Utilization_Mean{name="enb27738", type="forecast"} offset 24h

# What actually happened yesterday
PRB_Utilization_Mean{name="enb27738", type="actual"} offset 24h

# Calculate error
abs(
  PRB_Utilization_Mean{name="enb27738", type="actual"} offset 24h
  -
  PRB_Utilization_Mean{name="enb27738", type="forecast"} offset 48h
)
```

### 4. Batch Processing

Generate forecasts for multiple nodes:

```bash
#!/bin/bash

NODES=("enb27738" "enb27739" "enb27740")
METRICS=("PRB_Utilization_Mean" "RRC_Setup_Success_Rate")

for node in "${NODES[@]}"; do
  for metric in "${METRICS[@]}"; do
    curl -X POST http://localhost:8082/api/v1/forecast \
      -H "Content-Type: application/json" \
      -d "{
        \"metric_name\": \"$metric\",
        \"mon_obj\": \"$node\",
        \"from_timestamp\": $(date -d '90 days ago' +%s),
        \"forecast_periods\": 720,
        \"freq\": \"H\"
      }"
  done
done
```

Then query all forecasts:

```promql
# All forecasts
{type="forecast"}

# Forecasts for specific metric
RRC_Setup_Success_Rate{type="forecast"}

# Forecasts for specific nodes
{type="forecast", name=~"enb2773[89]"}
```

## Troubleshooting

### No data returned for actual data query

**Problem**: Query returns empty result

```promql
PRB_Utilization_Mean{name="enb27738", type="actual"}  # Returns nothing
```

**Solutions**:
1. Check if data has the correct labels:
   ```promql
   # See all labels for this metric
   PRB_Utilization_Mean{name="enb27738"}
   ```

2. Verify data is being ingested with correct labels:
   ```bash
   curl 'http://localhost:8428/api/v1/series?match[]=PRB_Utilization_Mean'
   ```

3. Check if data is using old `mon_obj` label:
   ```promql
   PRB_Utilization_Mean{mon_obj="enb27738"}
   ```

### Forecast service can't find historical data

**Problem**: Forecast service returns "No historical data found"

**Solution**: Ensure your actual data has `type="actual"` label. The forecast service specifically queries:
```promql
metric_name{name="xxx", type="actual"}
```

If your data doesn't have this label, it won't be found.

## Summary

The new label format provides:
- ✅ Clear distinction between actual and forecast data
- ✅ Standard label naming (`name` instead of `mon_obj`)
- ✅ Better query expressiveness
- ✅ Easier filtering and aggregation
- ✅ Backwards compatible API

Start using the new format for all new data ingestion and queries!

