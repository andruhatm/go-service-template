# Forecast Parameters Guide for 3GPP Metrics

## Overview

This guide provides optimal forecasting parameters for all 3GPP metrics from the Extended Metrics Guide. All recommendations are for **monthly forecasts with hourly granularity** (720 periods).

## Label Format

The forecasting service uses the following label format:
- **Historical data**: `{name="enb27738", type="actual"}`
- **Forecast data**: `{name="enb27738", type="forecast"}`

**Note**: The API accepts `mon_obj` parameter, which is internally mapped to the `name` label in VictoriaMetrics.

## Common Parameters for All Metrics

```json
{
  "forecast_periods": 720,  // 30 days × 24 hours
  "freq": "H",              // Hourly frequency
  "step": "1h"              // VictoriaMetrics step
}
```

**Recommended Historical Data**: Minimum 30 days (720 hours), optimal 60-90 days for better seasonality detection.

---

## 1. Accessibility Metrics (10 metrics)

### Characteristics
- **Pattern**: Strong daily seasonality (business hours vs night)
- **Stability**: Very stable with occasional equipment issues
- **Trend**: Minimal long-term trend

### Forecast Parameters

| Metric | Seasonality Mode | Changepoint Scale | Notes |
|--------|-----------------|-------------------|-------|
| RRC_Setup_Success_Rate | additive | 0.01 | Highly stable, small variations |
| RRC_Setup_Failure_Rate | additive | 0.02 | Should be very low, spikes indicate issues |
| RRC_Setup_Attempts | multiplicative | 0.05 | Scales with user activity |
| RACH_Success_Rate | additive | 0.02 | Stable, congestion-dependent |
| RACH_Preamble_Attempts | multiplicative | 0.1 | High variability, traffic-dependent |
| S1_Setup_Success_Rate | additive | 0.01 | Very stable |
| Initial_Context_Setup_Success_Rate | additive | 0.01 | Very stable |
| Service_Request_Success_Rate | additive | 0.02 | Mostly stable |
| Attach_Success_Rate | additive | 0.02 | Daily patterns |
| PDN_Connection_Success_Rate | additive | 0.02 | Daily patterns |

### Example Request

```json
{
  "metric_name": "RRC_Setup_Success_Rate",
  "mon_obj": "eNodeB_001",
  "from_timestamp": 1704067200,
  "forecast_periods": 720,
  "freq": "H",
  "step": "1h",
  "seasonality_mode": "additive",
  "changepoint_prior_scale": 0.01
}
```

**Reasoning**:
- Success rates are percentages with narrow ranges → additive
- Very stable metrics → low changepoint scale
- Attempts scale with traffic → multiplicative

---

## 2. Retainability Metrics (7 metrics)

### Characteristics
- **Pattern**: Daily and weekly seasonality
- **Stability**: Stable but sensitive to coverage/interference
- **Trend**: Gradual improvement with optimizations

### Forecast Parameters

| Metric | Seasonality Mode | Changepoint Scale | Notes |
|--------|-----------------|-------------------|-------|
| RRC_Connection_Abnormal_Release_Rate | additive | 0.05 | Coverage-dependent, moderate variability |
| ERAB_Abnormal_Release_Rate | additive | 0.05 | Similar to RRC releases |
| Session_Drop_Rate | additive | 0.05 | Key KPI, monitor closely |
| UE_Context_Release_Rate | additive | 0.05 | Moderate stability |
| Radio_Link_Failure_Rate | additive | 0.08 | More variable, RF-dependent |
| Connection_Retention_Rate | additive | 0.03 | Inverse of drop rate, more stable |
| Mean_Time_Between_Failures | multiplicative | 0.1 | Can vary significantly |

### Example Request

```json
{
  "metric_name": "Session_Drop_Rate",
  "mon_obj": "cell_sector_001",
  "from_timestamp": 1704067200,
  "forecast_periods": 720,
  "freq": "H",
  "step": "1h",
  "seasonality_mode": "additive",
  "changepoint_prior_scale": 0.05
}
```

