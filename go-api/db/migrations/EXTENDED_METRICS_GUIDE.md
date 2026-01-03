# Extended 3GPP Metrics Guide

## Overview

This document describes the extended set of 3GPP-compliant metrics added in migration `000006`. These metrics provide comprehensive monitoring capabilities for LTE and 5G networks based on:
- **3GPP TS 32.425**: Performance Management for UMTS and LTE
- **3GPP TS 28.552**: 5G performance measurements
- **3GPP TS 23.203**: Policy and charging control architecture (QoS)

## Metric Groups Summary

| Group | Count | Technology | Focus Area |
|-------|-------|------------|------------|
| Accessibility | 10 | LTE/5G | Connection establishment |
| Retainability | 7 | LTE/5G | Connection maintenance |
| Mobility | 10 | LTE/5G | Handover performance |
| Integrity | 8 | LTE/5G | Data transmission quality |
| Resource Utilization | 7 | LTE/5G | Network resource usage |
| Capacity | 8 | LTE/5G | Network capacity and load |
| Voice Quality | 8 | LTE/5G | VoLTE/VoNR performance |
| 5G Advanced | 10 | 5G | Advanced 5G features |
| Control Plane | 6 | LTE/5G | Signaling performance |
| User Plane | 9 | LTE/5G | Data plane performance |
| Energy Efficiency | 5 | LTE/5G | Power consumption |
| QoS | 8 | LTE/5G | Quality of Service |
| Coverage | 6 | LTE/5G | Network coverage |
| Interference | 6 | LTE/5G | Interference management |
| Carrier Aggregation | 5 | LTE/5G | CA performance |
| Dual Connectivity | 6 | LTE/5G | EN-DC, NR-DC |
| **Total** | **119** | | **Extended metrics** |

Combined with the 36 base metrics from migration 000004, the system now supports **155 total metrics**.

---

## Detailed Metric Descriptions

### 1. Accessibility Metrics (10 metrics)

Measures the ability of users to successfully establish connections to the network.

| Metric | Unit | Description | Target |
|--------|------|-------------|--------|
| RRC_Setup_Success_Rate | % | Radio Resource Control connection setup success | > 99% |
| RRC_Setup_Failure_Rate | % | RRC connection setup failures | < 1% |
| RRC_Setup_Attempts | count | Number of RRC setup attempts | Monitoring |
| RACH_Success_Rate | % | Random Access Channel success rate | > 98% |
| RACH_Preamble_Attempts | count | Number of RACH preamble transmissions | Monitoring |
| S1_Setup_Success_Rate | % | S1 interface setup success (LTE) | > 99% |
| Initial_Context_Setup_Success_Rate | % | Initial context establishment success | > 99% |
| Service_Request_Success_Rate | % | Service request procedure success | > 99% |
| Attach_Success_Rate | % | Network attach success rate | > 99% |
| PDN_Connection_Success_Rate | % | Packet Data Network connection success | > 98% |

**Use Case**: Monitor network accessibility issues, identify RACH congestion, track connection establishment problems.

---

### 2. Retainability Metrics (7 metrics)

Measures the ability to maintain established connections without abnormal releases.

| Metric | Unit | Description | Target |
|--------|------|-------------|--------|
| RRC_Connection_Abnormal_Release_Rate | % | Abnormal RRC connection releases | < 1% |
| ERAB_Abnormal_Release_Rate | % | E-RAB abnormal release rate | < 0.5% |
| Session_Drop_Rate | % | Overall session drop rate | < 1% |
| UE_Context_Release_Rate | % | UE context abnormal release rate | < 1% |
| Radio_Link_Failure_Rate | % | Radio link failure occurrences | < 0.5% |
| Connection_Retention_Rate | % | Successfully maintained connections | > 99% |
| Mean_Time_Between_Failures | seconds | Average time between connection failures | > 3600s |

**Use Case**: Identify coverage holes, interference issues, capacity problems causing dropped connections.

---

### 3. Mobility Metrics (10 metrics)

Measures handover performance and mobility management.

