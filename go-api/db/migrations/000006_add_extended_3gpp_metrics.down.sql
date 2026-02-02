-- Remove all extended 3GPP metrics added in migration 000006

DELETE FROM metrics_configuration WHERE name IN (
  -- Accessibility Metrics
  'RRC_Setup_Success_Rate', 'RRC_Setup_Failure_Rate', 'RRC_Setup_Attempts',
  'RACH_Success_Rate', 'RACH_Preamble_Attempts', 'S1_Setup_Success_Rate',
  'Initial_Context_Setup_Success_Rate', 'Service_Request_Success_Rate',
  'Attach_Success_Rate', 'PDN_Connection_Success_Rate',
  
  -- Retainability Metrics
  'RRC_Connection_Abnormal_Release_Rate', 'ERAB_Abnormal_Release_Rate',
  'Session_Drop_Rate', 'UE_Context_Release_Rate', 'Radio_Link_Failure_Rate',
  'Connection_Retention_Rate', 'Mean_Time_Between_Failures',
  
  -- Mobility Metrics
  'Intra_Freq_Handover_Success_Rate', 'Inter_Freq_Handover_Success_Rate',
  'Inter_RAT_Handover_Success_Rate', 'X2_Handover_Success_Rate',
  'S1_Handover_Success_Rate', 'Handover_Preparation_Time',
  'Handover_Execution_Time', 'Handover_Failure_Rate',
  'Ping_Pong_Handover_Rate', 'Mobility_Interruption_Time',
  
  -- Integrity Metrics
  'PDCP_SDU_Loss_Rate', 'RLC_Retransmission_Rate', 'MAC_Retransmission_Rate',
  'HARQ_Retransmission_Rate', 'FER', 'Residual_BER',
  'IP_Packet_Loss_Rate', 'Data_Integrity_Success_Rate',
  
  -- Resource Utilization Metrics
  'PRB_Utilization_Mean', 'CCE_Utilization', 'PUCCH_Utilization',
  'PDCCH_Utilization', 'Licensed_Spectrum_Efficiency',
  'Resource_Block_Usage_Rate', 'Carrier_Aggregation_Utilization',
  
  -- Capacity Metrics
  'Max_Active_UE_DL', 'Max_Active_UE_UL', 'Average_Active_UE',
  'Peak_Connected_Users', 'Connection_Density',
  'Traffic_Volume_DL', 'Traffic_Volume_UL', 'Area_Traffic_Capacity',
  
  -- VoLTE/VoNR Metrics
  'VoLTE_Call_Setup_Success_Rate', 'VoLTE_Call_Drop_Rate',
  'VoLTE_SRVCC_Success_Rate', 'Voice_MOS', 'Voice_Packet_Loss_Rate',
  'Voice_Jitter', 'E2E_Voice_Latency', 'VoNR_Call_Setup_Success_Rate',
  
  -- Advanced 5G NR Metrics
  'Beam_Management_Success_Rate', 'SSB_RSRP', 'Beam_Switching_Time',
  'Massive_MIMO_Efficiency', 'Network_Slice_Availability',
  'Network_Slice_Isolation', 'URLLC_Reliability', 'URLLC_Latency',
  'mMTC_Connection_Density', 'eMBB_Peak_Data_Rate',
  
  -- Control Plane Metrics
  'Control_Plane_Latency', 'Idle_to_Active_Transition_Time',
  'Paging_Success_Rate', 'TAU_Success_Rate', 'Registration_Success_Rate',
  'Signaling_Load',
  
  -- User Plane Metrics
  'User_Plane_Latency', 'User_Experienced_Data_Rate_DL',
  'User_Experienced_Data_Rate_UL', 'Cell_Edge_User_Throughput_DL',
  'Cell_Edge_User_Throughput_UL', 'Average_User_Throughput_DL',
  'Average_User_Throughput_UL', 'Peak_User_Throughput_DL',
  'Peak_User_Throughput_UL',
  
  -- Energy Efficiency Metrics
  'Network_Energy_Efficiency', 'UE_Energy_Efficiency',
  'Power_Consumption_Per_Cell', 'Energy_Per_Bit', 'Sleep_Mode_Efficiency',
  
  -- QoS Metrics
  'QCI_1_Packet_Loss_Rate', 'QCI_5_Packet_Loss_Rate',
  'QCI_9_Packet_Loss_Rate', 'GBR_Bearer_Setup_Success_Rate',
  'Non_GBR_Bearer_Setup_Success_Rate', 'QoS_Flow_Setup_Success_Rate',
  'PDB_Violation_Rate', 'PELR_Violation_Rate',
  
  -- Coverage Metrics
  'Coverage_Area', 'Indoor_Coverage_Ratio', 'Outdoor_Coverage_Ratio',
  'Deep_Indoor_Penetration', 'Cell_Range', 'Coverage_Probability',
  
  -- Interference Metrics
  'Inter_Cell_Interference', 'Intra_Cell_Interference',
  'Adjacent_Channel_Interference', 'Co_Channel_Interference',
  'Noise_Rise', 'IoT',
  
  -- Carrier Aggregation Metrics
  'CA_Configuration_Success_Rate', 'CA_Activation_Success_Rate',
  'SCell_Addition_Success_Rate', 'SCell_Activation_Time',
  'CA_Throughput_Gain',
  
  -- Dual Connectivity Metrics
  'ENDC_Setup_Success_Rate', 'ENDC_Addition_Success_Rate',
  'SgNB_Addition_Success_Rate', 'SgNB_Modification_Success_Rate',
  'DC_Throughput_Gain', 'MR_DC_Setup_Success_Rate'
);


