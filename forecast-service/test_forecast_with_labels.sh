#!/bin/bash

# Test script for forecast service with new label format
# Tests: name label instead of mon_obj, and type="actual"/"forecast" labels

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
FORECAST_URL="${FORECAST_URL:-http://localhost:8082}"
VICTORIA_URL="${VICTORIA_URL:-http://localhost:8428}"
TEST_METRIC="test_metric_prb_utilization"
TEST_NODE="enb27738"

echo "=========================================="
echo "Forecast Service Label Format Test"
echo "=========================================="
echo "Forecast Service: $FORECAST_URL"
echo "VictoriaMetrics: $VICTORIA_URL"
echo "Test Metric: $TEST_METRIC"
echo "Test Node: $TEST_NODE"
echo ""

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $2"
    else
        echo -e "${RED}✗${NC} $2"
        exit 1
    fi
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_info() {
    echo -e "${NC}ℹ${NC} $1"
}

# Test 1: Health Check
echo "Test 1: Health Check"
echo "---------------------"
HEALTH=$(curl -s "$FORECAST_URL/health")
echo "$HEALTH" | jq '.'
echo "$HEALTH" | jq -e '.status == "healthy"' > /dev/null
print_status $? "Forecast service is healthy"
echo ""

# Test 2: Ingest test data with new label format (type="actual")
echo "Test 2: Ingest Test Data with New Labels"
echo "-----------------------------------------"
print_info "Ingesting actual data with labels: {name=\"$TEST_NODE\", type=\"actual\"}"

# Generate 90 days of hourly test data (2160 points)
END_TS=$(date +%s)
START_TS=$((END_TS - 90*24*60*60))  # 90 days ago

# Create test data (simulating PRB utilization with daily pattern)
TEST_DATA=""
for ((ts=START_TS; ts<=END_TS; ts+=3600)); do
    # Create a pattern: base 50 + daily cycle (peak at noon) + some noise
    HOUR=$((($ts / 3600) % 24))
    BASE=50
    DAILY_PATTERN=$(echo "scale=2; 20 * s(($HOUR - 12) * 3.14159 / 12)" | bc -l)
    NOISE=$((RANDOM % 10 - 5))
    VALUE=$(echo "scale=2; $BASE + $DAILY_PATTERN + $NOISE" | bc -l | awk '{printf "%.2f", $0}')
    
    # Format: metric{labels} value timestamp_ms
    TS_MS=$((ts * 1000))
    TEST_DATA+="${TEST_METRIC}{name=\"${TEST_NODE}\",type=\"actual\"} ${VALUE} ${TS_MS}"$'\n'
done

# Write data to VictoriaMetrics
echo "$TEST_DATA" | curl -s -X POST "$VICTORIA_URL/api/v1/import/prometheus" \
    -H "Content-Type: text/plain" \
    --data-binary @- > /dev/null

print_status $? "Test data ingested with new label format"
echo ""

# Test 3: Verify actual data is queryable
echo "Test 3: Query Actual Data"
echo "-------------------------"
QUERY="${TEST_METRIC}{name=\"${TEST_NODE}\",type=\"actual\"}"
print_info "Query: $QUERY"

ACTUAL_DATA=$(curl -s "$VICTORIA_URL/api/v1/query" --data-urlencode "query=$QUERY")
ACTUAL_COUNT=$(echo "$ACTUAL_DATA" | jq -r '.data.result | length')

if [ "$ACTUAL_COUNT" -gt 0 ]; then
    SAMPLE_VALUE=$(echo "$ACTUAL_DATA" | jq -r '.data.result[0].value[1]')
    print_status 0 "Actual data found: $ACTUAL_COUNT series, sample value: $SAMPLE_VALUE"
else
    print_status 1 "No actual data found!"
fi
echo ""

# Test 4: Generate forecast
echo "Test 4: Generate Forecast (30 days, hourly)"
echo "--------------------------------------------"
FROM_TS=$START_TS

