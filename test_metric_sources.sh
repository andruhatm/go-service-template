#!/bin/bash

# Test script for Metric Sources (EMS) functionality
# Usage: ./test_metric_sources.sh [TOKEN]

set -e

BASE_URL="http://localhost:8081"
KEYCLOAK_URL="http://localhost:8080"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Metric Sources (EMS) Test Script ===${NC}\n"

# Get token if not provided
if [ -z "$1" ]; then
  echo -e "${YELLOW}Getting authentication token from Keycloak...${NC}"
  TOKEN=$(curl -s -X POST "${KEYCLOAK_URL}/realms/myrealm/protocol/openid-connect/token" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "username=admin" \
    -d "password=admin" \
    -d "grant_type=password" \
    -d "client_id=spa-client" \
    -d "client_secret=jym5bshxscBAQJqBsfo45hphL0oRdhx3" \
    | jq -r '.access_token')
  
  if [ -z "$TOKEN" ] || [ "$TOKEN" == "null" ]; then
    echo -e "${RED}Failed to get token. Check Keycloak is running and credentials are correct.${NC}"
    exit 1
  fi
  echo -e "${GREEN}✓ Token obtained${NC}\n"
else
  TOKEN=$1
  echo -e "${GREEN}Using provided token${NC}\n"
fi

# Create test metrics file
echo -e "${YELLOW}Creating test metrics file...${NC}"
cat > /tmp/test_ems_metrics.txt << 'EOF'
# TYPE ems_test_counter counter
# HELP ems_test_counter Test counter metric from EMS
ems_test_counter{source="ems_test",environment="test",type="automated"} 12345

# TYPE ems_test_gauge gauge
# HELP ems_test_gauge Test gauge metric from EMS
ems_test_gauge{source="ems_test",environment="test",type="automated"} 67.89

# TYPE ems_http_requests_total counter
# HELP ems_http_requests_total HTTP requests from EMS test
ems_http_requests_total{method="GET",status="200",source="ems_test"} 9876
ems_http_requests_total{method="POST",status="201",source="ems_test"} 4321

# TYPE ems_response_time_seconds histogram
# HELP ems_response_time_seconds Response time histogram
ems_response_time_seconds_bucket{le="0.1"} 100
ems_response_time_seconds_bucket{le="0.5"} 250
ems_response_time_seconds_bucket{le="1.0"} 450
ems_response_time_seconds_bucket{le="+Inf"} 500
ems_response_time_seconds_sum 125.5
ems_response_time_seconds_count 500
EOF
echo -e "${GREEN}✓ Test metrics file created at /tmp/test_ems_metrics.txt${NC}\n"

# Test 1: List sources (should be empty or show existing)
echo -e "${YELLOW}Test 1: List all metric sources...${NC}"
LIST_RESPONSE=$(curl -s -X GET "${BASE_URL}/api/ems" \
  -H "Authorization: Bearer ${TOKEN}")
echo "$LIST_RESPONSE" | jq '.'
echo -e "${GREEN}✓ List sources successful${NC}\n"

# Test 2: Create a new source
echo -e "${YELLOW}Test 2: Create new metric source...${NC}"
CREATE_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/ems" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "source_name": "EMS Test Source",
    "description": "Automated test source for EMS functionality",
    "connection_type": "file",
    "host": "localhost",
    "FTPport": 0,
    "file_path": "/tmp/test_ems_metrics.txt",
    "schedule": "30s",
    "enabled": true
  }')

echo "$CREATE_RESPONSE" | jq '.'
SOURCE_ID=$(echo "$CREATE_RESPONSE" | jq -r '.id')

if [ -z "$SOURCE_ID" ] || [ "$SOURCE_ID" == "null" ]; then
  echo -e "${RED}✗ Failed to create source${NC}"
  exit 1
fi
echo -e "${GREEN}✓ Source created with ID: ${SOURCE_ID}${NC}\n"

# Test 3: Get specific source
echo -e "${YELLOW}Test 3: Get source by ID...${NC}"
GET_RESPONSE=$(curl -s -X GET "${BASE_URL}/api/ems/${SOURCE_ID}" \
  -H "Authorization: Bearer ${TOKEN}")
echo "$GET_RESPONSE" | jq '.'
echo -e "${GREEN}✓ Get source successful${NC}\n"

# Test 4: Wait for sync (30 seconds + buffer)
echo -e "${YELLOW}Test 4: Waiting 35 seconds for automatic sync...${NC}"
for i in {35..1}; do
  echo -ne "  ${i} seconds remaining...\r"
  sleep 1
done
echo -e "\n${GREEN}✓ Wait completed${NC}\n"

# Test 5: Check sync status
echo -e "${YELLOW}Test 5: Check sync status...${NC}"
STATUS_RESPONSE=$(curl -s -X GET "${BASE_URL}/api/ems/${SOURCE_ID}" \
  -H "Authorization: Bearer ${TOKEN}")
echo "$STATUS_RESPONSE" | jq '.'

