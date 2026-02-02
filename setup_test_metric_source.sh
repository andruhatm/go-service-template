#!/bin/bash

# Script to set up a test metric source for EMS functionality
set -e

echo "=== Setting up test metric source ==="

# 1. Create test metrics file
echo "1. Creating test metrics file..."
cat > /tmp/ems_test_metrics.txt << 'EOF'
# Test metrics for EMS validation
# TYPE ems_test_counter counter
# HELP ems_test_counter Test counter metric from EMS
ems_test_counter{source="local_file",environment="test",node="test-node-1"} 100
ems_test_counter{source="local_file",environment="test",node="test-node-2"} 250

# TYPE ems_test_gauge gauge
# HELP ems_test_gauge Test gauge metric from EMS
ems_test_gauge{source="local_file",environment="test",type="cpu_usage"} 45.7
ems_test_gauge{source="local_file",environment="test",type="memory_usage"} 67.3

# TYPE ems_http_requests_total counter
# HELP ems_http_requests_total HTTP requests from EMS test
ems_http_requests_total{method="GET",status="200",source="ems"} 5432
ems_http_requests_total{method="POST",status="201",source="ems"} 1876
ems_http_requests_total{method="GET",status="404",source="ems"} 123

# TYPE ems_node_temperature_celsius gauge
# HELP ems_node_temperature_celsius Node temperature in Celsius
ems_node_temperature_celsius{node="node-1",location="datacenter-a"} 38.5
ems_node_temperature_celsius{node="node-2",location="datacenter-a"} 42.1
ems_node_temperature_celsius{node="node-3",location="datacenter-b"} 35.8

# TYPE ems_data_processed_bytes_total counter
# HELP ems_data_processed_bytes_total Total bytes processed
ems_data_processed_bytes_total{processor="stream-1"} 98765432100
ems_data_processed_bytes_total{processor="stream-2"} 87654321000
ems_data_processed_bytes_total{processor="batch-1"} 56789012300
EOF

echo "✓ Test metrics file created at /tmp/ems_test_metrics.txt"

# 2. Insert test source into database
echo "2. Inserting test metric source into database..."
docker-compose exec -T db psql -U user -d appdb << 'EOSQL'
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
ON CONFLICT DO NOTHING;

-- Show inserted source
SELECT 
    id,
    source_name,
    connection_type,
    file_path,
    schedule,
    enabled,
    created_at
FROM metric_sources
WHERE source_name = 'Test Local File Source';
EOSQL

echo "✓ Test source inserted into database"

# 3. Show current sources
echo ""
echo "3. Current metric sources:"
docker-compose exec -T db psql -U user -d appdb -c "
SELECT 
    id,
    source_name,
    connection_type,
    schedule,
    enabled,
    last_sync_status,
    last_sync_at
FROM metric_sources
ORDER BY id;
"

echo ""
echo "=== Setup complete! ==="
echo ""
echo "Next steps:"
echo "1. Wait up to 1 minute for automatic sync"
echo "2. Check logs: docker-compose logs -f go-api | grep 'metric importer'"
echo "3. Verify in VictoriaMetrics: curl 'http://localhost:8428/api/v1/query?query=ems_test_counter'"
echo "4. Check UI: Open http://localhost:4200/ems (or your frontend URL)"
echo ""
echo "To manually verify sync status:"
echo "  docker-compose exec db psql -U user -d appdb -c \"SELECT id, source_name, last_sync_status, last_sync_at FROM metric_sources;\""
