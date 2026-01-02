# Fix: Events Not Showing in Admin Panel

If you see events in Keycloak but the admin panel shows 0, the issue is likely permissions.

## Step 1: Check Backend Logs

After restarting the backend and loading the admin panel, check the logs for:

```
Fetched X events from Keycloak
Event types found: map[...]
Authentication events - Total logins: X, Errors: Y
```

If you see:
- `Failed to get events, status: 403` → Permission issue (see Step 2)
- `Fetched 0 events` → Events not enabled in Keycloak (see Step 3)
- `Event types found: map[...]` → Check what event types are returned

## Step 2: Add `view-events` Permission

Your `admin-service` client needs permission to view events:

1. Go to: `http://localhost:8080/admin/master/console/#/myrealm/clients`
2. Click on `admin-service`
3. Go to **Service account roles** tab
4. Click **Assign role**
5. **Filter by clients** → Select `realm-management`
6. Find and assign these roles:
   - ✅ `view-events` (CRITICAL for events)
   - ✅ `view-users`
   - ✅ `view-realm`
   - ✅ `view-clients`
   - ✅ `query-users`
   - ✅ `query-groups`
7. Click **Assign**

## Step 3: Enable Event Storage in Keycloak

1. Go to: `http://localhost:8080/admin/master/console/#/myrealm`
2. Click **Realm settings** (left sidebar)
3. Click **Events** tab
4. **Login Events Settings**:
   - **Save events**: ✅ ON
   - **Expiration**: `1296000` (15 days)
   - **Clear login events** (if you want to test fresh)
5. Click **Save**

## Step 4: Generate Test Events

1. **Successful Login**:
   - Logout and login normally
   
2. **Failed Login** (to generate errors):
   - Try logging in with wrong password
   - Or with a non-existent username

3. **Verify in Keycloak**:
   - Go to **Realm settings** → **Events** → **Login events** tab
   - You should see your events listed

## Step 5: Test Admin Panel

1. Restart backend:
```bash
cd go-api
go run main.go
```

2. Refresh admin panel: `http://localhost:4200/admin-panel`

3. Check backend logs - you should see:
```
Fetched 10 events from Keycloak
Event types found: map[LOGIN:5 LOGIN_ERROR:2 CODE_TO_TOKEN:3]
Authentication events - Total logins: 8, Errors: 2
```

## Common Event Types in Keycloak:

The backend now recognizes these event types:
- `LOGIN` - Successful user login
- `LOGIN_ERROR` - Failed login attempt
- `REFRESH_TOKEN` - Token refresh (counted as login activity)
- `CODE_TO_TOKEN` - Authorization code exchange (counted as login activity)

## Debug: Check What Events Keycloak Returns

Run this curl command to see raw events:

```bash
# Get admin-service token
TOKEN=$(curl -X POST http://localhost:8080/realms/myrealm/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials" \
  -d "client_id=admin-service" \
  -d "client_secret=YOUR_SECRET" | jq -r .access_token)

# Get events
curl -X GET "http://localhost:8080/admin/realms/myrealm/events?max=10" \
  -H "Authorization: Bearer $TOKEN" | jq .
```

This will show you exactly what events Keycloak is returning and their format.