**Reasoning**:
- Drop rates are typically low percentages → additive
- Moderate variability from RF conditions → medium changepoint scale
- MTBF is duration metric with high variance → multiplicative

---

## 3. Mobility Metrics (10 metrics)

### Characteristics
- **Pattern**: Strong daily seasonality (rush hours, commute patterns)
- **Stability**: Stable with traffic-dependent variations
- **Trend**: Improves with parameter optimization

### Forecast Parameters

| Metric | Seasonality Mode | Changepoint Scale | Notes |
|--------|-----------------|-------------------|-------|
| Intra_Freq_Handover_Success_Rate | additive | 0.02 | Very stable |
| Inter_Freq_Handover_Success_Rate | additive | 0.03 | Slightly less stable |
| Inter_RAT_Handover_Success_Rate | additive | 0.05 | More complex, less stable |
| X2_Handover_Success_Rate | additive | 0.02 | Very stable |
| S1_Handover_Success_Rate | additive | 0.03 | Core network dependent |
| Handover_Preparation_Time | additive | 0.05 | Load-dependent |
| Handover_Execution_Time | additive | 0.05 | Load-dependent |
| Handover_Failure_Rate | additive | 0.05 | Inverse of success rate |
| Ping_Pong_Handover_Rate | additive | 0.08 | More variable, parameter-sensitive |
| Mobility_Interruption_Time | additive | 0.05 | Moderate variability |

### Example Request

```json
{
  "metric_name": "Intra_Freq_Handover_Success_Rate",
  "mon_obj": "eNodeB_cluster_west",
  "from_timestamp": 1704067200,
  "forecast_periods": 720,
  "freq": "H",
  "step": "1h",
  "seasonality_mode": "additive",
  "changepoint_prior_scale": 0.02
}
```

**Reasoning**:
- Handover metrics show strong commute patterns → additive works well
- Success rates are stable → low to medium changepoint scale
- Timing metrics vary with load → medium changepoint scale

---

## 4. Integrity Metrics (8 metrics)

### Characteristics
- **Pattern**: Daily patterns following traffic load
- **Stability**: RF-condition dependent, moderate variability
- **Trend**: Improves with RF optimization

### Forecast Parameters

| Metric | Seasonality Mode | Changepoint Scale | Notes |
|--------|-----------------|-------------------|-------|
| PDCP_SDU_Loss_Rate | additive | 0.1 | Sensitive to RF conditions |
| RLC_Retransmission_Rate | additive | 0.08 | RF and load dependent |
| MAC_Retransmission_Rate | additive | 0.08 | Similar to RLC |
| HARQ_Retransmission_Rate | additive | 0.1 | Most variable of retx metrics |
| FER | additive | 0.1 | RF quality indicator |
| Residual_BER | additive | 0.12 | Can fluctuate significantly |
| IP_Packet_Loss_Rate | additive | 0.08 | Transport network dependent |
| Data_Integrity_Success_Rate | additive | 0.05 | More stable (inverse metric) |

### Example Request

```json
{
  "metric_name": "PDCP_SDU_Loss_Rate",
  "mon_obj": "cell_001",
  "from_timestamp": 1704067200,
  "forecast_periods": 720,
  "freq": "H",
  "step": "1h",
  "seasonality_mode": "additive",
  "changepoint_prior_scale": 0.1
}
```

**Reasoning**:
- Loss/error rates vary but stay in low percentage range → additive
- RF conditions can change → higher changepoint scale
- Weather, interference affect these metrics → need flexibility

---

## 5. Resource Utilization Metrics (7 metrics)

### Characteristics
- **Pattern**: Strong daily/weekly patterns following user activity
- **Stability**: Predictable traffic patterns
- **Trend**: Gradual increase with subscriber growth

