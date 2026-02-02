-- Extended 3GPP Metrics for LTE and 5G
-- Based on 3GPP TS 32.425 (LTE) and TS 28.552 (5G NR)

-- Accessibility Metrics (Connection Establishment)
INSERT INTO metrics_configuration (name, unit, degradation, "group") VALUES
('RRC_Setup_Success_Rate', '%', 'lower', 'Accessibility'),
('RRC_Setup_Failure_Rate', '%', 'higher', 'Accessibility'),
('RRC_Setup_Attempts', 'count', 'higher', 'Accessibility'),
('RACH_Success_Rate', '%', 'lower', 'Accessibility'),
('RACH_Preamble_Attempts', 'count', 'higher', 'Accessibility'),
('S1_Setup_Success_Rate', '%', 'lower', 'Accessibility'),
('Initial_Context_Setup_Success_Rate', '%', 'lower', 'Accessibility'),
('Service_Request_Success_Rate', '%', 'lower', 'Accessibility'),
('Attach_Success_Rate', '%', 'lower', 'Accessibility'),
('PDN_Connection_Success_Rate', '%', 'lower', 'Accessibility');

-- Retainability Metrics (Connection Maintenance)
INSERT INTO metrics_configuration (name, unit, degradation, "group") VALUES
('RRC_Connection_Abnormal_Release_Rate', '%', 'higher', 'Retainability'),
('ERAB_Abnormal_Release_Rate', '%', 'higher', 'Retainability'),
('Session_Drop_Rate', '%', 'higher', 'Retainability'),
('UE_Context_Release_Rate', '%', 'higher', 'Retainability'),
('Radio_Link_Failure_Rate', '%', 'higher', 'Retainability'),
('Connection_Retention_Rate', '%', 'lower', 'Retainability'),
('Mean_Time_Between_Failures', 'seconds', 'lower', 'Retainability');

-- Mobility Metrics (Handover Performance)
INSERT INTO metrics_configuration (name, unit, degradation, "group") VALUES
('Intra_Freq_Handover_Success_Rate', '%', 'lower', 'Mobility'),
('Inter_Freq_Handover_Success_Rate', '%', 'lower', 'Mobility'),
('Inter_RAT_Handover_Success_Rate', '%', 'lower', 'Mobility'),
('X2_Handover_Success_Rate', '%', 'lower', 'Mobility'),
('S1_Handover_Success_Rate', '%', 'lower', 'Mobility'),
('Handover_Preparation_Time', 'ms', 'higher', 'Mobility'),
('Handover_Execution_Time', 'ms', 'higher', 'Mobility'),
('Handover_Failure_Rate', '%', 'higher', 'Mobility'),
('Ping_Pong_Handover_Rate', '%', 'higher', 'Mobility'),
('Mobility_Interruption_Time', 'ms', 'higher', 'Mobility');

-- Integrity Metrics (Data Quality)
INSERT INTO metrics_configuration (name, unit, degradation, "group") VALUES
('PDCP_SDU_Loss_Rate', '%', 'higher', 'Integrity'),
('RLC_Retransmission_Rate', '%', 'higher', 'Integrity'),
('MAC_Retransmission_Rate', '%', 'higher', 'Integrity'),
('HARQ_Retransmission_Rate', '%', 'higher', 'Integrity'),
('FER', '%', 'higher', 'Integrity'),
('Residual_BER', 'ratio', 'higher', 'Integrity'),
('IP_Packet_Loss_Rate', '%', 'higher', 'Integrity'),
('Data_Integrity_Success_Rate', '%', 'lower', 'Integrity');

-- Resource Utilization Metrics
INSERT INTO metrics_configuration (name, unit, degradation, "group") VALUES
('PRB_Utilization_Mean', '%', 'higher', 'Resource Utilization'),
('CCE_Utilization', '%', 'higher', 'Resource Utilization'),
('PUCCH_Utilization', '%', 'higher', 'Resource Utilization'),
('PDCCH_Utilization', '%', 'higher', 'Resource Utilization'),
('Licensed_Spectrum_Efficiency', 'bps/Hz/cell', 'lower', 'Resource Utilization'),
('Resource_Block_Usage_Rate', '%', 'higher', 'Resource Utilization'),
('Carrier_Aggregation_Utilization', '%', 'higher', 'Resource Utilization');

