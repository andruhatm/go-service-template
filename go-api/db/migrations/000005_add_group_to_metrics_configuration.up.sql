-- Add group column to metrics_configuration table
ALTER TABLE metrics_configuration ADD COLUMN IF NOT EXISTS "group" VARCHAR(100);

-- Create index for the group column for better query performance
CREATE INDEX IF NOT EXISTS idx_metrics_configuration_group ON metrics_configuration("group");

-- Update existing metrics with their appropriate groups

-- Radio Quality Metrics
UPDATE metrics_configuration SET "group" = 'Radio Quality' 
WHERE name IN ('RSRP', 'RSRQ', 'RSSI', 'SINR', 'CQI', 'BLER');

-- Throughput Metrics
UPDATE metrics_configuration SET "group" = 'Throughput' 
WHERE name IN ('DL_Throughput', 'UL_Throughput', 'PRB_Utilization_DL', 'PRB_Utilization_UL', 'Cell_Throughput', 'User_Throughput_Mean');

-- Latency Metrics
UPDATE metrics_configuration SET "group" = 'Latency' 
WHERE name IN ('Latency', 'Jitter', 'RTT', 'Packet_Delay');

-- Call/Session Quality Metrics
UPDATE metrics_configuration SET "group" = 'Call/Session Quality' 
WHERE name IN ('Call_Drop_Rate', 'Handover_Success_Rate', 'RRC_Connection_Success_Rate', 'Packet_Loss_Rate', 'RAB_Setup_Success_Rate', 'ERAB_Setup_Success_Rate');

-- 5G Specific Metrics
UPDATE metrics_configuration SET "group" = '5G Specific' 
WHERE name IN ('SS-RSRP', 'SS-RSRQ', 'SS-SINR', 'CSI-RSRP', 'CSI-RSRQ', 'CSI-SINR');

-- Network Performance Metrics
UPDATE metrics_configuration SET "group" = 'Network Performance' 
WHERE name IN ('Active_Users', 'RRC_Connected_Users', 'Spectral_Efficiency', 'Cell_Availability', 'Interference_Level', 'Retransmission_Rate');