### Forecast Parameters

| Metric | Seasonality Mode | Changepoint Scale | Notes |
|--------|-----------------|-------------------|-------|
| PRB_Utilization_Mean | multiplicative | 0.05 | Scales with traffic growth |
| CCE_Utilization | multiplicative | 0.05 | Traffic-dependent |
| PUCCH_Utilization | multiplicative | 0.05 | User activity dependent |
| PDCCH_Utilization | multiplicative | 0.05 | Signaling load dependent |
| Licensed_Spectrum_Efficiency | multiplicative | 0.08 | Improves with optimization |
| Resource_Block_Usage_Rate | multiplicative | 0.05 | Traffic-dependent |
| Carrier_Aggregation_Utilization | multiplicative | 0.08 | Feature adoption dependent |

### Example Request

```json
{
  "metric_name": "PRB_Utilization_Mean",
  "mon_obj": "cell_sector_A",
  "from_timestamp": 1704067200,
  "forecast_periods": 720,
  "freq": "H",
  "step": "1h",
  "seasonality_mode": "multiplicative",
  "changepoint_prior_scale": 0.05
}
```

**Reasoning**:
- Utilization scales with traffic growth → multiplicative
- Strong daily patterns → Prophet handles well
- Capacity planning critical → balanced flexibility

---

## 6. Capacity Metrics (8 metrics)

### Characteristics
- **Pattern**: Strong daily patterns, weekly trends
- **Stability**: Growing trends with subscriber base
- **Trend**: Continuous growth, seasonal variations

### Forecast Parameters

| Metric | Seasonality Mode | Changepoint Scale | Notes |
|--------|-----------------|-------------------|-------|
| Max_Active_UE_DL | multiplicative | 0.1 | Peak metrics, more variable |
| Max_Active_UE_UL | multiplicative | 0.1 | Peak metrics, more variable |
| Average_Active_UE | multiplicative | 0.05 | Smoother than max |
| Peak_Connected_Users | multiplicative | 0.1 | Event-dependent |
| Connection_Density | multiplicative | 0.08 | Area-dependent, growing |
| Traffic_Volume_DL | multiplicative | 0.1 | High growth rate |
| Traffic_Volume_UL | multiplicative | 0.1 | High growth rate |
| Area_Traffic_Capacity | multiplicative | 0.08 | Network evolution dependent |

### Example Request

```json
{
  "metric_name": "Average_Active_UE",
  "mon_obj": "cell_cluster_downtown",
  "from_timestamp": 1704067200,
  "forecast_periods": 720,
  "freq": "H",
  "step": "1h",
  "seasonality_mode": "multiplicative",
  "changepoint_prior_scale": 0.05
}
```

**Reasoning**:
- All capacity metrics grow with subscriber base → multiplicative
- Peak metrics more volatile → higher changepoint scale
- Critical for capacity planning → need to catch growth trends

---

## 7. Voice Quality Metrics (8 metrics)

### Characteristics
- **Pattern**: Daily patterns (business hours vs evening)
- **Stability**: Generally stable, event-sensitive
- **Trend**: Gradual improvement with VoLTE optimization

### Forecast Parameters

| Metric | Seasonality Mode | Changepoint Scale | Notes |
|--------|-----------------|-------------------|-------|
| VoLTE_Call_Setup_Success_Rate | additive | 0.02 | Very stable KPI |
| VoLTE_Call_Drop_Rate | additive | 0.05 | Low values, event-sensitive |
| VoLTE_SRVCC_Success_Rate | additive | 0.03 | Stable but mobility-dependent |
| Voice_MOS | additive | 0.08 | Subjective, more variable |
| Voice_Packet_Loss_Rate | additive | 0.1 | Network condition dependent |
| Voice_Jitter | additive | 0.1 | Load and network dependent |
| E2E_Voice_Latency | additive | 0.08 | Core network dependent |
| VoNR_Call_Setup_Success_Rate | additive | 0.03 | 5G voice, newer metric |