| Metric | Unit | Description | Target |
|--------|------|-------------|--------|
| Intra_Freq_Handover_Success_Rate | % | Same frequency handover success | > 99% |
| Inter_Freq_Handover_Success_Rate | % | Different frequency handover success | > 98% |
| Inter_RAT_Handover_Success_Rate | % | Inter-RAT handover success (LTE↔5G) | > 97% |
| X2_Handover_Success_Rate | % | X2 interface handover success | > 99% |
| S1_Handover_Success_Rate | % | S1 interface handover success | > 98% |
| Handover_Preparation_Time | ms | Time for handover preparation | < 50ms |
| Handover_Execution_Time | ms | Time for handover execution | < 50ms |
| Handover_Failure_Rate | % | Failed handover attempts | < 2% |
| Ping_Pong_Handover_Rate | % | Unnecessary back-and-forth handovers | < 5% |
| Mobility_Interruption_Time | ms | Service interruption during handover | < 30ms |

**Use Case**: Optimize handover parameters, identify mobility issues, improve user experience during movement.

---

### 4. Integrity Metrics (8 metrics)

Measures data transmission quality and protocol layer performance.

| Metric | Unit | Description | Target |
|--------|------|-------------|--------|
| PDCP_SDU_Loss_Rate | % | Packet Data Convergence Protocol SDU loss | < 0.1% |
| RLC_Retransmission_Rate | % | Radio Link Control retransmissions | < 5% |
| MAC_Retransmission_Rate | % | Medium Access Control retransmissions | < 10% |
| HARQ_Retransmission_Rate | % | Hybrid ARQ retransmissions | < 15% |
| FER | % | Frame Error Rate | < 2% |
| Residual_BER | ratio | Residual Bit Error Rate | < 10^-6 |
| IP_Packet_Loss_Rate | % | IP layer packet loss | < 0.5% |
| Data_Integrity_Success_Rate | % | Successful data delivery rate | > 99.9% |

**Use Case**: Monitor data quality, identify RF issues, optimize retransmission parameters.

---

### 5. Resource Utilization Metrics (7 metrics)

Measures how efficiently network resources are being used.

| Metric | Unit | Description | Target |
|--------|------|-------------|--------|
| PRB_Utilization_Mean | % | Average Physical Resource Block usage | 40-70% |
| CCE_Utilization | % | Control Channel Element utilization | < 80% |
| PUCCH_Utilization | % | Physical Uplink Control Channel usage | < 70% |
| PDCCH_Utilization | % | Physical Downlink Control Channel usage | < 70% |
| Licensed_Spectrum_Efficiency | bps/Hz/cell | Spectral efficiency per cell | > 1.5 |
| Resource_Block_Usage_Rate | % | Overall RB usage | 50-80% |
| Carrier_Aggregation_Utilization | % | CA resource usage | Monitoring |

**Use Case**: Capacity planning, identify congestion, optimize resource allocation.

---

### 6. Capacity Metrics (8 metrics)

Measures network capacity and traffic handling.

| Metric | Unit | Description | Target |
|--------|------|-------------|--------|
| Max_Active_UE_DL | count | Maximum simultaneous downlink users | Monitoring |
| Max_Active_UE_UL | count | Maximum simultaneous uplink users | Monitoring |
| Average_Active_UE | count | Average number of active users | Monitoring |
| Peak_Connected_Users | count | Peak number of connected users | Monitoring |
| Connection_Density | users/km² | User density per area | Monitoring |
| Traffic_Volume_DL | GB | Total downlink traffic volume | Monitoring |
| Traffic_Volume_UL | GB | Total uplink traffic volume | Monitoring |
| Area_Traffic_Capacity | Mbps/km² | Traffic capacity per area | Monitoring |

**Use Case**: Network dimensioning, capacity expansion planning, traffic analysis.

---

### 7. Voice Quality Metrics (8 metrics)

Measures VoLTE and VoNR voice service quality.

