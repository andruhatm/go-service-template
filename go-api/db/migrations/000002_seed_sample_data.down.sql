-- Remove all sample data
DELETE FROM mon_objects WHERE name IN (
  -- eNodeB devices
  'enb27738', 'enb27742', 'enb27746', 'enb27750', 'enb27754',
  -- gNodeB devices
  'gnb28001', 'gnb28002', 'gnb28003',
  -- Cells
  'Cell:7100928-S1', 'Cell:7100929-S2', 'Cell:7100930-S3',
  'Cell:7101952-S1', 'Cell:7101953-S2', 'Cell:7101954-S3',
  -- CU
  'cu:27738-1', 'cu:27742-1', 'cu:28001-1',
  -- DU
  'du:27738-1', 'du:27742-1', 'du:28001-1',
  -- RRU
  'RRH:27738-001', 'RRH:27738-002', 'RRH:27738-003',
  'RRH:27742-001', 'RRH:27742-002', 'RRH:27742-003',
  -- Routers
  'router-core-01', 'router-core-02', 'router-edge-01',
  -- Switches
  'switch-access-01', 'switch-access-02', 'switch-core-01',
  -- Servers
  'server-db-01', 'server-app-01', 'server-backup-01'
);

