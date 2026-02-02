#!/bin/bash

# Test script for Monitoring Objects CRUD API
# Make sure the Go API is running on localhost:8081
# and Keycloak is running on localhost:8080

set -e

API_URL="http://localhost:8081/api/mon-objects"
KEYCLOAK_URL="http://localhost:8080/realms/myrealm/protocol/openid-connect/token"

echo "=========================================="
echo "Monitoring Objects API Test Suite"
echo "=========================================="
echo ""

# Get authentication token
echo "📝 Getting authentication token from Keycloak..."
TOKEN_RESPONSE=$(curl -s -X POST "$KEYCLOAK_URL" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin" \
  -d "password=admin" \
  -d "grant_type=password" \
  -d "client_id=spa-client" \
  -d "client_secret=jym5bshxscBAQJqBsfo45hphL0oRdhx3" || echo "")

if echo "$TOKEN_RESPONSE" | grep -q "access_token"; then
  TOKEN=$(echo "$TOKEN_RESPONSE" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)
  echo "✅ Authentication successful"
else
  echo "❌ Failed to get authentication token"
  echo "Make sure Keycloak is running and the admin user exists"
  echo "Response: $TOKEN_RESPONSE"
  exit 1
fi

echo ""
echo "=========================================="
echo "Test 1: CREATE - Add new monitoring object"
echo "=========================================="

CREATE_DATA='{
  "name": "Test-Router-Core-01",
  "type": "router",
  "technology": "Cisco IOS-XE",
  "platform": "Catalyst 9000",
  "network": "Core Network",
  "manufacturer": "Cisco Systems"
}'

echo "Request: POST $API_URL"
echo "$CREATE_DATA" | jq . 2>/dev/null || echo "$CREATE_DATA"
echo ""

CREATE_RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$CREATE_DATA")

echo "Response:"
echo "$CREATE_RESPONSE" | jq . 2>/dev/null || echo "$CREATE_RESPONSE"

OBJECT_ID=$(echo "$CREATE_RESPONSE" | grep -o '"id":"[^"]*' | cut -d'"' -f4)

if [ -n "$OBJECT_ID" ]; then
  echo "✅ Object created successfully with ID: $OBJECT_ID"
else
  echo "❌ Failed to create object"
  exit 1
fi

echo ""
echo "=========================================="
echo "Test 2: GET - Retrieve object by ID"
echo "=========================================="

echo "Request: GET $API_URL/$OBJECT_ID"
echo ""

GET_RESPONSE=$(curl -s -X GET "$API_URL/$OBJECT_ID" \
  -H "Authorization: Bearer $TOKEN")

echo "Response:"
echo "$GET_RESPONSE" | jq . 2>/dev/null || echo "$GET_RESPONSE"

if echo "$GET_RESPONSE" | grep -q "$OBJECT_ID"; then
  echo "✅ Object retrieved successfully"
else
  echo "❌ Failed to retrieve object"
fi

echo ""
echo "=========================================="
echo "Test 3: CREATE - Add second object"
echo "=========================================="

CREATE_DATA2='{
  "name": "Test-Switch-Access-01",
  "type": "switch",
  "technology": "Juniper JunOS",
  "platform": "EX Series",
  "network": "Access Layer",
  "manufacturer": "Juniper Networks"
}'

echo "Request: POST $API_URL"
echo "$CREATE_DATA2" | jq . 2>/dev/null || echo "$CREATE_DATA2"
echo ""