### Example Request

```json
{
  "metric_name": "VoLTE_Call_Setup_Success_Rate",
  "mon_obj": "ims_core_region1",
  "from_timestamp": 1704067200,
  "forecast_periods": 720,
  "freq": "H",
  "step": "1h",
  "seasonality_mode": "additive",
  "changepoint_prior_scale": 0.02
}
```

**Reasoning**:
- Success rates are stable percentages → additive
- Quality metrics (MOS, jitter) have more variation → higher flexibility
- Voice is critical service → conservative forecasting for success rates

---

## 8. 5G Advanced Metrics (10 metrics)

### Characteristics
- **Pattern**: Newer features, evolving patterns
- **Stability**: Less historical data, more dynamic
- **Trend**: Rapid adoption and optimization phase

### Forecast Parameters

| Metric | Seasonality Mode | Changepoint Scale | Notes |
|--------|-----------------|-------------------|-------|
| Beam_Management_Success_Rate | additive | 0.05 | Feature-dependent |
| SSB_RSRP | additive | 0.1 | RF condition metric |
| Beam_Switching_Time | additive | 0.08 | Implementation-dependent |
| Massive_MIMO_Efficiency | multiplicative | 0.12 | Optimization phase |
| Network_Slice_Availability | additive | 0.02 | Should be very stable |
| Network_Slice_Isolation | additive | 0.03 | Stable by design |
| URLLC_Reliability | additive | 0.01 | Extremely stable required |
| URLLC_Latency | additive | 0.05 | Low values, stable |
| mMTC_Connection_Density | multiplicative | 0.15 | IoT growth, highly variable |
| eMBB_Peak_Data_Rate | multiplicative | 0.1 | Feature evolution dependent |

### Example Request

```json
{
  "metric_name": "Network_Slice_Availability",
  "mon_obj": "slice_embb_001",
  "from_timestamp": 1704067200,
  "forecast_periods": 720,
  "freq": "H",
  "step": "1h",
  "seasonality_mode": "additive",
  "changepoint_prior_scale": 0.02
}
```

**Reasoning**:
- New features, less predictable → higher flexibility for growth metrics
- Critical 5G features (slicing, URLLC) → very stable, low flexibility
- mMTC still in adoption phase → high flexibility

---

## 9. Control Plane Metrics (6 metrics)

### Characteristics
- **Pattern**: Signaling follows user activity patterns
- **Stability**: Generally stable, event-dependent
- **Trend**: Gradual optimization improvements

### Forecast Parameters

| Metric | Seasonality Mode | Changepoint Scale | Notes |
|--------|-----------------|-------------------|-------|
| Control_Plane_Latency | additive | 0.08 | Load-dependent |
| Idle_to_Active_Transition_Time | additive | 0.05 | Stable timing metric |
| Paging_Success_Rate | additive | 0.03 | Very stable |
| TAU_Success_Rate | additive | 0.03 | Mobility procedure, stable |
| Registration_Success_Rate | additive | 0.03 | 5G registration, stable |
| Signaling_Load | multiplicative | 0.1 | Scales with user base |

### Example Request

```json
{
  "metric_name": "Control_Plane_Latency",
  "mon_obj": "mme_pool_01",
  "from_timestamp": 1704067200,
  "forecast_periods": 720,
  "freq": "H",
  "step": "1h",
  "seasonality_mode": "additive",
  "changepoint_prior_scale": 0.08
}
```

**Reasoning**:
- Latency/timing metrics → additive with moderate flexibility
- Success rates → stable, low flexibility
- Load metrics → multiplicative, grows with users

---

## 10. User Plane Metrics (9 metrics)

### Characteristics
- **Pattern**: Strong traffic-dependent patterns
- **Stability**: User experience metrics, variable
- **Trend**: Improving with network evolution

### Forecast Parameters

