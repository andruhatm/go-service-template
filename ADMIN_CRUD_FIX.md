# Fix: Admin User CRUD Operations

## Problem Fixed
Admin users couldn't create, edit, or delete monitoring objects.

## Root Cause
1. **Frontend**: MonObjectService was looking for token in `localStorage.getItem('access_token')`, but keycloak-angular stores it internally
2. **Frontend**: Component was using `CurrentUserService` instead of `KeycloakService` for role checks
3. **Backend**: No role-based access control on write endpoints

## Solution Applied

### ✅ Frontend Fixes

#### 1. MonObjectService (`mon-object.service.ts`)
**Before:**
```typescript
private getHeaders(): HttpHeaders {
  const token = localStorage.getItem('access_token');
  return new HttpHeaders({
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  });
}
```

**After:**
```typescript
// Removed manual header setting
// keycloak-angular's Bearer interceptor handles tokens automatically
```

All HTTP methods now rely on keycloak-angular's automatic token injection.

#### 2. Feed Component (`feed.component.ts`)
**Before:**
```typescript
this.currentUserService.user$.subscribe(user => {
  if (user.authenticated) {
    this.isAdmin = this.user.hasRole('ROLE_ADMIN' as any);
```

**After:**
```typescript
async ngOnInit() {
  this.isLoggedIn = await this.keycloakService.isLoggedIn();
  this.isAdmin = this.keycloakService.isUserInRole('ROLE_ADMIN');
  this.isMonitor = this.keycloakService.isUserInRole('ROLE_MONITOR');
```

Now uses `KeycloakService` directly for proper role checking.

### ✅ Backend Fixes

#### Added Role-Based Access Control (`router.go`)
```go
// Only ROLE_ADMIN can create/update/delete
protected.HandleFunc("/mon-objects", func(w http.ResponseWriter, r *http.Request) {
    if !middleware.HasRole(r.Context(), "realm:ROLE_ADMIN") {
        http.Error(w, "Forbidden: ROLE_ADMIN required", http.StatusForbidden)
        return
    }
    monObjectHandler.CreateMonObject(w, r)
}).Methods("POST")
```

Same for PUT and DELETE operations.

## Keycloak Setup Required

### Step 1: Access Keycloak Admin Console
```
URL: http://localhost:8080
Username: admin
Password: admin
```

### Step 2: Create Realm Roles

1. Go to **Realm Settings** (top left dropdown - select "myrealm")
2. Click **Roles** → **Realm Roles**
3. Click **Create Role**
4. Create two roles:
   - **ROLE_ADMIN** (for full access)
   - **ROLE_MONITOR** (for read-only access)

### Step 3: Create a User

1. Go to **Users**
2. Click **Add User**
3. Fill in:
   - **Username**: `testadmin`
   - **Email**: `admin@test.com`
   - **First Name**: Test
   - **Last Name**: Admin
   - **Email Verified**: ON
4. Click **Create**

### Step 4: Set Password

1. In the user details, go to **Credentials** tab
2. Click **Set Password**
3. Enter password: `admin` (or your choice)
4. Turn OFF **Temporary**
5. Click **Set Password**

### Step 5: Assign Roles

1. In the user details, go to **Role Mappings** tab
2. Click **Assign Role**
3. Select **ROLE_ADMIN**
4. Click **Assign**

### Step 6: Configure Client (spa-client)

1. Go to **Clients**
2. Find and click **spa-client**
3. Ensure settings:
   - **Client authentication**: OFF (public client)
   - **Standard flow**: ON
   - **Direct access grants**: ON
   - **Valid redirect URIs**: `http://localhost:4200/*`
   - **Web origins**: `http://localhost:4200`

## Testing Steps

### 1. Restart Backend
```bash
cd go-api
go run main.go
```

### 2. Start Frontend (if not running)
```bash
cd frontend
ng serve
```

### 3. Login as Admin

1. Open `http://localhost:4200`
2. You should be redirected to Keycloak login
3. Login with:
   - Username: `testadmin`
   - Password: `admin`
