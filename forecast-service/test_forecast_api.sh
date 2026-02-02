#!/bin/bash

# Test script for Forecast Service API
# Usage: ./test_forecast_api.sh [base_url]

BASE_URL=${1:-"http://localhost:8082"}

echo "Testing Forecast Service at $BASE_URL"
echo "======================================="
echo ""

# Test 1: Health Check
echo "1. Testing Health Check endpoint..."
curl -X GET "$BASE_URL/health" \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\n" \
  -s | jq '.'
echo ""
echo "---"
echo ""

# Test 2: Root endpoint
echo "2. Testing Root endpoint..."
curl -X GET "$BASE_URL/" \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\n" \
  -s | jq '.'
echo ""
echo "---"
echo ""

# Test 3: Forecast request
echo "3. Testing Forecast endpoint..."
echo "NOTE: This requires existing data in VictoriaMetrics"
echo "Adjust metric_name, mon_obj, and from_timestamp according to your data"
echo ""

# Calculate timestamp for 7 days ago
FROM_TIMESTAMP=$(($(date +%s) - 604800))

curl -X POST "$BASE_URL/api/v1/forecast" \
  -H "Content-Type: application/json" \
  -d "{
    \"metric_name\": \"cpu_usage\",
    \"mon_obj\": \"server-01\",
    \"from_timestamp\": $FROM_TIMESTAMP,
    \"forecast_periods\": 24,
    \"freq\": \"H\",
    \"step\": \"1h\",
    \"seasonality_mode\": \"additive\",
    \"changepoint_prior_scale\": 0.05
  }" \
  -w "\nStatus: %{http_code}\n" \
  -s | jq '.'
echo ""
echo "---"
echo ""

echo "Testing complete!"


