# Fix Keycloak Configuration

## Problem
After enabling client authentication on `spa-client`, the Angular app can't log in because SPAs must use **public clients**, not confidential clients.

## Solution: Use Two Clients

### Client 1: spa-client (for Angular Frontend)
**Purpose:** User authentication in the browser

**Settings:**
1. Go to Keycloak: `http://localhost:8080/admin/master/console/#/myrealm/clients`
2. Click on `spa-client`
3. **Settings tab:**
   - **Client authentication**: **OFF** (Disable this!)
   - **Authorization**: OFF
   - **Standard flow**: ON
   - **Direct access grants**: ON
   - **Implicit flow**: OFF
   - **Service accounts roles**: OFF
   - **Valid redirect URIs**: 
     - `http://localhost:4200/*`
     - `http://localhost:8080/*`
   - **Web origins**: `+` (or `http://localhost:4200`)
4. Save

### Client 2: admin-service (NEW - for Backend Admin API)
**Purpose:** Backend service to query Keycloak Admin API

**Create new client:**
1. Click **Create client**
2. **General Settings:**
   - **Client ID**: `admin-service`
   - **Client type**: OpenID Connect
   - **Client authentication**: **ON**
3. Click **Next**

4. **Capability config:**
   - **Standard flow**: OFF
   - **Direct access grants**: OFF
   - **Service accounts roles**: **ON** (Enable this!)
   - **Authorization**: OFF
5. Click **Next**

6. **Login settings:**
   - Leave empty (not needed for service account)
7. Click **Save**

8. **Get the client secret:**
   - Go to **Credentials** tab
   - Copy the **Client secret**

9. **Assign service account roles:**
   - Go to **Service account roles** tab
   - Click **Assign role**
   - Filter by clients → Select `realm-management`
   - Assign these roles:
     - `view-users`
     - `view-realm`
     - `view-clients`
     - `query-users`
     - `query-groups`
   - Click **Assign**

## Update Backend Configuration

Edit `go-api/configuration.yaml`:

```yaml
keycloakCfg:
  issuer: http://keycloak:8080/realms/myrealm
  client_id: admin-service           # Changed from spa-client
  client_secret: <PASTE_SECRET_HERE>  # From admin-service credentials tab
```

Or if using environment variables, update them:
```bash
KEYCLOAK_ISSUER=http://keycloak:8080/realms/myrealm
KEYCLOAK_CLIENT_ID=admin-service
KEYCLOAK_CLIENT_SECRET=<PASTE_SECRET_HERE>
```

## Update Backend Code

The backend auth middleware should still verify tokens from `spa-client` (the user's token), but the admin handler will use `admin-service` credentials to query the Admin API.

We need to keep two configs - one for token verification, one for admin API.

## Verify Setup

1. **Frontend login**: Should work with `spa-client` (public)
2. **Backend token verification**: Verifies tokens from `spa-client`
3. **Backend admin queries**: Uses `admin-service` (confidential) credentials

This way:
- Users log in through Angular with `spa-client` (no secret needed)
- Backend verifies user tokens from `spa-client`
- Backend queries Admin API using `admin-service` credentials