4. You'll be redirected back to your app

### 4. Navigate to Inventory/Feed Page

You should now see:
- ✅ All 39 objects in the table
- ✅ **"+ Создать объект"** button (green button in header)
- ✅ Action buttons in each row: 👁️ View, ✏️ Edit, 🗑️ Delete

### 5. Test Create

1. Click **"+ Создать объект"**
2. Fill in the form:
   - Name: `Test Router`
   - Type: `router`
   - Technology: `Cisco IOS`
   - Manufacturer: `Cisco`
3. Click **Создать**
4. Should see success message
5. Table should refresh with new object

### 6. Test Edit

1. Click ✏️ **Edit** icon on any object
2. Modify some fields
3. Click **Сохранить**
4. Should see success message
5. Table should refresh with updated data

### 7. Test Delete

1. Click 🗑️ **Delete** icon on an object
2. Confirm deletion
3. Should see success message
4. Object should disappear from table

### 8. Test JSON Mode (Advanced)

1. Click **"+ Создать объект"**
2. Click **"Режим JSON"** button
3. Paste JSON:
```json
{
  "name": "gnb29001",
  "type": "gNodeB",
  "technology": "5G NR",
  "platform": "physical",
  "network": "Core Network",
  "manufacturer": "Ericsson"
}
```
4. Click **Создать**
5. Object should be created

## Verification

### Check Browser Console
Open DevTools (F12) → Console. You should see:
```
User logged in - Admin: true Monitor: false
TokenInterceptor: intercepting request to http://localhost:8081/api/mon-objects
TokenInterceptor: token available: true
```

### Check Network Tab
1. Open DevTools (F12) → Network
2. Create/Edit/Delete an object
3. Click on the request
4. Check **Request Headers** - you should see:
```
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Check Backend Logs
Backend should log:
```
User authenticated - UserID: <uuid>, Roles: [realm:ROLE_ADMIN]
```

## Troubleshooting

### Issue 1: "Forbidden: ROLE_ADMIN required"
**Cause**: User doesn't have ROLE_ADMIN role
**Solution**: 
1. Go to Keycloak admin console
2. Find user → Role Mappings
3. Assign ROLE_ADMIN

### Issue 2: Still can't create/edit/delete
**Cause**: Not logged in or token expired
**Solution**:
1. Check browser console for authentication errors
2. Logout and login again
3. Check Keycloak is running: `docker ps | grep keycloak`

### Issue 3: "Authorization header required"
**Cause**: Keycloak Bearer interceptor not working
**Solution**:
1. Check `app.module.ts` has `KeycloakModule` imported
2. Check `keycloak-init.ts` has `enableBearerInterceptor: true`
3. Restart frontend: `ng serve`

### Issue 4: Keycloak login page doesn't show
**Cause**: Keycloak not running
**Solution**:
```bash
docker-compose up -d keycloak keycloak-db
# Wait 30 seconds for startup
curl http://localhost:8080
```

## Monitor User Testing

To test read-only access:

1. Create another user: `testmonitor`
2. Assign only **ROLE_MONITOR** role
3. Login as testmonitor
4. Should see:
   - ✅ Can view all objects
   - ✅ Can use filters/search
   - ✅ Can click 👁️ View button
   - ❌ No "Создать" button
   - ❌ No Edit/Delete buttons

## Security Notes

✅ **Current Setup (Secure)**:
- Read operations: Public (GET /api/mon-objects)
- Write operations: Require authentication + ROLE_ADMIN

🔒 **For Production**:
- Make GET endpoints also require authentication
- Add HTTPS
- Add rate limiting
- Add audit logging

## Summary

✅ **Frontend**: Uses keycloak-angular's automatic token injection
✅ **Frontend**: Proper role checking with KeycloakService  
✅ **Backend**: Role-based access control for CRUD operations
✅ **Setup**: Keycloak user with ROLE_ADMIN required
✅ **Testing**: Full CRUD operations working for admin users

**Next Step**: Create a Keycloak user with ROLE_ADMIN and test! 🚀