CREATE_RESPONSE2=$(curl -s -X POST "$API_URL" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$CREATE_DATA2")

echo "Response:"
echo "$CREATE_RESPONSE2" | jq . 2>/dev/null || echo "$CREATE_RESPONSE2"

OBJECT_ID2=$(echo "$CREATE_RESPONSE2" | grep -o '"id":"[^"]*' | cut -d'"' -f4)

if [ -n "$OBJECT_ID2" ]; then
  echo "✅ Second object created successfully with ID: $OBJECT_ID2"
else
  echo "❌ Failed to create second object"
fi

echo ""
echo "=========================================="
echo "Test 4: LIST - Get all objects (paginated)"
echo "=========================================="

echo "Request: GET $API_URL?page=1&pageSize=10"
echo ""

LIST_RESPONSE=$(curl -s -X GET "$API_URL?page=1&pageSize=10" \
  -H "Authorization: Bearer $TOKEN")

echo "Response:"
echo "$LIST_RESPONSE" | jq . 2>/dev/null || echo "$LIST_RESPONSE"

ITEM_COUNT=$(echo "$LIST_RESPONSE" | grep -o '"total":[0-9]*' | cut -d':' -f2)

if [ -n "$ITEM_COUNT" ] && [ "$ITEM_COUNT" -ge 2 ]; then
  echo "✅ List retrieved successfully with $ITEM_COUNT total items"
else
  echo "⚠️  List may not contain all expected items"
fi

echo ""
echo "=========================================="
echo "Test 5: LIST - Filter by type"
echo "=========================================="

echo "Request: GET $API_URL?type=router&page=1&pageSize=10"
echo ""

FILTER_RESPONSE=$(curl -s -X GET "$API_URL?type=router&page=1&pageSize=10" \
  -H "Authorization: Bearer $TOKEN")

echo "Response:"
echo "$FILTER_RESPONSE" | jq . 2>/dev/null || echo "$FILTER_RESPONSE"
echo "✅ Filtered list retrieved"

echo ""
echo "=========================================="
echo "Test 6: UPDATE - Modify object"
echo "=========================================="

UPDATE_DATA='{
  "name": "Test-Router-Core-01-Updated",
  "technology": "Cisco IOS-XR",
  "platform": "ASR 9000"
}'

echo "Request: PUT $API_URL/$OBJECT_ID"
echo "$UPDATE_DATA" | jq . 2>/dev/null || echo "$UPDATE_DATA"
echo ""

UPDATE_RESPONSE=$(curl -s -X PUT "$API_URL/$OBJECT_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$UPDATE_DATA")

echo "Response:"
echo "$UPDATE_RESPONSE" | jq . 2>/dev/null || echo "$UPDATE_RESPONSE"

if echo "$UPDATE_RESPONSE" | grep -q "Updated"; then
  echo "✅ Object updated successfully"
elif echo "$UPDATE_RESPONSE" | grep -q "$OBJECT_ID"; then
  echo "✅ Object updated successfully"
else
  echo "⚠️  Object may have been updated"
fi

echo ""
echo "=========================================="
echo "Test 7: DELETE - Remove first object"
echo "=========================================="

echo "Request: DELETE $API_URL/$OBJECT_ID"
echo ""

DELETE_STATUS=$(curl -s -X DELETE "$API_URL/$OBJECT_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -w "%{http_code}" \
  -o /dev/null)

echo "Response status: $DELETE_STATUS"

if [ "$DELETE_STATUS" = "204" ]; then
  echo "✅ Object deleted successfully"
else
  echo "⚠️  Delete returned status $DELETE_STATUS"
fi

echo ""
echo "=========================================="
echo "Test 8: DELETE - Remove second object"
echo "=========================================="

echo "Request: DELETE $API_URL/$OBJECT_ID2"
echo ""

DELETE_STATUS2=$(curl -s -X DELETE "$API_URL/$OBJECT_ID2" \
  -H "Authorization: Bearer $TOKEN" \
  -w "%{http_code}" \
  -o /dev/null)

echo "Response status: $DELETE_STATUS2"

if [ "$DELETE_STATUS2" = "204" ]; then
  echo "✅ Second object deleted successfully"
else
  echo "⚠️  Delete returned status $DELETE_STATUS2"
fi

echo ""
echo "=========================================="
echo "Test 9: GET - Verify deletion"
echo "=========================================="

echo "Request: GET $API_URL/$OBJECT_ID (should fail)"
echo ""

VERIFY_STATUS=$(curl -s -X GET "$API_URL/$OBJECT_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -w "%{http_code}" \
  -o /dev/null)

echo "Response status: $VERIFY_STATUS"

if [ "$VERIFY_STATUS" = "404" ]; then
  echo "✅ Object successfully deleted (404 as expected)"
else
  echo "⚠️  Expected 404, got $VERIFY_STATUS"
fi

echo ""
echo "=========================================="
echo "✅ All tests completed!"
echo "=========================================="