SYNC_STATUS=$(echo "$STATUS_RESPONSE" | jq -r '.last_sync_status')
SYNC_ERROR=$(echo "$STATUS_RESPONSE" | jq -r '.last_sync_error')

if [ "$SYNC_STATUS" == "success" ]; then
  echo -e "${GREEN}✓ Sync successful!${NC}\n"
elif [ "$SYNC_STATUS" == "error" ]; then
  echo -e "${RED}✗ Sync failed with error: ${SYNC_ERROR}${NC}\n"
else
  echo -e "${YELLOW}⚠ Sync status: ${SYNC_STATUS}${NC}\n"
fi

# Test 6: Verify metrics in VictoriaMetrics
echo -e "${YELLOW}Test 6: Verify metrics in VictoriaMetrics...${NC}"
VM_RESPONSE=$(curl -s "http://localhost:8428/api/v1/query?query=ems_test_counter")
echo "$VM_RESPONSE" | jq '.'

RESULT_COUNT=$(echo "$VM_RESPONSE" | jq '.data.result | length')
if [ "$RESULT_COUNT" -gt 0 ]; then
  echo -e "${GREEN}✓ Metrics found in VictoriaMetrics (${RESULT_COUNT} results)${NC}\n"
else
  echo -e "${YELLOW}⚠ No metrics found yet (may need more time)${NC}\n"
fi

# Test 7: Update source
echo -e "${YELLOW}Test 7: Update source schedule...${NC}"
UPDATE_RESPONSE=$(curl -s -X PUT "${BASE_URL}/api/ems/${SOURCE_ID}" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "schedule": "1m",
    "description": "Updated test source"
  }')
echo "$UPDATE_RESPONSE" | jq '.'
echo -e "${GREEN}✓ Source updated${NC}\n"

# Test 8: Disable source
echo -e "${YELLOW}Test 8: Disable source...${NC}"
DISABLE_RESPONSE=$(curl -s -X PUT "${BASE_URL}/api/ems/${SOURCE_ID}" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "enabled": false
  }')
echo "$DISABLE_RESPONSE" | jq '.'
ENABLED=$(echo "$DISABLE_RESPONSE" | jq -r '.enabled')
if [ "$ENABLED" == "false" ]; then
  echo -e "${GREEN}✓ Source disabled${NC}\n"
else
  echo -e "${RED}✗ Failed to disable source${NC}\n"
fi

# Test 9: Re-enable source
echo -e "${YELLOW}Test 9: Re-enable source...${NC}"
ENABLE_RESPONSE=$(curl -s -X PUT "${BASE_URL}/api/ems/${SOURCE_ID}" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "enabled": true
  }')
ENABLED=$(echo "$ENABLE_RESPONSE" | jq -r '.enabled')
if [ "$ENABLED" == "true" ]; then
  echo -e "${GREEN}✓ Source re-enabled${NC}\n"
else
  echo -e "${RED}✗ Failed to re-enable source${NC}\n"
fi

# Test 10: Delete source (optional - uncomment to test)
read -p "Delete test source? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo -e "${YELLOW}Test 10: Delete source...${NC}"
  curl -s -X DELETE "${BASE_URL}/api/ems/${SOURCE_ID}" \
    -H "Authorization: Bearer ${TOKEN}" \
    -w "\nHTTP Status: %{http_code}\n"
  
  # Verify deletion
  GET_DELETED=$(curl -s -w "\n%{http_code}" -X GET "${BASE_URL}/api/ems/${SOURCE_ID}" \
    -H "Authorization: Bearer ${TOKEN}")
  STATUS_CODE=$(echo "$GET_DELETED" | tail -n1)
  
  if [ "$STATUS_CODE" == "404" ]; then
    echo -e "${GREEN}✓ Source deleted successfully${NC}\n"
  else
    echo -e "${RED}✗ Source still exists${NC}\n"
  fi
else
  echo -e "${YELLOW}Skipping deletion. Source ID ${SOURCE_ID} is still active.${NC}\n"
fi

# Summary
echo -e "${GREEN}=== Test Summary ===${NC}"
echo -e "Source ID: ${SOURCE_ID}"
echo -e "Test metrics file: /tmp/test_ems_metrics.txt"
echo -e "Last sync status: ${SYNC_STATUS}"
if [ "$SYNC_STATUS" == "success" ]; then
  echo -e "${GREEN}All tests passed! ✓${NC}"
else
  echo -e "${YELLOW}Some tests had warnings. Check logs for details.${NC}"
fi

echo -e "\n${YELLOW}Additional Checks:${NC}"
echo -e "1. Check service logs: docker-compose logs -f go-api | grep 'metric importer'"
echo -e "2. Query VictoriaMetrics: curl 'http://localhost:8428/api/v1/query?query=ems_test_counter'"
echo -e "3. View all sources: curl -H 'Authorization: Bearer \$TOKEN' http://localhost:8081/api/ems | jq"
echo -e "4. Check database: docker-compose exec db psql -U user -d appdb -c 'SELECT * FROM metric_sources;'"
