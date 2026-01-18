-- SQL скрипт для создания тестовых monitoring objects
-- Простая версия без ON CONFLICT

-- Очистка старых тестовых узлов
DELETE FROM mon_objects WHERE name LIKE 'test_node_%';

-- Вставка 10 тестовых узлов
INSERT INTO mon_objects (id, name, type, technology, platform, network, manufacturer, created_at, updated_at)
VALUES
  (gen_random_uuid(), 'test_node_01', 'eNodeB', '4G', 'Ericsson', 'Test Network', 'Ericsson', NOW(), NOW()),
  (gen_random_uuid(), 'test_node_02', 'eNodeB', '4G', 'Huawei', 'Test Network', 'Huawei', NOW(), NOW()),
  (gen_random_uuid(), 'test_node_03', 'gNodeB', '5G', 'Nokia', 'Test Network', 'Nokia', NOW(), NOW()),
  (gen_random_uuid(), 'test_node_04', 'gNodeB', '5G', 'Samsung', 'Test Network', 'Samsung', NOW(), NOW()),
  (gen_random_uuid(), 'test_node_05', 'eNodeB', '4G', 'ZTE', 'Test Network', 'ZTE', NOW(), NOW()),
  (gen_random_uuid(), 'test_node_06', 'Server', 'Core', 'Dell', 'Test Network', 'Dell', NOW(), NOW()),
  (gen_random_uuid(), 'test_node_07', 'Router', 'Network', 'Cisco', 'Test Network', 'Cisco', NOW(), NOW()),
  (gen_random_uuid(), 'test_node_08', 'gNodeB', '5G', 'Ericsson', 'Test Network', 'Ericsson', NOW(), NOW()),
  (gen_random_uuid(), 'test_node_09', 'eNodeB', '4G', 'Huawei', 'Test Network', 'Huawei', NOW(), NOW()),
  (gen_random_uuid(), 'test_node_10', 'Server', 'Core', 'HP', 'Test Network', 'HP', NOW(), NOW());

-- Проверка результатов
SELECT 
  name, 
  type, 
  technology, 
  manufacturer
FROM mon_objects 
WHERE name LIKE 'test_node_%' 
ORDER BY name;

-- Вывод количества
SELECT COUNT(*) as "Создано тестовых узлов" 
FROM mon_objects 
WHERE name LIKE 'test_node_%';