-- Capacity Metrics
INSERT INTO metrics_configuration (name, unit, degradation, "group") VALUES
('Max_Active_UE_DL', 'count', 'lower', 'Capacity'),
('Max_Active_UE_UL', 'count', 'lower', 'Capacity'),
('Average_Active_UE', 'count', 'higher', 'Capacity'),
('Peak_Connected_Users', 'count', 'lower', 'Capacity'),
('Connection_Density', 'users/km²', 'lower', 'Capacity'),
('Traffic_Volume_DL', 'GB', 'lower', 'Capacity'),
('Traffic_Volume_UL', 'GB', 'lower', 'Capacity'),
('Area_Traffic_Capacity', 'Mbps/km²', 'lower', 'Capacity');

-- VoLTE/VoNR Specific Metrics
INSERT INTO metrics_configuration (name, unit, degradation, "group") VALUES
('VoLTE_Call_Setup_Success_Rate', '%', 'lower', 'Voice Quality'),
('VoLTE_Call_Drop_Rate', '%', 'higher', 'Voice Quality'),
('VoLTE_SRVCC_Success_Rate', '%', 'lower', 'Voice Quality'),
('Voice_MOS', 'score', 'lower', 'Voice Quality'),
('Voice_Packet_Loss_Rate', '%', 'higher', 'Voice Quality'),
('Voice_Jitter', 'ms', 'higher', 'Voice Quality'),
('E2E_Voice_Latency', 'ms', 'higher', 'Voice Quality'),
('VoNR_Call_Setup_Success_Rate', '%', 'lower', 'Voice Quality');

-- Advanced 5G NR Metrics
INSERT INTO metrics_configuration (name, unit, degradation, "group") VALUES
('Beam_Management_Success_Rate', '%', 'lower', '5G Advanced'),
('SSB_RSRP', 'dBm', 'lower', '5G Advanced'),
('Beam_Switching_Time', 'ms', 'higher', '5G Advanced'),
('Massive_MIMO_Efficiency', 'bps/Hz', 'lower', '5G Advanced'),
('Network_Slice_Availability', '%', 'lower', '5G Advanced'),
('Network_Slice_Isolation', '%', 'lower', '5G Advanced'),
('URLLC_Reliability', '%', 'lower', '5G Advanced'),
('URLLC_Latency', 'ms', 'higher', '5G Advanced'),
('mMTC_Connection_Density', 'devices/km²', 'lower', '5G Advanced'),
('eMBB_Peak_Data_Rate', 'Gbps', 'lower', '5G Advanced');

-- Control Plane Metrics
INSERT INTO metrics_configuration (name, unit, degradation, "group") VALUES
('Control_Plane_Latency', 'ms', 'higher', 'Control Plane'),
('Idle_to_Active_Transition_Time', 'ms', 'higher', 'Control Plane'),
('Paging_Success_Rate', '%', 'lower', 'Control Plane'),
('TAU_Success_Rate', '%', 'lower', 'Control Plane'),
('Registration_Success_Rate', '%', 'lower', 'Control Plane'),
('Signaling_Load', 'messages/s', 'higher', 'Control Plane');

-- User Plane Metrics
INSERT INTO metrics_configuration (name, unit, degradation, "group") VALUES
('User_Plane_Latency', 'ms', 'higher', 'User Plane'),
('User_Experienced_Data_Rate_DL', 'Mbps', 'lower', 'User Plane'),
('User_Experienced_Data_Rate_UL', 'Mbps', 'lower', 'User Plane'),
('Cell_Edge_User_Throughput_DL', 'Mbps', 'lower', 'User Plane'),
('Cell_Edge_User_Throughput_UL', 'Mbps', 'lower', 'User Plane'),
('Average_User_Throughput_DL', 'Mbps', 'lower', 'User Plane'),
('Average_User_Throughput_UL', 'Mbps', 'lower', 'User Plane'),
('Peak_User_Throughput_DL', 'Mbps', 'lower', 'User Plane'),
('Peak_User_Throughput_UL', 'Mbps', 'lower', 'User Plane');