| Metric | Unit | Description | Target |
|--------|------|-------------|--------|
| VoLTE_Call_Setup_Success_Rate | % | VoLTE call establishment success | > 99% |
| VoLTE_Call_Drop_Rate | % | VoLTE call drop rate | < 0.5% |
| VoLTE_SRVCC_Success_Rate | % | Single Radio Voice Call Continuity success | > 98% |
| Voice_MOS | score | Mean Opinion Score (1-5) | > 4.0 |
| Voice_Packet_Loss_Rate | % | Voice packet loss | < 1% |
| Voice_Jitter | ms | Voice packet delay variation | < 30ms |
| E2E_Voice_Latency | ms | End-to-end voice latency | < 150ms |
| VoNR_Call_Setup_Success_Rate | % | Voice over 5G NR setup success | > 99% |

**Use Case**: Monitor voice service quality, troubleshoot VoLTE issues, optimize voice parameters.

---

### 8. 5G Advanced Metrics (10 metrics)

Measures advanced 5G NR features and capabilities.

| Metric | Unit | Description | Target |
|--------|------|-------------|--------|
| Beam_Management_Success_Rate | % | Beam management procedure success | > 99% |
| SSB_RSRP | dBm | Synchronization Signal Block RSRP | > -80 dBm |
| Beam_Switching_Time | ms | Time to switch between beams | < 10ms |
| Massive_MIMO_Efficiency | bps/Hz | Massive MIMO spectral efficiency | > 5.0 |
| Network_Slice_Availability | % | Network slice availability | > 99.99% |
| Network_Slice_Isolation | % | Slice isolation effectiveness | > 99% |
| URLLC_Reliability | % | Ultra-Reliable Low-Latency reliability | > 99.999% |
| URLLC_Latency | ms | URLLC service latency | < 1ms |
| mMTC_Connection_Density | devices/km² | Massive Machine Type Communication density | > 10^6 |
| eMBB_Peak_Data_Rate | Gbps | Enhanced Mobile Broadband peak rate | > 1 Gbps |

**Use Case**: Monitor 5G-specific features, optimize beamforming, track network slicing performance.

---

### 9. Control Plane Metrics (6 metrics)

Measures signaling and control plane performance.

| Metric | Unit | Description | Target |
|--------|------|-------------|--------|
| Control_Plane_Latency | ms | Control plane message latency | < 50ms |
| Idle_to_Active_Transition_Time | ms | Time to transition from idle to active | < 100ms |
| Paging_Success_Rate | % | Paging procedure success rate | > 99% |
| TAU_Success_Rate | % | Tracking Area Update success | > 99% |
| Registration_Success_Rate | % | Network registration success (5G) | > 99% |
| Signaling_Load | messages/s | Signaling messages per second | Monitoring |

**Use Case**: Optimize signaling procedures, reduce control plane latency, monitor signaling load.

---

### 10. User Plane Metrics (9 metrics)

Measures data plane performance and user experience.

| Metric | Unit | Description | Target |
|--------|------|-------------|--------|
| User_Plane_Latency | ms | User plane data latency | < 10ms |
| User_Experienced_Data_Rate_DL | Mbps | Actual user downlink data rate | > 10 Mbps |
| User_Experienced_Data_Rate_UL | Mbps | Actual user uplink data rate | > 5 Mbps |
| Cell_Edge_User_Throughput_DL | Mbps | Downlink throughput at cell edge | > 2 Mbps |
| Cell_Edge_User_Throughput_UL | Mbps | Uplink throughput at cell edge | > 1 Mbps |
| Average_User_Throughput_DL | Mbps | Average downlink user throughput | > 20 Mbps |
| Average_User_Throughput_UL | Mbps | Average uplink user throughput | > 10 Mbps |
| Peak_User_Throughput_DL | Mbps | Peak downlink user throughput | > 100 Mbps |
| Peak_User_Throughput_UL | Mbps | Peak uplink user throughput | > 50 Mbps |

**Use Case**: Monitor actual user experience, identify coverage issues, optimize throughput.

---

### 11. Energy Efficiency Metrics (5 metrics)

Measures power consumption and energy efficiency.

| Metric | Unit | Description | Target |
|--------|------|-------------|--------|
| Network_Energy_Efficiency | Mbps/W | Network throughput per watt | Maximize |
| UE_Energy_Efficiency | Mbps/W | UE throughput per watt | Maximize |
| Power_Consumption_Per_Cell | W | Average power per cell | Minimize |
| Energy_Per_Bit | J/bit | Energy consumed per bit transmitted | Minimize |
| Sleep_Mode_Efficiency | % | Efficiency of sleep mode operation | > 80% |

