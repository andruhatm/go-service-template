-- Insert 3GPP Radio Quality Metrics
INSERT INTO metrics_configuration (name, unit, degradation, "group") VALUES
('RSRP', 'dBm', 'lower', 'Radio Quality'),
('RSRQ', 'dB', 'lower', 'Radio Quality'),
('RSSI', 'dBm', 'lower', 'Radio Quality'),
('SINR', 'dB', 'lower', 'Radio Quality'),
('CQI', 'index', 'lower', 'Radio Quality'),
('BLER', '%', 'higher', 'Radio Quality');

-- Insert 3GPP Throughput Metrics
INSERT INTO metrics_configuration (name, unit, degradation, "group") VALUES
('DL_Throughput', 'Mbps', 'lower', 'Throughput'),
('UL_Throughput', 'Mbps', 'lower', 'Throughput'),
('PRB_Utilization_DL', '%', 'higher', 'Throughput'),
('PRB_Utilization_UL', '%', 'higher', 'Throughput'),
('Cell_Throughput', 'Mbps', 'lower', 'Throughput'),
('User_Throughput_Mean', 'Mbps', 'lower', 'Throughput');

-- Insert 3GPP Latency Metrics
INSERT INTO metrics_configuration (name, unit, degradation, "group") VALUES
('Latency', 'ms', 'higher', 'Latency'),
('Jitter', 'ms', 'higher', 'Latency'),
('RTT', 'ms', 'higher', 'Latency'),
('Packet_Delay', 'ms', 'higher', 'Latency');

-- Insert 3GPP Call/Session Quality Metrics
INSERT INTO metrics_configuration (name, unit, degradation, "group") VALUES
('Call_Drop_Rate', '%', 'higher', 'Call/Session Quality'),
('Handover_Success_Rate', '%', 'lower', 'Call/Session Quality'),
('RRC_Connection_Success_Rate', '%', 'lower', 'Call/Session Quality'),
('Packet_Loss_Rate', '%', 'higher', 'Call/Session Quality'),
('RAB_Setup_Success_Rate', '%', 'lower', 'Call/Session Quality'),
('ERAB_Setup_Success_Rate', '%', 'lower', 'Call/Session Quality');

-- Insert 3GPP 5G Specific Metrics
INSERT INTO metrics_configuration (name, unit, degradation, "group") VALUES
('SS-RSRP', 'dBm', 'lower', '5G Specific'),
('SS-RSRQ', 'dB', 'lower', '5G Specific'),
('SS-SINR', 'dB', 'lower', '5G Specific'),
('CSI-RSRP', 'dBm', 'lower', '5G Specific'),
('CSI-RSRQ', 'dB', 'lower', '5G Specific'),
('CSI-SINR', 'dB', 'lower', '5G Specific');

-- Insert 3GPP Network Performance Metrics
INSERT INTO metrics_configuration (name, unit, degradation, "group") VALUES
('Active_Users', 'count', 'higher', 'Network Performance'),
('RRC_Connected_Users', 'count', 'higher', 'Network Performance'),
('Spectral_Efficiency', 'bps/Hz', 'lower', 'Network Performance'),
('Cell_Availability', '%', 'lower', 'Network Performance'),
('Interference_Level', 'dBm', 'higher', 'Network Performance'),
('Retransmission_Rate', '%', 'higher', 'Network Performance');


