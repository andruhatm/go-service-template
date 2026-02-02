# Metrics Configuration Groups

## Overview

The `metrics_configuration` table now includes a `group` column to categorize metrics based on 3GPP standards. This enhancement allows for better organization and filtering of metrics in the UI.

## Metric Groups

Based on 3GPP telecommunications standards, metrics are organized into the following groups:

### 1. Radio Quality
Measures radio signal quality and coverage:
- **RSRP** (Reference Signal Received Power) - Signal strength in dBm
- **RSRQ** (Reference Signal Received Quality) - Signal quality in dB
- **RSSI** (Received Signal Strength Indicator) - Overall signal strength
- **SINR** (Signal-to-Interference-plus-Noise Ratio) - Signal clarity
- **CQI** (Channel Quality Indicator) - Channel quality index
- **BLER** (Block Error Rate) - Block error percentage

### 2. Throughput
Measures data transfer rates and resource utilization:
- **DL_Throughput** - Downlink throughput in Mbps
- **UL_Throughput** - Uplink throughput in Mbps
- **PRB_Utilization_DL** - Downlink Physical Resource Block utilization
- **PRB_Utilization_UL** - Uplink Physical Resource Block utilization
- **Cell_Throughput** - Overall cell throughput
- **User_Throughput_Mean** - Average user throughput

### 3. Latency
Measures delay and timing performance:
- **Latency** - Network latency in milliseconds
- **Jitter** - Variation in packet delay
- **RTT** (Round Trip Time) - Time for signal round trip
- **Packet_Delay** - Packet transmission delay

### 4. Call/Session Quality
Measures connection reliability and success rates:
- **Call_Drop_Rate** - Percentage of dropped calls
- **Handover_Success_Rate** - Successful handover percentage
- **RRC_Connection_Success_Rate** - RRC connection establishment success
- **Packet_Loss_Rate** - Percentage of lost packets
- **RAB_Setup_Success_Rate** - Radio Access Bearer setup success (3G/4G)
- **ERAB_Setup_Success_Rate** - E-UTRAN Radio Access Bearer setup success (4G)

### 5. 5G Specific
Metrics specific to 5G NR (New Radio) technology:
- **SS-RSRP** - Synchronization Signal RSRP
- **SS-RSRQ** - Synchronization Signal RSRQ
- **SS-SINR** - Synchronization Signal SINR
- **CSI-RSRP** - Channel State Information RSRP
- **CSI-RSRQ** - Channel State Information RSRQ
- **CSI-SINR** - Channel State Information SINR

### 6. Network Performance
Measures overall network efficiency and capacity:
- **Active_Users** - Number of active users
- **RRC_Connected_Users** - Number of RRC connected users
- **Spectral_Efficiency** - Efficiency in bits per second per Hz
- **Cell_Availability** - Cell availability percentage
- **Interference_Level** - Interference level in dBm
- **Retransmission_Rate** - Packet retransmission rate

## Database Schema

The `group` column is added to the `metrics_configuration` table:

```sql
CREATE TABLE metrics_configuration (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    unit VARCHAR(100),
    degradation VARCHAR(100),
    "group" VARCHAR(100),  -- NEW COLUMN
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

An index is created on the `group` column for optimal query performance:

```sql
CREATE INDEX idx_metrics_configuration_group ON metrics_configuration("group");
```

## Migration Strategy

### For New Databases
Migrations run in sequence:
1. **000003** - Creates `metrics_configuration` table with `group` column
2. **000004** - Seeds 3GPP metrics with group values
3. **000005** - No-op (column already exists, values already set)

### For Existing Databases
If migrations 000003 and 000004 have already run:
1. **000005** - Adds `group` column and populates all existing metrics

The migration uses `IF NOT EXISTS` clauses to safely handle both scenarios.

## Query Examples

### Get all metrics in a specific group:
```sql
SELECT * FROM metrics_configuration WHERE "group" = 'Radio Quality';
```

### Count metrics by group:
```sql
SELECT "group", COUNT(*) as metric_count 
FROM metrics_configuration 
GROUP BY "group" 
ORDER BY metric_count DESC;
```

### Get all 5G-specific metrics:
```sql
SELECT name, unit, degradation 
FROM metrics_configuration 
WHERE "group" = '5G Specific';
```

### List all available groups:
```sql
SELECT DISTINCT "group" FROM metrics_configuration ORDER BY "group";
```

## API Integration

The `group` field can be used in API responses for:
- Filtering metrics by category
- Grouping metrics in UI dropdowns
- Creating metric dashboards organized by group
- Generating reports by metric category

## Standards Reference

These groupings are based on 3GPP standards:
- **TS 32.425** - Performance Management (PM) for UMTS and LTE
- **TS 28.552** - Management and orchestration; 5G performance measurements

The grouping facilitates compliance with 3GPP recommendations for network monitoring and performance analysis.


