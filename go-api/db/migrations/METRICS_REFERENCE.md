# 3GPP Metrics Quick Reference

## Complete Metrics List

| # | Metric Name | Group | Unit | Degradation | Description |
|---|-------------|-------|------|-------------|-------------|
| 1 | RSRP | Radio Quality | dBm | lower | Reference Signal Received Power - Signal strength |
| 2 | RSRQ | Radio Quality | dB | lower | Reference Signal Received Quality - Signal quality |
| 3 | RSSI | Radio Quality | dBm | lower | Received Signal Strength Indicator - Overall signal strength |
| 4 | SINR | Radio Quality | dB | lower | Signal-to-Interference-plus-Noise Ratio - Signal clarity |
| 5 | CQI | Radio Quality | index | lower | Channel Quality Indicator - Channel quality index (0-15) |
| 6 | BLER | Radio Quality | % | higher | Block Error Rate - Percentage of erroneous blocks |
| 7 | DL_Throughput | Throughput | Mbps | lower | Downlink Throughput - Download speed |
| 8 | UL_Throughput | Throughput | Mbps | lower | Uplink Throughput - Upload speed |
| 9 | PRB_Utilization_DL | Throughput | % | higher | Physical Resource Block Utilization Downlink |
| 10 | PRB_Utilization_UL | Throughput | % | higher | Physical Resource Block Utilization Uplink |
| 11 | Cell_Throughput | Throughput | Mbps | lower | Overall Cell Throughput |
| 12 | User_Throughput_Mean | Throughput | Mbps | lower | Average User Throughput |
| 13 | Latency | Latency | ms | higher | Network Latency - End-to-end delay |
| 14 | Jitter | Latency | ms | higher | Packet Delay Variation |
| 15 | RTT | Latency | ms | higher | Round Trip Time |
| 16 | Packet_Delay | Latency | ms | higher | Packet Transmission Delay |
| 17 | Call_Drop_Rate | Call/Session Quality | % | higher | Percentage of dropped calls/sessions |
| 18 | Handover_Success_Rate | Call/Session Quality | % | lower | Successful handover percentage |
| 19 | RRC_Connection_Success_Rate | Call/Session Quality | % | lower | RRC connection establishment success |
| 20 | Packet_Loss_Rate | Call/Session Quality | % | higher | Percentage of lost packets |
| 21 | RAB_Setup_Success_Rate | Call/Session Quality | % | lower | Radio Access Bearer setup success (3G/4G) |
| 22 | ERAB_Setup_Success_Rate | Call/Session Quality | % | lower | E-UTRAN RAB setup success (4G) |
| 23 | SS-RSRP | 5G Specific | dBm | lower | Synchronization Signal RSRP (5G NR) |
| 24 | SS-RSRQ | 5G Specific | dB | lower | Synchronization Signal RSRQ (5G NR) |
| 25 | SS-SINR | 5G Specific | dB | lower | Synchronization Signal SINR (5G NR) |
| 26 | CSI-RSRP | 5G Specific | dBm | lower | Channel State Information RSRP (5G NR) |
| 27 | CSI-RSRQ | 5G Specific | dB | lower | Channel State Information RSRQ (5G NR) |
| 28 | CSI-SINR | 5G Specific | dB | lower | Channel State Information SINR (5G NR) |
| 29 | Active_Users | Network Performance | count | higher* | Number of active users (higher is often better for utilization) |
| 30 | RRC_Connected_Users | Network Performance | count | higher* | Number of RRC connected users |
| 31 | Spectral_Efficiency | Network Performance | bps/Hz | lower | Efficiency in bits per second per Hertz |
| 32 | Cell_Availability | Network Performance | % | lower | Cell availability percentage |
| 33 | Interference_Level | Network Performance | dBm | higher | Interference level in dBm |
| 34 | Retransmission_Rate | Network Performance | % | higher | Packet retransmission rate |

*Note: For user count metrics, "higher" degradation means the metric becomes concerning when it's too high (overload), but this depends on capacity planning thresholds.

## Degradation Interpretation

- **lower**: Metric degrades when value decreases (e.g., throughput, signal strength)
- **higher**: Metric degrades when value increases (e.g., latency, error rates)

## Group Summary

