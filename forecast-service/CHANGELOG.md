# Forecast Service Changelog

## [1.1.0] - 2026-01-13

### Changed - BREAKING CHANGE ⚠️

#### New Label Format for Metrics

The forecast service now uses a standardized label format for better clarity and query expressiveness:

**Before:**
```promql
metric_name{mon_obj="enb27738"}                    # Actual data (implicit)
metric_name{mon_obj="enb27738", type="forecast"}   # Forecast data
```

**After:**
```promql
metric_name{name="enb27738", type="actual"}    # Actual data (explicit)
metric_name{name="enb27738", type="forecast"}  # Forecast data
```

#### Key Changes:

1. **Label name change**: `mon_obj` → `name`
2. **Explicit type labels**: Actual data now has `type="actual"` label
3. **Better filtering**: Easy to distinguish between actual and forecast data

#### Files Modified:

- `victoria_client.py`: Updated query and write methods to use new label format
- `forecast_service.py`: No changes needed (uses victoria_client)
- `main.py`: No changes needed (API unchanged)
- `models.py`: No changes needed (API still accepts `mon_obj`)

#### API Compatibility:

✅ **The API remains backwards compatible!**

The API still accepts `mon_obj` parameter:
```json
{
  "metric_name": "PRB_Utilization_Mean",
  "mon_obj": "enb27738",
  ...
}
```

Internally, it's mapped to `name` label in VictoriaMetrics.

#### Migration Required:

If you have existing data or queries:

1. **Data Ingestion**: Update your data collectors to add `type="actual"` label:
   ```
   PRB_Utilization_Mean{name="enb27738",type="actual"} 65.5
   ```

2. **Queries**: Update your PromQL queries to use new format:
   ```promql
   # Old
   metric{mon_obj="enb27738"}
   
   # New
   metric{name="enb27738", type="actual"}
   ```

3. **Dashboards**: Update Grafana/visualization dashboards
4. **Alerts**: Update alert rules to use `type="actual"` (important!)

#### Testing:

New test script available:
```bash
./test_forecast_with_labels.sh
```

This script validates:
- Data ingestion with new labels
- Forecast generation
- Label format verification
- Query functionality

#### Documentation:

- **LABEL_FORMAT_MIGRATION.md**: Comprehensive migration guide
- **FORECASTING_SERVICE_GUIDE.md**: Updated with new examples
- **FORECAST_PARAMETERS_GUIDE.md**: Updated query examples

---

## [1.0.0] - 2026-01-01

### Added

- Initial release of forecast service
- Facebook Prophet integration
- VictoriaMetrics read/write support
- RESTful API for forecast generation
- Health check endpoint
- Comprehensive documentation

### Features

- Time-series forecasting with Prophet
- Configurable forecast periods and frequencies
- Customizable seasonality modes (additive/multiplicative)
- Adjustable trend flexibility (changepoint_prior_scale)
- Automatic forecast labeling
- Error handling and validation

---

## Future Plans

### [1.2.0] - Planned

- [ ] Confidence intervals in API response
- [ ] Batch forecasting endpoint (multiple metrics)
- [ ] Forecast accuracy metrics
- [ ] Model caching for performance
- [ ] Support for custom Prophet parameters (holidays, regressors)

### [2.0.0] - Future

- [ ] Multiple forecasting algorithms (ARIMA, LSTM)
- [ ] Scheduled forecasting jobs
- [ ] Webhook notifications
- [ ] Model performance comparison
- [ ] Auto-tuning of Prophet parameters

