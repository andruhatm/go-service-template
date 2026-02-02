# Troubleshooting: Inventory Page Shows 0 Elements

## Problem
Data exists in database but UI shows empty table (0 elements).

## Root Cause
The `/api/mon-objects` endpoint requires **Keycloak authentication**, but the frontend doesn't have a valid access token.

## Quick Diagnosis

### 1. Check Browser Console
Open browser DevTools (F12) and look for errors:
```
Failed to load monitoring objects: 401
Authorization header required
```

### 2. Check localStorage
In browser console, run:
```javascript
localStorage.getItem('access_token')
```

If it returns `null`, you're not authenticated.

## Solutions

### Option A: Login Through Keycloak (Production Way)

1. Make sure you have a Keycloak user set up
2. Navigate to your login page
3. Login with credentials
4. After successful login, the token should be stored in localStorage
5. Navigate to the inventory/feed page

### Option B: Temporary Public Access (Development Only)

If you want to test without authentication, modify the router to allow unauthenticated access for read-only operations.

**File:** `go-api/router/router.go`

Add **before** the protected routes section:

```go
// Public read-only monitoring objects endpoints (for development)
sm.HandleFunc("/api/mon-objects", func(w http.ResponseWriter, r *http.Request) {
    monObjectHandler.ListMonObjects(w, r)
}).Methods("GET")

sm.HandleFunc("/api/mon-objects/{id}", func(w http.ResponseWriter, r *http.Request) {
    monObjectHandler.GetMonObject(w, r)
}).Methods("GET")
```

Then restart the backend.

### Option C: Manual Token Setup (Quick Test)

1. Get a token from Keycloak:
```bash
curl -X POST "http://localhost:8080/realms/myrealm/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=YOUR_USERNAME" \
  -d "password=YOUR_PASSWORD" \
  -d "grant_type=password" \
  -d "client_id=spa-client" \
  -d "client_secret=jym5bshxscBAQJqBsfo45hphL0oRdhx3"
```

2. Copy the `access_token` from response

3. In browser console, set it:
```javascript
localStorage.setItem('access_token', 'YOUR_TOKEN_HERE');
```

4. Refresh the page

### Option D: Check Keycloak User Setup

Make sure you have users in Keycloak:
```bash
# Access Keycloak admin console
http://localhost:8080

# Login: admin / admin
# Go to: Users -> Add User
# Create user with roles: ROLE_ADMIN or ROLE_MONITOR
```

## Verification Steps

### 1. Check Database Has Data
```bash
docker exec go-service-template-db-1 psql -U user -d appdb -c "SELECT COUNT(*) FROM mon_objects;"
```
Should return: `39`

### 2. Check API Works (with token)
```bash
TOKEN="your_token_here"
curl -H "Authorization: Bearer $TOKEN" http://localhost:8081/api/mon-objects
```

### 3. Check Frontend Service
In browser console:
```javascript
// Check if service is loaded
console.log(window['ng'].probe(document.body));
```

## Common Issues

### Issue 1: Token Expired
**Symptom:** Was working, now shows 0 elements
**Solution:** Get a new token or re-login

### Issue 2: CORS Error
**Symptom:** Console shows CORS error
**Solution:** Already configured, but verify backend CORS settings

### Issue 3: Wrong API URL
**Symptom:** Network tab shows 404
**Solution:** Check `environment.ts`:
```typescript
backendUrl: 'http://localhost:8081'
```

### Issue 4: Backend Not Running
**Symptom:** Connection refused
**Solution:** 
```bash
cd go-api
go run main.go
```

## Best Solution for Development

I recommend **Option B** (temporary public access) for development, then switch to proper authentication for production.