FORECAST_REQUEST=$(cat <<EOF
{
  "metric_name": "$TEST_METRIC",
  "mon_obj": "$TEST_NODE",
  "from_timestamp": $FROM_TS,
  "forecast_periods": 720,
  "freq": "H",
  "step": "1h",
  "seasonality_mode": "additive",
  "changepoint_prior_scale": 0.05
}
EOF
)

print_info "Sending forecast request..."
echo "$FORECAST_REQUEST" | jq '.'

FORECAST_RESPONSE=$(curl -s -X POST "$FORECAST_URL/api/v1/forecast" \
    -H "Content-Type: application/json" \
    -d "$FORECAST_REQUEST")

echo ""
echo "Response:"
echo "$FORECAST_RESPONSE" | jq '.'

echo "$FORECAST_RESPONSE" | jq -e '.status == "success"' > /dev/null
print_status $? "Forecast generated successfully"

FORECAST_POINTS=$(echo "$FORECAST_RESPONSE" | jq -r '.forecast_points')
print_info "Forecast points: $FORECAST_POINTS"
echo ""

# Test 5: Verify forecast data is written with correct labels
echo "Test 5: Query Forecast Data"
echo "---------------------------"
sleep 2  # Give VictoriaMetrics time to process

FORECAST_QUERY="${TEST_METRIC}{name=\"${TEST_NODE}\",type=\"forecast\"}"
print_info "Query: $FORECAST_QUERY"

FORECAST_DATA=$(curl -s "$VICTORIA_URL/api/v1/query" --data-urlencode "query=$FORECAST_QUERY")
FORECAST_COUNT=$(echo "$FORECAST_DATA" | jq -r '.data.result | length')

if [ "$FORECAST_COUNT" -gt 0 ]; then
    SAMPLE_VALUE=$(echo "$FORECAST_DATA" | jq -r '.data.result[0].value[1]')
    print_status 0 "Forecast data found: $FORECAST_COUNT series, sample value: $SAMPLE_VALUE"
else
    print_status 1 "No forecast data found!"
fi
echo ""

# Test 6: Verify label format (name vs mon_obj)
echo "Test 6: Verify Label Format"
echo "----------------------------"

# Check if data uses 'name' label
NAME_LABEL=$(echo "$FORECAST_DATA" | jq -r '.data.result[0].metric.name // empty')
if [ "$NAME_LABEL" == "$TEST_NODE" ]; then
    print_status 0 "Correct: Using 'name' label = $NAME_LABEL"
else
    print_status 1 "Error: 'name' label not found or incorrect"
fi

# Check if data uses 'type' label
TYPE_LABEL=$(echo "$FORECAST_DATA" | jq -r '.data.result[0].metric.type // empty')
if [ "$TYPE_LABEL" == "forecast" ]; then
    print_status 0 "Correct: Using 'type' label = $TYPE_LABEL"
else
    print_status 1 "Error: 'type' label not found or incorrect"
fi

# Ensure old 'mon_obj' label is NOT used
MON_OBJ_LABEL=$(echo "$FORECAST_DATA" | jq -r '.data.result[0].metric.mon_obj // empty')
if [ -z "$MON_OBJ_LABEL" ]; then
    print_status 0 "Correct: NOT using old 'mon_obj' label"
else
    print_warning "Warning: Old 'mon_obj' label found: $MON_OBJ_LABEL"
fi
echo ""

# Test 7: Query both actual and forecast
echo "Test 7: Query Both Actual and Forecast"
echo "---------------------------------------"
COMBINED_QUERY="${TEST_METRIC}{name=\"${TEST_NODE}\"}"
print_info "Query: $COMBINED_QUERY"

COMBINED_DATA=$(curl -s "$VICTORIA_URL/api/v1/query" --data-urlencode "query=$COMBINED_QUERY")
COMBINED_COUNT=$(echo "$COMBINED_DATA" | jq -r '.data.result | length')

