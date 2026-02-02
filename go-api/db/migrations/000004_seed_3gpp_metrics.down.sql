-- Remove all 3GPP metrics
DELETE FROM metrics_configuration WHERE name IN (
  -- Radio Quality Metrics
  'RSRP', 'RSRQ', 'RSSI', 'SINR', 'CQI', 'BLER',
  -- Throughput Metrics
  'DL_Throughput', 'UL_Throughput', 'PRB_Utilization_DL', 'PRB_Utilization_UL', 
  'Cell_Throughput', 'User_Throughput_Mean',
  -- Latency Metrics
  'Latency', 'Jitter', 'RTT', 'Packet_Delay',
  -- Call/Session Quality Metrics
  'Call_Drop_Rate', 'Handover_Success_Rate', 'RRC_Connection_Success_Rate', 
  'Packet_Loss_Rate', 'RAB_Setup_Success_Rate', 'ERAB_Setup_Success_Rate',
  -- 5G Specific Metrics
  'SS-RSRP', 'SS-RSRQ', 'SS-SINR', 'CSI-RSRP', 'CSI-RSRQ', 'CSI-SINR',
  -- Network Performance Metrics
  'Active_Users', 'RRC_Connected_Users', 'Spectral_Efficiency', 
  'Cell_Availability', 'Interference_Level', 'Retransmission_Rate'
);