**Use Case**: Green network initiatives, reduce operational costs, optimize power consumption.

---

### 12. QoS Metrics (8 metrics)

Measures Quality of Service for different traffic classes.

| Metric | Unit | Description | Target |
|--------|------|-------------|--------|
| QCI_1_Packet_Loss_Rate | % | QCI 1 (Conversational Voice) packet loss | < 1% |
| QCI_5_Packet_Loss_Rate | % | QCI 5 (IMS Signaling) packet loss | < 0.5% |
| QCI_9_Packet_Loss_Rate | % | QCI 9 (Best Effort) packet loss | < 5% |
| GBR_Bearer_Setup_Success_Rate | % | Guaranteed Bit Rate bearer setup | > 99% |
| Non_GBR_Bearer_Setup_Success_Rate | % | Non-GBR bearer setup success | > 99% |
| QoS_Flow_Setup_Success_Rate | % | 5G QoS flow setup success | > 99% |
| PDB_Violation_Rate | % | Packet Delay Budget violations | < 2% |
| PELR_Violation_Rate | % | Packet Error Loss Rate violations | < 2% |

**Use Case**: Monitor QoS compliance, troubleshoot service quality issues, optimize bearer management.

---

### 13. Coverage Metrics (6 metrics)

Measures network coverage and signal penetration.

| Metric | Unit | Description | Target |
|--------|------|-------------|--------|
| Coverage_Area | km² | Total coverage area | Maximize |
| Indoor_Coverage_Ratio | % | Indoor coverage percentage | > 95% |
| Outdoor_Coverage_Ratio | % | Outdoor coverage percentage | > 99% |
| Deep_Indoor_Penetration | dB | Signal penetration into buildings | > 20 dB |
| Cell_Range | km | Maximum cell coverage range | Monitoring |
| Coverage_Probability | % | Probability of adequate coverage | > 95% |

**Use Case**: Coverage planning, identify coverage gaps, optimize antenna configuration.

---

### 14. Interference Metrics (6 metrics)

Measures interference levels and sources.

| Metric | Unit | Description | Target |
|--------|------|-------------|--------|
| Inter_Cell_Interference | dBm | Interference from other cells | < -95 dBm |
| Intra_Cell_Interference | dBm | Interference within same cell | < -100 dBm |
| Adjacent_Channel_Interference | dBm | Adjacent channel interference | < -90 dBm |
| Co_Channel_Interference | dBm | Co-channel interference | < -95 dBm |
| Noise_Rise | dB | Increase in noise floor | < 5 dB |
| IoT | dB | Interference over Thermal noise | < 6 dB |

**Use Case**: Interference mitigation, optimize frequency planning, troubleshoot RF issues.

---

### 15. Carrier Aggregation Metrics (5 metrics)

Measures Carrier Aggregation performance.

| Metric | Unit | Description | Target |
|--------|------|-------------|--------|
| CA_Configuration_Success_Rate | % | CA configuration success | > 98% |
| CA_Activation_Success_Rate | % | CA activation success | > 98% |
| SCell_Addition_Success_Rate | % | Secondary cell addition success | > 98% |
| SCell_Activation_Time | ms | Time to activate secondary cell | < 100ms |
| CA_Throughput_Gain | % | Throughput improvement with CA | > 50% |

**Use Case**: Optimize CA parameters, monitor CA performance, maximize throughput gains.

---

### 16. Dual Connectivity Metrics (6 metrics)

Measures EN-DC (E-UTRAN New Radio - Dual Connectivity) and NR-DC performance.

| Metric | Unit | Description | Target |
|--------|------|-------------|--------|
| ENDC_Setup_Success_Rate | % | EN-DC setup success | > 98% |
| ENDC_Addition_Success_Rate | % | EN-DC node addition success | > 98% |
| SgNB_Addition_Success_Rate | % | Secondary gNB addition success | > 98% |
| SgNB_Modification_Success_Rate | % | SgNB modification success | > 99% |
| DC_Throughput_Gain | % | Throughput gain with dual connectivity | > 80% |
| MR_DC_Setup_Success_Rate | % | Multi-RAT DC setup success | > 98% |