| Group | Count | Focus Area |
|-------|-------|------------|
| Radio Quality | 6 | Signal strength and quality measurements |
| Throughput | 6 | Data transfer rates and resource utilization |
| Latency | 4 | Delay and timing performance |
| Call/Session Quality | 6 | Connection reliability and success rates |
| 5G Specific | 6 | 5G NR-specific measurements |
| Network Performance | 8 | Overall network efficiency and capacity |
| **Total** | **36** | Complete 3GPP metrics coverage |

## Usage by Technology

### LTE (4G)
Primary metrics: RSRP, RSRQ, RSSI, SINR, CQI, BLER, ERAB_Setup_Success_Rate, and all Throughput/Latency/Network Performance metrics.

### 5G NR
All LTE metrics plus 5G Specific group: SS-RSRP, SS-RSRQ, SS-SINR, CSI-RSRP, CSI-RSRQ, CSI-SINR.

### 3G/UMTS
Basic metrics: RSRP, RSRQ, RAB_Setup_Success_Rate, Call_Drop_Rate, and basic Throughput/Latency metrics.

## SQL Queries

### Get all Radio Quality metrics
```sql
SELECT name, unit, degradation 
FROM metrics_configuration 
WHERE "group" = 'Radio Quality'
ORDER BY name;
```

### Get all 5G-specific metrics
```sql
SELECT name, unit 
FROM metrics_configuration 
WHERE "group" = '5G Specific'
ORDER BY name;
```

### Get metrics where lower values indicate degradation
```sql
SELECT "group", name, unit 
FROM metrics_configuration 
WHERE degradation = 'lower'
ORDER BY "group", name;
```

### Count metrics by group
```sql
SELECT "group", COUNT(*) as metric_count 
FROM metrics_configuration 
GROUP BY "group"
ORDER BY metric_count DESC;
```

## 3GPP Standards References

- **TS 32.425**: Performance Management (PM) for UMTS and LTE
  - Defines performance measurements for 3G and 4G networks
  - Specifies measurement families and definitions

- **TS 28.552**: Management and orchestration; 5G performance measurements
  - Defines 5G NR-specific measurements
  - Includes measurements for network slicing and 5G core

## Database Structure

```sql
-- Query to see complete metric details
SELECT 
    name,
    "group",
    unit,
    degradation,
    created_at
FROM metrics_configuration
ORDER BY "group", name;
```

## API Integration

### Example: Get metrics grouped by category

```json
GET /api/metrics/grouped

Response:
{
  "Radio Quality": [
    {"name": "RSRP", "unit": "dBm", "degradation": "lower"},
    {"name": "RSRQ", "unit": "dB", "degradation": "lower"},
    ...
  ],
  "Throughput": [
    {"name": "DL_Throughput", "unit": "Mbps", "degradation": "lower"},
    ...
  ],
  ...
}
```

### Example: Filter metrics by group

```json
GET /api/metrics?group=5G%20Specific

Response:
{
  "metrics": [
    {"name": "SS-RSRP", "unit": "dBm", "degradation": "lower", "group": "5G Specific"},
    {"name": "SS-RSRQ", "unit": "dB", "degradation": "lower", "group": "5G Specific"},
    {"name": "SS-SINR", "unit": "dB", "degradation": "lower", "group": "5G Specific"},
    {"name": "CSI-RSRP", "unit": "dBm", "degradation": "lower", "group": "5G Specific"},
    {"name": "CSI-RSRQ", "unit": "dB", "degradation": "lower", "group": "5G Specific"},
    {"name": "CSI-SINR", "unit": "dB", "degradation": "lower", "group": "5G Specific"}
  ]
}
```

## Typical Value Ranges

| Metric | Good | Fair | Poor |
|--------|------|------|------|
| RSRP | > -80 dBm | -80 to -100 dBm | < -100 dBm |
| RSRQ | > -10 dB | -10 to -15 dB | < -15 dB |
| SINR | > 20 dB | 10 to 20 dB | < 10 dB |
| CQI | > 10 | 7 to 10 | < 7 |
| Latency | < 20 ms | 20-50 ms | > 50 ms |
| BLER | < 2% | 2-10% | > 10% |
| Packet_Loss_Rate | < 1% | 1-3% | > 3% |

*Note: Actual thresholds may vary based on network configuration and use case.*

