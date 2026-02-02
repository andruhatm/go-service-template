#!/bin/bash

# Script to verify EMS integration between UI, backend, and database
set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== EMS Integration Verification ===${NC}\n"

# 1. Check if backend is running
echo -e "${YELLOW}1. Checking backend service...${NC}"
if curl -s http://localhost:8081/probes/readiness > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend is running${NC}\n"
else
    echo -e "${RED}✗ Backend is not running or not responding${NC}"
    echo "Start with: docker-compose up -d go-api"
    exit 1
fi

# 2. Check database connection
echo -e "${YELLOW}2. Checking database...${NC}"
DB_CHECK=$(docker-compose exec -T db psql -U user -d appdb -c "SELECT 1;" 2>&1)
if [[ $DB_CHECK == *"1"* ]]; then
    echo -e "${GREEN}✓ Database is accessible${NC}\n"
else
    echo -e "${RED}✗ Database connection failed${NC}"
    exit 1
fi

# 3. Check if metric_sources table exists
echo -e "${YELLOW}3. Checking metric_sources table...${NC}"
TABLE_EXISTS=$(docker-compose exec -T db psql -U user -d appdb -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'metric_sources');" -t)
if [[ $TABLE_EXISTS == *"t"* ]]; then
    echo -e "${GREEN}✓ metric_sources table exists${NC}\n"
else
    echo -e "${RED}✗ metric_sources table not found${NC}"
    echo "Run migration: docker-compose restart go-api"
    exit 1
fi

# 4. Check sources count
echo -e "${YELLOW}4. Checking metric sources...${NC}"
SOURCE_COUNT=$(docker-compose exec -T db psql -U user -d appdb -c "SELECT COUNT(*) FROM metric_sources;" -t | xargs)
echo -e "Found ${BLUE}${SOURCE_COUNT}${NC} metric source(s)\n"

if [ "$SOURCE_COUNT" -eq "0" ]; then
    echo -e "${YELLOW}No sources found. Creating test source...${NC}"
    
    # Create test metrics file
    cat > /tmp/ems_test_metrics.txt << 'EOF'
# TYPE ems_test_counter counter
ems_test_counter{source="test",node="node1"} 100
ems_test_gauge{source="test",node="node1"} 42.5
EOF
    
    # Insert test source
    docker-compose exec -T db psql -U user -d appdb << 'EOSQL'
INSERT INTO metric_sources (source_name, connection_type, host, port, file_path, schedule, enabled)
VALUES ('Test Local Source', 'file', 'localhost', 0, '/tmp/ems_test_metrics.txt', '1m', true);
EOSQL
    
    echo -e "${GREEN}✓ Test source created${NC}\n"
fi

# 5. Show sources details
echo -e "${YELLOW}5. Current metric sources:${NC}"
docker-compose exec -T db psql -U user -d appdb << 'EOSQL'
SELECT 
    id,
    source_name AS name,
    connection_type AS type,
    schedule,
    enabled,
    CASE 
        WHEN last_sync_status = 'success' THEN '✓ ' || last_sync_status
        WHEN last_sync_status = 'error' THEN '✗ ' || last_sync_status
        WHEN last_sync_status = 'pending' THEN '⏳ ' || last_sync_status
        ELSE '— not synced yet'
    END AS status,
    to_char(last_sync_at, 'YYYY-MM-DD HH24:MI:SS') AS last_sync
FROM metric_sources
ORDER BY id;
EOSQL
echo ""

# 6. Test backend API endpoint
echo -e "${YELLOW}6. Testing backend API endpoint...${NC}"
API_RESPONSE=$(curl -s http://localhost:8081/api/ems 2>&1)
if [[ $API_RESPONSE == "["* ]]; then
    SOURCE_COUNT_API=$(echo $API_RESPONSE | grep -o '"id":' | wc -l | xargs)
    echo -e "${GREEN}✓ API endpoint working${NC}"
    echo -e "API returned ${BLUE}${SOURCE_COUNT_API}${NC} source(s)\n"
else
    echo -e "${RED}✗ API endpoint not working${NC}"
    echo "Response: $API_RESPONSE"
    echo -e "\n${YELLOW}Note: If you see 'Unauthorized', this endpoint requires authentication.${NC}"
    echo "The UI will handle authentication automatically."
fi

# 7. Check VictoriaMetrics
echo -e "${YELLOW}7. Checking VictoriaMetrics...${NC}"
if curl -s http://localhost:8428/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ VictoriaMetrics is running${NC}\n"
else
    echo -e "${RED}✗ VictoriaMetrics is not accessible${NC}\n"
fi

# 8. Check metric importer logs
echo -e "${YELLOW}8. Checking metric importer service logs...${NC}"
IMPORTER_LOGS=$(docker-compose logs --tail=20 go-api 2>&1 | grep -i "metric importer" || echo "")
if [[ $IMPORTER_LOGS == *"Starting metric importer"* ]]; then
    echo -e "${GREEN}✓ Metric importer service is running${NC}\n"
    
    # Check for recent syncs
    RECENT_SYNCS=$(docker-compose logs --tail=50 go-api 2>&1 | grep -i "syncing source\|successfully synced" | tail -5)
    if [ ! -z "$RECENT_SYNCS" ]; then
        echo -e "${GREEN}Recent sync activity:${NC}"
        echo "$RECENT_SYNCS"
        echo ""
    fi
else
    echo -e "${RED}✗ Metric importer service not found in logs${NC}\n"
fi

# 9. Summary and next steps
echo -e "${BLUE}=== Summary ===${NC}"
echo -e "Backend: ${GREEN}✓${NC}"
echo -e "Database: ${GREEN}✓${NC}"
echo -e "Sources count: ${BLUE}${SOURCE_COUNT}${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Open frontend: http://localhost:4200/ems (or your frontend URL)"
echo "2. You should see the metric sources in 'Текущие подписки' table"
echo "3. Wait 1 minute for automatic sync"
echo "4. Check sync status in the table (should show ✓ success)"
echo ""
echo "To monitor syncs in real-time:"
echo "  docker-compose logs -f go-api | grep -i 'sync'"
echo ""
echo "To check imported metrics:"
echo "  curl 'http://localhost:8428/api/v1/query?query=ems_test_counter'"
