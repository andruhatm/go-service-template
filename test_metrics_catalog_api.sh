#!/bin/bash

# Test script for Metrics Catalog API endpoints

BASE_URL="http://localhost:8081"

echo "=== Testing Metrics Catalog API ==="
echo ""

echo "1. Test GET /api/metrics-catalog (List all metrics)"
curl -s "${BASE_URL}/api/metrics-catalog" | jq '.'
echo ""
echo ""

echo "2. Test GET /api/metrics-catalog with pagination (page=1, pageSize=5)"
curl -s "${BASE_URL}/api/metrics-catalog?page=1&pageSize=5" | jq '.'
echo ""
echo ""

echo "3. Test GET /api/metrics-catalog/groups (Get all groups)"
curl -s "${BASE_URL}/api/metrics-catalog/groups" | jq '.'
echo ""
echo ""

echo "4. Test GET /api/metrics-catalog with group filter"
# First get a group name from the groups endpoint
GROUP=$(curl -s "${BASE_URL}/api/metrics-catalog/groups" | jq -r '.groups[0]')
if [ "$GROUP" != "null" ] && [ -n "$GROUP" ]; then
    echo "Filtering by group: $GROUP"
    curl -s "${BASE_URL}/api/metrics-catalog?group=${GROUP}" | jq '.'
else
    echo "No groups available to test filtering"
fi
echo ""
echo ""

echo "5. Test GET /api/metrics-catalog/{id} (Get specific metric)"
# Get first metric ID
METRIC_ID=$(curl -s "${BASE_URL}/api/metrics-catalog?pageSize=1" | jq -r '.items[0].id')
if [ "$METRIC_ID" != "null" ] && [ -n "$METRIC_ID" ]; then
    echo "Fetching metric with ID: $METRIC_ID"
    curl -s "${BASE_URL}/api/metrics-catalog/${METRIC_ID}" | jq '.'
else
    echo "No metrics available to test single metric fetch"
fi

echo ""
echo "=== Tests Complete ==="