**Use Case**: Monitor 5G NSA deployment, optimize EN-DC parameters, track 4G-5G interworking.

---

## Technology Mapping

### LTE-Specific Metrics
- S1_Setup_Success_Rate
- S1_Handover_Success_Rate
- ERAB_Setup_Success_Rate
- ERAB_Abnormal_Release_Rate
- VoLTE_* metrics
- TAU_Success_Rate

### 5G NR-Specific Metrics
- All "5G Advanced" group metrics
- Registration_Success_Rate
- VoNR_Call_Setup_Success_Rate
- QoS_Flow_Setup_Success_Rate
- Network_Slice_* metrics

### Common (LTE & 5G)
- Radio Quality metrics
- Throughput metrics
- Latency metrics
- Mobility metrics (with different interfaces)
- Resource Utilization metrics

---

## SQL Queries

### Get all accessibility metrics
```sql
SELECT name, unit, degradation 
FROM metrics_configuration 
WHERE "group" = 'Accessibility'
ORDER BY name;
```

### Get metrics for 5G monitoring
```sql
SELECT name, "group", unit 
FROM metrics_configuration 
WHERE "group" IN ('5G Specific', '5G Advanced', 'Dual Connectivity')
ORDER BY "group", name;
```

### Get all success rate metrics
```sql
SELECT name, "group", unit 
FROM metrics_configuration 
WHERE name LIKE '%Success_Rate%'
ORDER BY "group", name;
```

### Count metrics by group (including extended)
```sql
SELECT "group", COUNT(*) as metric_count 
FROM metrics_configuration 
GROUP BY "group"
ORDER BY metric_count DESC;
```

---

## Integration with Monitoring Systems

### Prometheus/Grafana
These metrics can be exported to Prometheus with labels:
```
metric_name{group="Accessibility", technology="LTE", unit="%"} value
```

### Dashboard Organization
Recommended dashboard structure:
1. **Overview Dashboard**: Key metrics from each group
2. **Accessibility Dashboard**: All accessibility metrics
3. **Mobility Dashboard**: Handover and mobility metrics
4. **Voice Quality Dashboard**: VoLTE/VoNR metrics
5. **5G Advanced Dashboard**: 5G-specific features
6. **Resource Utilization Dashboard**: Capacity and utilization

---

## Alerting Thresholds

### Critical Alerts (Immediate Action)
- RRC_Setup_Success_Rate < 95%
- Call_Drop_Rate > 2%
- URLLC_Reliability < 99.9%
- Network_Slice_Availability < 99%

### Warning Alerts (Investigation Needed)
- Handover_Success_Rate < 98%
- PRB_Utilization > 80%
- Voice_MOS < 3.5
- RACH_Success_Rate < 96%

### Informational Alerts (Monitoring)
- Traffic_Volume trends
- Average_Active_UE trends
- Energy_Efficiency trends

---

## Standards References

- **3GPP TS 32.425**: Performance Management (PM) for UMTS and LTE
- **3GPP TS 28.552**: Management and orchestration; 5G performance measurements
- **3GPP TS 23.203**: Policy and charging control architecture
- **3GPP TS 36.300**: E-UTRA and E-UTRAN overall description
- **3GPP TS 38.300**: NR and NG-RAN overall description
- **3GPP TS 37.340**: Multi-connectivity procedures

---

## Next Steps

1. **Backend Implementation**:
   - Update Go models to handle all metric groups
   - Implement filtering by group and technology
   - Add bulk metric retrieval endpoints

2. **Frontend Implementation**:
   - Create group-based metric selectors
   - Implement technology filters (LTE/5G/Both)
   - Build specialized dashboards for each group

3. **Data Collection**:
   - Configure network elements to report these metrics
   - Set up data collection pipelines
   - Implement metric aggregation logic

4. **Monitoring & Alerting**:
   - Define threshold values for your network
   - Configure alert rules
   - Set up notification channels

