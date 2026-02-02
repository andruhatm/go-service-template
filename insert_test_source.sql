-- SQL script to insert a test metric source
-- Usage: docker-compose exec db psql -U user -d appdb -f /path/to/insert_test_source.sql

-- First, create the test metrics file (run this in shell first):
-- cat > /tmp/ems_test_metrics.txt << 'EOF'
-- # TYPE ems_test_counter counter
-- ems_test_counter{source="test",node="node1"} 100
-- ems_test_gauge{source="test",node="node1"} 42.5
-- EOF

-- Insert test metric source
INSERT INTO metric_sources (
    source_name,
    description,
    connection_type,
    host,
    port,
    file_path,
    schedule,
    enabled,
    created_by
) VALUES (
    'Test Local File Source',
    'Тестовый источник для проверки импорта метрик из локального файла',
    'file',
    'localhost',
    0,
    '/tmp/ems_test_metrics.txt',
    '1m',
    true,
    'system'
)
ON CONFLICT DO NOTHING
RETURNING id, source_name, connection_type, file_path, schedule, enabled;

-- Show all sources
SELECT 
    id,
    source_name,
    connection_type,
    host,
    file_path,
    schedule,
    enabled,
    last_sync_status,
    last_sync_at,
    created_at
FROM metric_sources
ORDER BY id;