| Metric | Seasonality Mode | Changepoint Scale | Notes |
|--------|-----------------|-------------------|-------|
| User_Plane_Latency | additive | 0.08 | Load and congestion dependent |
| User_Experienced_Data_Rate_DL | multiplicative | 0.1 | Network improvements |
| User_Experienced_Data_Rate_UL | multiplicative | 0.1 | Network improvements |
| Cell_Edge_User_Throughput_DL | multiplicative | 0.12 | More variable, coverage-dependent |
| Cell_Edge_User_Throughput_UL | multiplicative | 0.12 | More variable |
| Average_User_Throughput_DL | multiplicative | 0.08 | Smoother than cell edge |
| Average_User_Throughput_UL | multiplicative | 0.08 | Smoother than cell edge |
| Peak_User_Throughput_DL | multiplicative | 0.15 | Feature rollout dependent |
| Peak_User_Throughput_UL | multiplicative | 0.15 | Feature rollout dependent |

### Example Request

```json
{
  "metric_name": "User_Experienced_Data_Rate_DL",
  "mon_obj": "cell_area_urban",
  "from_timestamp": 1704067200,
  "forecast_periods": 720,
  "freq": "H",
  "step": "1h",
  "seasonality_mode": "multiplicative",
  "changepoint_prior_scale": 0.1
}
```

**Reasoning**:
- Throughput metrics improve over time → multiplicative
- User experience varies significantly → higher flexibility
- Peak metrics most volatile → highest flexibility

---

## 11. Energy Efficiency Metrics (5 metrics)

### Characteristics
- **Pattern**: Follows traffic load patterns
- **Stability**: Optimization initiatives cause trends
- **Trend**: Improvement targets, evolving

### Forecast Parameters

| Metric | Seasonality Mode | Changepoint Scale | Notes |
|--------|-----------------|-------------------|-------|
| Network_Energy_Efficiency | multiplicative | 0.1 | Optimization phase |
| UE_Energy_Efficiency | multiplicative | 0.08 | Device evolution |
| Power_Consumption_Per_Cell | additive | 0.12 | Configuration changes |
| Energy_Per_Bit | additive | 0.1 | Efficiency improvements |
| Sleep_Mode_Efficiency | additive | 0.08 | Feature optimization |

### Example Request

```json
{
  "metric_name": "Network_Energy_Efficiency",
  "mon_obj": "site_cluster_rural",
  "from_timestamp": 1704067200,
  "forecast_periods": 720,
  "freq": "H",
  "step": "1h",
  "seasonality_mode": "multiplicative",
  "changepoint_prior_scale": 0.1
}
```

**Reasoning**:
- Efficiency ratios improve → multiplicative
- Active optimization phase → higher flexibility
- Power consumption absolute values → additive

---

## 12. QoS Metrics (8 metrics)

### Characteristics
- **Pattern**: Traffic class dependent patterns
- **Stability**: Stable by QoS enforcement
- **Trend**: Gradual improvement with tuning

### Forecast Parameters

| Metric | Seasonality Mode | Changepoint Scale | Notes |
|--------|-----------------|-------------------|-------|
| QCI_1_Packet_Loss_Rate | additive | 0.05 | Voice, should be stable |
| QCI_5_Packet_Loss_Rate | additive | 0.05 | IMS signaling, stable |
| QCI_9_Packet_Loss_Rate | additive | 0.08 | Best effort, more variable |
| GBR_Bearer_Setup_Success_Rate | additive | 0.02 | QoS enforcement, stable |
| Non_GBR_Bearer_Setup_Success_Rate | additive | 0.02 | Very stable |
| QoS_Flow_Setup_Success_Rate | additive | 0.03 | 5G QoS, stable |
| PDB_Violation_Rate | additive | 0.08 | Load-dependent |
| PELR_Violation_Rate | additive | 0.08 | Load-dependent |

### Example Request

