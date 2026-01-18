#!/bin/bash

# Test Notifications API
# Usage: ./test_notifications_api.sh [BASE_URL] [TOKEN]

set -e

# Configuration
BASE_URL="${1:-http://localhost:8080}"
TOKEN="${2:-}"
API_URL="${BASE_URL}/api"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if token is provided
if [ -z "$TOKEN" ]; then
    echo -e "${RED}Error: JWT token is required${NC}"
    echo "Usage: $0 [BASE_URL] [TOKEN]"
    echo "Example: $0 http://localhost:8080 eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
    exit 1
fi

echo -e "${BLUE}=== Testing Notifications API ===${NC}"
echo -e "Base URL: ${BASE_URL}"
echo -e "Token: ${TOKEN:0:20}...\n"

# Function to print test result
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ $2${NC}"
    else
        echo -e "${RED}✗ $2${NC}"
    fi
}

# Function to make API request
api_request() {
    local method=$1
    local endpoint=$2
    local data=$3
    
    if [ -z "$data" ]; then
        curl -s -X "$method" "${API_URL}${endpoint}" \
            -H "Authorization: Bearer ${TOKEN}" \
            -H "Content-Type: application/json"
    else
        curl -s -X "$method" "${API_URL}${endpoint}" \
            -H "Authorization: Bearer ${TOKEN}" \
            -H "Content-Type: application/json" \
            -d "$data"
    fi
}

# Test 1: Create a forecast (should automatically create notification)
echo -e "${YELLOW}Test 1: Creating a forecast (will create notification)${NC}"
FORECAST_DATA='{
  "mon_object_name": "eNB_TEST_12345",
  "metric_name": "RRCConnEstabSucc",
  "from_timestamp": 1705500000,
  "forecast_periods": 24
}'

FORECAST_RESPONSE=$(api_request "POST" "/forecasts" "$FORECAST_DATA")
FORECAST_ID=$(echo "$FORECAST_RESPONSE" | jq -r '.id' 2>/dev/null || echo "")

if [ -n "$FORECAST_ID" ] && [ "$FORECAST_ID" != "null" ]; then
    print_result 0 "Forecast created with ID: $FORECAST_ID"
    echo "$FORECAST_RESPONSE" | jq '.' 2>/dev/null || echo "$FORECAST_RESPONSE"
else
    print_result 1 "Failed to create forecast"
    echo "$FORECAST_RESPONSE"
fi

echo ""
sleep 2

# Test 2: Get unread notifications
echo -e "${YELLOW}Test 2: Getting unread notifications${NC}"
UNREAD_RESPONSE=$(api_request "GET" "/notifications/unread")
UNREAD_COUNT=$(echo "$UNREAD_RESPONSE" | jq -r '.unread_count' 2>/dev/null || echo "0")

if [ "$UNREAD_COUNT" -gt 0 ]; then
    print_result 0 "Found $UNREAD_COUNT unread notification(s)"
    echo "$UNREAD_RESPONSE" | jq '.' 2>/dev/null || echo "$UNREAD_RESPONSE"
    
    # Extract first notification ID
    NOTIFICATION_ID=$(echo "$UNREAD_RESPONSE" | jq -r '.notifications[0].id' 2>/dev/null || echo "")
else
    print_result 1 "No unread notifications found (expected at least 1)"
    echo "$UNREAD_RESPONSE"
fi

echo ""
sleep 1

# Test 3: Get all notifications with pagination
echo -e "${YELLOW}Test 3: Getting all notifications (limit=10, offset=0)${NC}"
ALL_NOTIFICATIONS=$(api_request "GET" "/notifications?limit=10&offset=0")
TOTAL=$(echo "$ALL_NOTIFICATIONS" | jq -r '.total' 2>/dev/null || echo "0")

if [ "$TOTAL" -gt 0 ]; then
    print_result 0 "Found $TOTAL total notification(s)"
    echo "$ALL_NOTIFICATIONS" | jq '.' 2>/dev/null || echo "$ALL_NOTIFICATIONS"
else
    print_result 1 "No notifications found"
    echo "$ALL_NOTIFICATIONS"
fi

echo ""
sleep 1

