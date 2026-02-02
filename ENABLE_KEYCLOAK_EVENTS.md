# Enable Keycloak Event Logging

To see login events and authentication errors in the admin panel, you need to enable event logging in Keycloak.

## Steps to Enable Events:

1. Go to Keycloak Admin Console: `http://localhost:8080/admin/master/console/#/myrealm`

2. Click on **Realm settings** (left sidebar)

3. Click on **Events** tab

4. **Event Listeners** section:
   - Make sure `jboss-logging` is in the **Event listeners** list
   - If not, add it

5. **Login Events Settings**:
   - **Save events**: Turn **ON** ✓
   - **Expiration**: Set to `1296000` (15 days) or desired value
   - **Saved types**: Select the events you want to track (or leave empty for all):
     - `LOGIN`
     - `LOGIN_ERROR`
     - `LOGOUT`
     - `CODE_TO_TOKEN`
     - `REFRESH_TOKEN`

6. **Admin Events Settings**:
   - **Save events**: Turn **ON** ✓ (optional, for admin action tracking)
   - **Include representation**: Turn ON for detailed logs

7. Click **Save**

## Verify Events are Being Saved:

1. After enabling, go to **Events** → **Login events** tab
2. Try logging in/out to generate events
3. Refresh the login events page - you should see your activities

## Why Active Sessions Show 0:

The session counting in Keycloak Admin API can be tricky:

1. **Client Session Stats** - Only counts sessions for clients that have active connections
2. **User Sessions** - The backend now iterates through users to count their active sessions

The new backend implementation:
- Queries each user's active sessions
- Provides more accurate active session counts
- May take slightly longer to load for realms with many users

If you still see 0 active sessions:
- Check that your session is not expired
- Verify the admin-service client has `view-users` and `view-clients` roles
- Check backend logs for any permission errors

## Test the Stats:

After enabling events and restarting the backend:
1. Login/logout a few times
2. Navigate to admin panel
3. You should see:
   - Login events count
   - Login errors count
   - Success rate percentage
   - Error rate percentage