-- Energy Efficiency Metrics
INSERT INTO metrics_configuration (name, unit, degradation, "group") VALUES
('Network_Energy_Efficiency', 'Mbps/W', 'lower', 'Energy Efficiency'),
('UE_Energy_Efficiency', 'Mbps/W', 'lower', 'Energy Efficiency'),
('Power_Consumption_Per_Cell', 'W', 'higher', 'Energy Efficiency'),
('Energy_Per_Bit', 'J/bit', 'higher', 'Energy Efficiency'),
('Sleep_Mode_Efficiency', '%', 'lower', 'Energy Efficiency');

-- QoS Metrics
INSERT INTO metrics_configuration (name, unit, degradation, "group") VALUES
('QCI_1_Packet_Loss_Rate', '%', 'higher', 'QoS'),
('QCI_5_Packet_Loss_Rate', '%', 'higher', 'QoS'),
('QCI_9_Packet_Loss_Rate', '%', 'higher', 'QoS'),
('GBR_Bearer_Setup_Success_Rate', '%', 'lower', 'QoS'),
('Non_GBR_Bearer_Setup_Success_Rate', '%', 'lower', 'QoS'),
('QoS_Flow_Setup_Success_Rate', '%', 'lower', 'QoS'),
('PDB_Violation_Rate', '%', 'higher', 'QoS'),
('PELR_Violation_Rate', '%', 'higher', 'QoS');

-- Coverage Metrics
INSERT INTO metrics_configuration (name, unit, degradation, "group") VALUES
('Coverage_Area', 'km²', 'lower', 'Coverage'),
('Indoor_Coverage_Ratio', '%', 'lower', 'Coverage'),
('Outdoor_Coverage_Ratio', '%', 'lower', 'Coverage'),
('Deep_Indoor_Penetration', 'dB', 'lower', 'Coverage'),
('Cell_Range', 'km', 'lower', 'Coverage'),
('Coverage_Probability', '%', 'lower', 'Coverage');

-- Interference Metrics
INSERT INTO metrics_configuration (name, unit, degradation, "group") VALUES
('Inter_Cell_Interference', 'dBm', 'higher', 'Interference'),
('Intra_Cell_Interference', 'dBm', 'higher', 'Interference'),
('Adjacent_Channel_Interference', 'dBm', 'higher', 'Interference'),
('Co_Channel_Interference', 'dBm', 'higher', 'Interference'),
('Noise_Rise', 'dB', 'higher', 'Interference'),
('IoT', 'dB', 'higher', 'Interference');

-- Carrier Aggregation Metrics
INSERT INTO metrics_configuration (name, unit, degradation, "group") VALUES
('CA_Configuration_Success_Rate', '%', 'lower', 'Carrier Aggregation'),
('CA_Activation_Success_Rate', '%', 'lower', 'Carrier Aggregation'),
('SCell_Addition_Success_Rate', '%', 'lower', 'Carrier Aggregation'),
('SCell_Activation_Time', 'ms', 'higher', 'Carrier Aggregation'),
('CA_Throughput_Gain', '%', 'lower', 'Carrier Aggregation');

-- Dual Connectivity Metrics (EN-DC, NR-DC)
INSERT INTO metrics_configuration (name, unit, degradation, "group") VALUES
('ENDC_Setup_Success_Rate', '%', 'lower', 'Dual Connectivity'),
('ENDC_Addition_Success_Rate', '%', 'lower', 'Dual Connectivity'),
('SgNB_Addition_Success_Rate', '%', 'lower', 'Dual Connectivity'),
('SgNB_Modification_Success_Rate', '%', 'lower', 'Dual Connectivity'),
('DC_Throughput_Gain', '%', 'lower', 'Dual Connectivity'),
('MR_DC_Setup_Success_Rate', '%', 'lower', 'Dual Connectivity');