```json
{
  "metric_name": "QCI_1_Packet_Loss_Rate",
  "mon_obj": "qos_policy_engine",
  "from_timestamp": 1704067200,
  "forecast_periods": 720,
  "freq": "H",
  "step": "1h",
  "seasonality_mode": "additive",
  "changepoint_prior_scale": 0.05
}
```

**Reasoning**:
- QoS enforces stability → low to medium flexibility
- Critical traffic classes (voice) → lower flexibility
- Best effort traffic → higher flexibility

---

## 13. Coverage Metrics (6 metrics)

### Characteristics
- **Pattern**: Slowly evolving, infrastructure changes
- **Stability**: Very stable unless network expansion
- **Trend**: Gradual expansion and optimization

### Forecast Parameters

| Metric | Seasonality Mode | Changepoint Scale | Notes |
|--------|-----------------|-------------------|-------|
| Coverage_Area | multiplicative | 0.15 | Network expansion |
| Indoor_Coverage_Ratio | additive | 0.05 | DAS/small cell deployments |
| Outdoor_Coverage_Ratio | additive | 0.05 | New site deployments |
| Deep_Indoor_Penetration | additive | 0.08 | Optimization efforts |
| Cell_Range | additive | 0.1 | Antenna optimization |
| Coverage_Probability | additive | 0.05 | Statistical metric |

### Example Request

```json
{
  "metric_name": "Indoor_Coverage_Ratio",
  "mon_obj": "region_downtown",
  "from_timestamp": 1704067200,
  "forecast_periods": 720,
  "freq": "H",
  "step": "1h",
  "seasonality_mode": "additive",
  "changepoint_prior_scale": 0.05
}
```

**Reasoning**:
- Coverage area grows → multiplicative
- Coverage quality percentages → additive
- Infrastructure changes infrequent → moderate to high flexibility to catch them

---

## 14. Interference Metrics (6 metrics)

### Characteristics
- **Pattern**: Daily patterns (traffic-related interference)
- **Stability**: Moderate, RF environment dependent
- **Trend**: Optimization reduces interference

### Forecast Parameters

| Metric | Seasonality Mode | Changepoint Scale | Notes |
|--------|-----------------|-------------------|-------|
| Inter_Cell_Interference | additive | 0.1 | Load-dependent |
| Intra_Cell_Interference | additive | 0.1 | Load-dependent |
| Adjacent_Channel_Interference | additive | 0.12 | External sources |
| Co_Channel_Interference | additive | 0.1 | Planning-dependent |
| Noise_Rise | additive | 0.12 | Environment-dependent |
| IoT | additive | 0.1 | Interference over thermal |

### Example Request

```json
{
  "metric_name": "Inter_Cell_Interference",
  "mon_obj": "cell_dense_urban",
  "from_timestamp": 1704067200,
  "forecast_periods": 720,
  "freq": "H",
  "step": "1h",
  "seasonality_mode": "additive",
  "changepoint_prior_scale": 0.1
}
```

**Reasoning**:
- Interference levels in dBm → additive
- RF environment can change → higher flexibility
- External factors (weather, new construction) → need adaptability

---

## 15. Carrier Aggregation Metrics (5 metrics)

### Characteristics
- **Pattern**: Feature adoption patterns
- **Stability**: Growing adoption, stable operation
- **Trend**: Increasing usage as feature matures

### Forecast Parameters

| Metric | Seasonality Mode | Changepoint Scale | Notes |
|--------|-----------------|-------------------|-------|
| CA_Configuration_Success_Rate | additive | 0.03 | Feature maturity, stable |
| CA_Activation_Success_Rate | additive | 0.03 | Stable operation |
| SCell_Addition_Success_Rate | additive | 0.03 | Stable procedure |
| SCell_Activation_Time | additive | 0.05 | Load-dependent |
| CA_Throughput_Gain | multiplicative | 0.08 | Optimization improvements |

### Example Request

