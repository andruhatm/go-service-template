# Keycloak Admin Panel Setup

## Problem
The admin panel is showing zeros for statistics because the Keycloak client doesn't have permission to access the Admin API.

## Solution: Configure Service Account Roles

Your `spa-client` needs to be configured as a **confidential client** with **service account roles** to access the Keycloak Admin API.

### Step 1: Configure the Client

1. Go to Keycloak Admin Console: `http://localhost:8080/admin/master/console/#/myrealm/clients`

2. Find your client `spa-client` and click on it

3. In the **Settings** tab:
   - **Client authentication**: Enable (ON)
   - **Authorization**: Enable (ON)  
   - **Service accounts roles**: Enable (ON)
   - **Standard flow**: Keep enabled for user login
   - **Direct access grants**: Keep enabled
   - Save the changes

### Step 2: Assign Service Account Roles

1. Go to the **Service account roles** tab of your `spa-client`

2. Click **Assign role**

3. Filter by **realm roles** or search for these roles:
   - `view-users`
   - `view-realm`
   - `view-clients`
   - `view-events`

4. If those roles don't exist, you need to assign **realm-management** client roles:
   - Click **Filter by clients**
   - Select `realm-management` from the dropdown
   - Assign these roles:
     - `view-users`
     - `view-realm`
     - `view-clients`
     - `view-events`
     - `query-users`
     - `query-groups`
     - `query-realms`

### Step 3: Verify Client Secret

Make sure the client secret in your configuration matches:

1. In Keycloak, go to `spa-client` → **Credentials** tab
2. Copy the **Client secret**
3. Update `go-api/configuration.yaml`:
```yaml
keycloakCfg:
  issuer: http://keycloak:8080/realms/myrealm
  client_id: spa-client
  client_secret: YOUR_CLIENT_SECRET_HERE
```

### Step 4: Restart Backend

After configuring Keycloak:
```bash
cd go-api
go run main.go
```

## Alternative: Use User Token Instead

If you don't want to configure service account roles, the backend will automatically fall back to using the authenticated user's token. Make sure your admin user has the `realm:ROLE_ADMIN` role in Keycloak.

The backend will:
1. Try to get a service account token (client credentials)
2. If that fails, use the user's token from the request
3. If both fail, return mock data (zeros)

## Verify It's Working

When the admin panel loads, check the backend logs:
```
Fetching Keycloak stats from: http://keycloak:8080 for realm: myrealm
Successfully fetched users count: X
Sessions - Total: Y, Active: Z
```

If you see errors, they will be logged with details about what failed.

## Current Keycloak Roles

Based on your token, you have these roles:
- `realm:ROLE_ADMIN` ✓
- `realm:ROLE_MONITOR` ✓
- `realm:default-roles-myrealm`
- `realm:offline_access`
- `realm:uma_authorization`
- `account:manage-account`
- `account:manage-account-links`
- `account:view-profile`

The user authentication works fine. The issue is only with the service account querying the Admin API.