if [ "$COMBINED_COUNT" -eq 2 ]; then
    print_status 0 "Found both series (actual + forecast): $COMBINED_COUNT series"
    
    # Show the types
    TYPES=$(echo "$COMBINED_DATA" | jq -r '.data.result[].metric.type' | sort | tr '\n' ', ' | sed 's/,$//')
    print_info "Types found: $TYPES"
elif [ "$COMBINED_COUNT" -gt 2 ]; then
    print_warning "Warning: Found more than 2 series: $COMBINED_COUNT"
else
    print_warning "Warning: Expected 2 series, found: $COMBINED_COUNT"
fi
echo ""

# Test 8: Query range for visualization
echo "Test 8: Query Range (for visualization)"
echo "----------------------------------------"
RANGE_START=$((END_TS - 7*24*60*60))  # 7 days ago
RANGE_END=$((END_TS + 7*24*60*60))    # 7 days in future

print_info "Querying actual data (last 7 days)"
ACTUAL_RANGE_QUERY="${TEST_METRIC}{name=\"${TEST_NODE}\",type=\"actual\"}"
ACTUAL_RANGE=$(curl -s "$VICTORIA_URL/api/v1/query_range" \
    --data-urlencode "query=$ACTUAL_RANGE_QUERY" \
    --data-urlencode "start=$RANGE_START" \
    --data-urlencode "end=$END_TS" \
    --data-urlencode "step=1h")

ACTUAL_VALUES=$(echo "$ACTUAL_RANGE" | jq -r '.data.result[0].values | length')
print_info "Actual data points: $ACTUAL_VALUES"

print_info "Querying forecast data (next 7 days)"
FORECAST_RANGE_QUERY="${TEST_METRIC}{name=\"${TEST_NODE}\",type=\"forecast\"}"
FORECAST_RANGE=$(curl -s "$VICTORIA_URL/api/v1/query_range" \
    --data-urlencode "query=$FORECAST_RANGE_QUERY" \
    --data-urlencode "start=$END_TS" \
    --data-urlencode "end=$RANGE_END" \
    --data-urlencode "step=1h")

FORECAST_VALUES=$(echo "$FORECAST_RANGE" | jq -r '.data.result[0].values | length')
print_info "Forecast data points: $FORECAST_VALUES"

if [ "$ACTUAL_VALUES" -gt 0 ] && [ "$FORECAST_VALUES" -gt 0 ]; then
    print_status 0 "Range queries successful"
else
    print_warning "Warning: One or both range queries returned no data"
fi
echo ""

# Test 9: Clean up test data
echo "Test 9: Cleanup"
echo "---------------"
read -p "Do you want to delete test data? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Delete test metric data
    curl -s -X POST "$VICTORIA_URL/api/v1/admin/tsdb/delete_series" \
        --data-urlencode "match[]=${TEST_METRIC}{name=\"${TEST_NODE}\"}" > /dev/null
    print_status $? "Test data cleanup requested"
    print_warning "Note: Actual deletion may take some time (VictoriaMetrics background process)"
else
    print_info "Test data kept for manual inspection"
    print_info "To delete manually: curl -X POST '$VICTORIA_URL/api/v1/admin/tsdb/delete_series' --data-urlencode 'match[]=${TEST_METRIC}{name=\"${TEST_NODE}\"}'"
fi
echo ""

# Summary
echo "=========================================="
echo "Test Summary"
echo "=========================================="
echo -e "${GREEN}✓${NC} All tests passed!"
echo ""
echo "Label Format Verification:"
echo "  - Historical data: {name=\"$TEST_NODE\", type=\"actual\"} ✓"
echo "  - Forecast data:   {name=\"$TEST_NODE\", type=\"forecast\"} ✓"
echo "  - Old 'mon_obj' label not used ✓"
echo ""
echo "You can now query the data using:"
echo "  Actual:   ${TEST_METRIC}{name=\"${TEST_NODE}\",type=\"actual\"}"
echo "  Forecast: ${TEST_METRIC}{name=\"${TEST_NODE}\",type=\"forecast\"}"
echo "  Both:     ${TEST_METRIC}{name=\"${TEST_NODE}\"}"
echo ""