```json
{
  "metric_name": "CA_Configuration_Success_Rate",
  "mon_obj": "ca_cluster_001",
  "from_timestamp": 1704067200,
  "forecast_periods": 720,
  "freq": "H",
  "step": "1h",
  "seasonality_mode": "additive",
  "changepoint_prior_scale": 0.03
}
```

**Reasoning**:
- Success rates for mature features → stable, low flexibility
- Throughput gain improves with optimization → multiplicative
- CA usage follows traffic patterns → daily seasonality

---

## 16. Dual Connectivity Metrics (6 metrics)

### Characteristics
- **Pattern**: 5G NSA rollout phase patterns
- **Stability**: Maturing feature, improving stability
- **Trend**: Growing adoption and optimization

### Forecast Parameters

| Metric | Seasonality Mode | Changepoint Scale | Notes |
|--------|-----------------|-------------------|-------|
| ENDC_Setup_Success_Rate | additive | 0.05 | Maturing feature |
| ENDC_Addition_Success_Rate | additive | 0.05 | Coverage-dependent |
| SgNB_Addition_Success_Rate | additive | 0.05 | 5G coverage dependent |
| SgNB_Modification_Success_Rate | additive | 0.03 | Stable operation |
| DC_Throughput_Gain | multiplicative | 0.1 | Optimization phase |
| MR_DC_Setup_Success_Rate | additive | 0.05 | Multi-RAT complexity |

### Example Request

```json
{
  "metric_name": "ENDC_Setup_Success_Rate",
  "mon_obj": "endc_area_001",
  "from_timestamp": 1704067200,
  "forecast_periods": 720,
  "freq": "H",
  "step": "1h",
  "seasonality_mode": "additive",
  "changepoint_prior_scale": 0.05
}
```

**Reasoning**:
- EN-DC is critical 5G NSA feature → moderate flexibility
- Success rates should be stable → additive
- Throughput gains improving → multiplicative
- Still in optimization phase → medium flexibility

---

## Quick Reference Table

### By Seasonality Mode

**Use Additive For:**
- Success/failure rates (percentages with narrow ranges)
- Latency/timing metrics
- Interference levels (dBm)
- Quality metrics (MOS, error rates)
- Coverage percentages

**Use Multiplicative For:**
- Traffic volumes (growing with users)
- Throughput metrics (improving with tech)
- Capacity counts (user counts, connections)
- Utilization percentages (scaling with growth)
- Efficiency ratios (improving over time)

### By Changepoint Scale

| Range | When to Use | Metric Examples |
|-------|-------------|-----------------|
| 0.01-0.03 | Very stable KPIs | RRC Setup Success, URLLC Reliability |
| 0.03-0.05 | Stable operations | Handover Success, Bearer Setup |
| 0.05-0.08 | Moderate variability | Drop Rates, Latency, QoS |
| 0.08-0.12 | Variable conditions | Interference, Retransmissions, RF Quality |
| 0.12-0.15 | High variability/growth | Peak Throughput, Coverage Expansion, IoT Growth |

---

## Batch Forecasting Example

For forecasting multiple metrics for a single cell:

```bash
#!/bin/bash

FORECAST_URL="http://localhost:8082/api/v1/forecast"
MON_OBJ="cell_001"
FROM_TS=$(date -d "90 days ago" +%s)

# Accessibility
curl -X POST $FORECAST_URL -H "Content-Type: application/json" -d '{
  "metric_name": "RRC_Setup_Success_Rate",
  "mon_obj": "'$MON_OBJ'",
  "from_timestamp": '$FROM_TS',
  "forecast_periods": 720,
  "freq": "H",
  "step": "1h",
  "seasonality_mode": "additive",
  "changepoint_prior_scale": 0.01
}'

# Resource Utilization
curl -X POST $FORECAST_URL -H "Content-Type: application/json" -d '{
  "metric_name": "PRB_Utilization_Mean",
  "mon_obj": "'$MON_OBJ'",
  "from_timestamp": '$FROM_TS',
  "forecast_periods": 720,
  "freq": "H",
  "step": "1h",
  "seasonality_mode": "multiplicative",
  "changepoint_prior_scale": 0.05
}'

# Add more metrics as needed...
```

