-- Insert sample eNodeB devices
INSERT INTO mon_objects (name, type, technology, platform, network, manufacturer) VALUES
('enb27738', 'eNodeB', 'LTE', 'virtual', 'Lester', 'Nokia'),
('enb27742', 'eNodeB', 'LTE', 'virtual', 'Lester', 'Nokia'),
('enb27746', 'eNodeB', 'LTE', 'virtual', 'Lester', 'Nokia'),
('enb27750', 'eNodeB', 'LTE', 'virtual', 'Spinney Hills', 'Nokia'),
('enb27754', 'eNodeB', 'LTE', 'virtual', 'Deyn Hills', 'Nokia');

-- Insert sample gNodeB devices (5G)
INSERT INTO mon_objects (name, type, technology, platform, network, manufacturer) VALUES
('gnb28001', 'gNodeB', '5G NR', 'physical', 'Core Network', 'Ericsson'),
('gnb28002', 'gNodeB', '5G NR', 'physical', 'Core Network', 'Ericsson'),
('gnb28003', 'gNodeB', '5G NR/LTE', 'physical', 'Core Network', 'Huawei');

-- Insert sample cells for enb27738
INSERT INTO mon_objects (name, type, technology, platform, network, manufacturer) VALUES
('Cell:7100928-S1', 'cell', 'LTE', 'virtual', 'Deyn Hills', 'Nokia'),
('Cell:7100929-S2', 'cell', 'LTE', 'virtual', 'Deyn Hills', 'Nokia'),
('Cell:7100930-S3', 'cell', 'LTE', 'virtual', 'Deyn Hills', 'Nokia');

-- Insert sample cells for enb27742
INSERT INTO mon_objects (name, type, technology, platform, network, manufacturer) VALUES
('Cell:7101952-S1', 'cell', 'LTE', 'virtual', 'Spinney Hills', 'Nokia'),
('Cell:7101953-S2', 'cell', 'LTE', 'virtual', 'Spinney Hills', 'Nokia'),
('Cell:7101954-S3', 'cell', 'LTE', 'virtual', 'Spinney Hills', 'Nokia');

-- Insert sample CU (Centralized Units)
INSERT INTO mon_objects (name, type, technology, platform, network, manufacturer) VALUES
('cu:27738-1', 'cu', 'LTE', 'virtual', 'Deyn Hills', 'Nokia'),
('cu:27742-1', 'cu', 'LTE', 'virtual', 'Spinney Hills', 'Nokia'),
('cu:28001-1', 'cu', '5G NR', 'physical', 'Core Network', 'Ericsson');

-- Insert sample DU (Distributed Units)
INSERT INTO mon_objects (name, type, technology, platform, network, manufacturer) VALUES
('du:27738-1', 'du', 'LTE', 'virtual', 'Deyn Hills', 'Nokia'),
('du:27742-1', 'du', 'LTE', 'virtual', 'Spinney Hills', 'Nokia'),
('du:28001-1', 'du', '5G NR', 'physical', 'Core Network', 'Ericsson');

-- Insert sample RRU (Remote Radio Units)
INSERT INTO mon_objects (name, type, technology, platform, network, manufacturer) VALUES
('RRH:27738-001', 'rru', 'LTE', 'physical', 'Deyn Hills', 'Nokia'),
('RRH:27738-002', 'rru', 'LTE', 'physical', 'Deyn Hills', 'Nokia'),
('RRH:27738-003', 'rru', 'LTE', 'physical', 'Deyn Hills', 'Nokia'),
('RRH:27742-001', 'rru', 'LTE', 'physical', 'Spinney Hills', 'Nokia'),
('RRH:27742-002', 'rru', 'LTE', 'physical', 'Spinney Hills', 'Nokia'),
('RRH:27742-003', 'rru', 'LTE', 'physical', 'Spinney Hills', 'Nokia');

-- Insert sample routers
INSERT INTO mon_objects (name, type, technology, platform, network, manufacturer) VALUES
('router-core-01', 'router', 'Cisco IOS-XE', 'Catalyst 9000', 'Core Network', 'Cisco Systems'),
('router-core-02', 'router', 'Cisco IOS-XE', 'Catalyst 9000', 'Core Network', 'Cisco Systems'),
('router-edge-01', 'router', 'Juniper JunOS', 'MX Series', 'Edge Network', 'Juniper Networks');

-- Insert sample switches
INSERT INTO mon_objects (name, type, technology, platform, network, manufacturer) VALUES
('switch-access-01', 'switch', 'Cisco IOS', 'Catalyst 2960', 'Access Layer', 'Cisco Systems'),
('switch-access-02', 'switch', 'Cisco IOS', 'Catalyst 2960', 'Access Layer', 'Cisco Systems'),
('switch-core-01', 'switch', 'Arista EOS', 'DCS-7280', 'Core Network', 'Arista Networks');

-- Insert sample servers
INSERT INTO mon_objects (name, type, technology, platform, network, manufacturer) VALUES
('server-db-01', 'server', 'Linux Ubuntu', 'Dell PowerEdge', 'Data Center', 'Dell'),
('server-app-01', 'server', 'Linux RHEL', 'HP ProLiant', 'Data Center', 'HP'),
('server-backup-01', 'server', 'Linux CentOS', 'Lenovo ThinkSystem', 'Data Center', 'Lenovo');