# Test 4: Get specific notification
if [ -n "$NOTIFICATION_ID" ] && [ "$NOTIFICATION_ID" != "null" ]; then
    echo -e "${YELLOW}Test 4: Getting specific notification by ID${NC}"
    NOTIFICATION_DETAIL=$(api_request "GET" "/notifications/${NOTIFICATION_ID}")
    NOTIFICATION_TYPE=$(echo "$NOTIFICATION_DETAIL" | jq -r '.type' 2>/dev/null || echo "")
    
    if [ -n "$NOTIFICATION_TYPE" ] && [ "$NOTIFICATION_TYPE" != "null" ]; then
        print_result 0 "Retrieved notification of type: $NOTIFICATION_TYPE"
        echo "$NOTIFICATION_DETAIL" | jq '.' 2>/dev/null || echo "$NOTIFICATION_DETAIL"
    else
        print_result 1 "Failed to retrieve notification"
        echo "$NOTIFICATION_DETAIL"
    fi
    
    echo ""
    sleep 1
    
    # Test 5: Mark notification as read
    echo -e "${YELLOW}Test 5: Marking notification as read${NC}"
    MARK_READ_RESPONSE=$(api_request "PUT" "/notifications/${NOTIFICATION_ID}/read")
    MARK_READ_STATUS=$?
    
    if [ $MARK_READ_STATUS -eq 0 ]; then
        print_result 0 "Notification marked as read"
    else
        print_result 1 "Failed to mark notification as read"
    fi
    
    echo ""
    sleep 1
    
    # Test 6: Verify notification is marked as read
    echo -e "${YELLOW}Test 6: Verifying notification status${NC}"
    NOTIFICATION_CHECK=$(api_request "GET" "/notifications/${NOTIFICATION_ID}")
    NOTIFICATION_STATUS=$(echo "$NOTIFICATION_CHECK" | jq -r '.status' 2>/dev/null || echo "")
    
    if [ "$NOTIFICATION_STATUS" = "read" ]; then
        print_result 0 "Notification status is 'read'"
    else
        print_result 1 "Notification status is '$NOTIFICATION_STATUS' (expected 'read')"
    fi
    
    echo ""
    sleep 1
fi

# Test 7: Check unread count again (should be less)
echo -e "${YELLOW}Test 7: Checking unread count after marking as read${NC}"
UNREAD_AFTER=$(api_request "GET" "/notifications/unread")
UNREAD_COUNT_AFTER=$(echo "$UNREAD_AFTER" | jq -r '.unread_count' 2>/dev/null || echo "0")

if [ "$UNREAD_COUNT_AFTER" -lt "$UNREAD_COUNT" ]; then
    print_result 0 "Unread count decreased from $UNREAD_COUNT to $UNREAD_COUNT_AFTER"
else
    print_result 1 "Unread count is $UNREAD_COUNT_AFTER (expected less than $UNREAD_COUNT)"
fi

echo ""
sleep 1

# Test 8: Mark all notifications as read
echo -e "${YELLOW}Test 8: Marking all notifications as read${NC}"
MARK_ALL_READ=$(api_request "PUT" "/notifications/mark-all-read")
MARK_ALL_STATUS=$?

if [ $MARK_ALL_STATUS -eq 0 ]; then
    print_result 0 "All notifications marked as read"
else
    print_result 1 "Failed to mark all notifications as read"
fi

echo ""
sleep 1

# Test 9: Verify all are read
echo -e "${YELLOW}Test 9: Verifying all notifications are read${NC}"
UNREAD_FINAL=$(api_request "GET" "/notifications/unread")
UNREAD_COUNT_FINAL=$(echo "$UNREAD_FINAL" | jq -r '.unread_count' 2>/dev/null || echo "0")

if [ "$UNREAD_COUNT_FINAL" -eq 0 ]; then
    print_result 0 "All notifications are now read (count: 0)"
else
    print_result 1 "Still have $UNREAD_COUNT_FINAL unread notification(s)"
fi

echo ""
sleep 1

# Test 10: Delete notification (if we have one)
if [ -n "$NOTIFICATION_ID" ] && [ "$NOTIFICATION_ID" != "null" ]; then
    echo -e "${YELLOW}Test 10: Deleting notification${NC}"
    DELETE_RESPONSE=$(api_request "DELETE" "/notifications/${NOTIFICATION_ID}")
    DELETE_STATUS=$?
    
    if [ $DELETE_STATUS -eq 0 ]; then
        print_result 0 "Notification deleted"
    else
        print_result 1 "Failed to delete notification"
    fi
    
    echo ""
    sleep 1
    
    # Test 11: Verify deletion
    echo -e "${YELLOW}Test 11: Verifying notification is deleted${NC}"
    VERIFY_DELETE=$(api_request "GET" "/notifications/${NOTIFICATION_ID}")
    
    if echo "$VERIFY_DELETE" | grep -q "not found"; then
        print_result 0 "Notification successfully deleted"
    else
        print_result 1 "Notification still exists"
    fi
fi

echo ""
echo -e "${BLUE}=== Test Summary ===${NC}"
echo -e "All tests completed!"
echo -e "\n${YELLOW}Note:${NC} Some tests may fail if:"
echo "  - The forecast service is not running (status won't change to completed/failed)"
echo "  - Database migrations haven't been applied"
echo "  - Token is expired or invalid"
echo ""
echo -e "${GREEN}To monitor notifications in real-time:${NC}"
echo "  watch -n 5 'curl -s -H \"Authorization: Bearer $TOKEN\" ${API_URL}/notifications/unread | jq'"
echo ""
echo -e "${GREEN}To check forecast status:${NC}"
if [ -n "$FORECAST_ID" ] && [ "$FORECAST_ID" != "null" ]; then
    echo "  curl -s -H \"Authorization: Bearer $TOKEN\" ${API_URL}/forecasts/${FORECAST_ID} | jq '.status'"
fi