---

## Validation and Monitoring

### After Generating Forecasts

1. **Compare with actual data** (if available):
   ```promql
   # Actual vs Forecast
   metric_name{name="enb27738", type="actual"} or 
   metric_name{name="enb27738", type="forecast"}
   ```

2. **Check forecast reasonableness**:
   - Do values stay within expected ranges?
   - Are daily patterns preserved?
   - Does trend make sense?

3. **Adjust if needed**:
   - Too smooth? Increase `changepoint_prior_scale`
   - Too noisy? Decrease `changepoint_prior_scale`
   - Wrong seasonality? Switch additive ↔ multiplicative

### Typical Adjustments

| Issue | Solution |
|-------|----------|
| Forecast too flat | Increase changepoint_prior_scale by 0.02-0.05 |
| Forecast too erratic | Decrease changepoint_prior_scale by 0.02-0.05 |
| Missing growth trend | Switch to multiplicative |
| Seasonal amplitude too large | Switch to additive |
| Need more history | Increase from_timestamp (more historical data) |

---

## Best Practices

1. **Always use sufficient history**:
   - Minimum: 30 days (1x forecast period)
   - Recommended: 60-90 days (2-3x forecast period)
   - Ideal: 6 months for weekly seasonality

2. **Monitor forecast accuracy**:
   - Compare forecasts with actuals weekly
   - Adjust parameters based on performance
   - Retrain periodically with new data

3. **Consider special events**:
   - Holidays affect traffic patterns
   - Maintenance windows affect metrics
   - Prophet doesn't know about future events

4. **Group similar metrics**:
   - Use same parameters for related metrics
   - Batch forecast for efficiency
   - Document which parameters work best

5. **Start conservative**:
   - Use lower changepoint_prior_scale initially
   - Increase if forecast is too smooth
   - Err on side of stability for critical KPIs

---

## Integration with Dashboard

### Automatic Forecasting

Example TypeScript service:

```typescript
interface MetricForecastConfig {
  metricName: string;
  seasonalityMode: 'additive' | 'multiplicative';
  changepointPriorScale: number;
}

const FORECAST_CONFIGS: MetricForecastConfig[] = [
  { metricName: 'RRC_Setup_Success_Rate', seasonalityMode: 'additive', changepointPriorScale: 0.01 },
  { metricName: 'PRB_Utilization_Mean', seasonalityMode: 'multiplicative', changepointPriorScale: 0.05 },
  // ... add all metrics
];

async function forecastAllMetrics(monObj: string) {
  const fromTimestamp = Math.floor(Date.now() / 1000) - (90 * 24 * 60 * 60); // 90 days ago
  
  for (const config of FORECAST_CONFIGS) {
    await this.forecastService.generateForecast({
      metric_name: config.metricName,
      mon_obj: monObj,
      from_timestamp: fromTimestamp,
      forecast_periods: 720,
      freq: 'H',
      step: '1h',
      seasonality_mode: config.seasonalityMode,
      changepoint_prior_scale: config.changepointPriorScale
    });
  }
}
```

---

## Conclusion

This guide provides optimal parameters for forecasting all 155 3GPP metrics. Key takeaways:

- **Additive seasonality** for stable percentage/rate metrics
- **Multiplicative seasonality** for growing/scaling metrics
- **Lower changepoint scale** (0.01-0.05) for stable KPIs
- **Higher changepoint scale** (0.08-0.15) for variable metrics
- **720 forecast periods** for monthly hourly forecasts
- **60-90 days history** recommended for best results

Adjust parameters based on your specific network characteristics and validation results.

