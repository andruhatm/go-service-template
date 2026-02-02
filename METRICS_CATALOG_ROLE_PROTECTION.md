# Metrics Catalog - Role-Based Access Control (RBAC)

## Issue Fixed

**Problem**: Users with `ROLE_MONITOR` (or any non-admin role) could see and attempt to use the Create, Edit, and Delete buttons in the Metrics Catalog UI.

**Solution**: Implemented frontend role-based UI protection that hides CRUD operation buttons from users who don't have `ROLE_ADMIN`.

## Implementation

### Frontend Changes

**File**: `frontend/src/app/routed/catalog/pages/metric-catalog/metric-catalog.component.ts`

#### 1. Added KeycloakAuthService Injection
```typescript
import {KeycloakAuthService} from "../../../../core/auth/keycloak-auth.service";

constructor(
  public dialog: MatDialog,
  private metricCatalogService: MetricCatalogService,
  private keycloakAuthService: KeycloakAuthService
) { }

isAdmin = false;
```

#### 2. Role Check on Initialization
```typescript
ngOnInit(): void {
  // Check if user is admin
  this.keycloakAuthService.authState$.subscribe(authState => {
    this.isAdmin = authState.isAdmin;
    console.log('User is admin:', this.isAdmin);
    
    // Update displayed columns based on admin status
    this.updateDisplayedColumns();
  });
  
  // ... rest of initialization
}
```

#### 3. Dynamic Column Management
```typescript
private updateDisplayedColumns(): void {
  if (this.isAdmin) {
    // Show all columns including actions for admins
    this.displayedColumns = this.columns.map(c => c.columnDef);
  } else {
    // Hide actions column for non-admins
    this.displayedColumns = this.columns
      .filter(c => c.columnDef !== 'actions')
      .map(c => c.columnDef);
  }
}
```

### Template Changes

**File**: `frontend/src/app/routed/catalog/pages/metric-catalog/metric-catalog.component.html`

#### 1. Hide Create Button for Non-Admins
```html
<button *ngIf="isAdmin" mat-flat-button color="primary" (click)="openCreateDialog()">
  <mat-icon>add</mat-icon>
  Создать метрику
</button>
```

#### 2. Hide Edit/Delete Buttons for Non-Admins
```html
<ng-container *ngIf="column.columnDef === 'actions' && isAdmin">
  <button mat-icon-button color="primary" 
          (click)="openEditDialog(row)" 
          matTooltip="Редактировать">
    <mat-icon>edit</mat-icon>
  </button>
  <button mat-icon-button color="warn" 
          (click)="openDeleteDialog(row)" 
          matTooltip="Удалить">
    <mat-icon>delete</mat-icon>
  </button>
</ng-container>
```

## Security Architecture

### Defense in Depth

The implementation follows a **defense-in-depth** security model with multiple layers:

#### Layer 1: Frontend UI (Current Implementation)
- **Purpose**: User experience - hide UI elements from unauthorized users
- **Method**: `*ngIf="isAdmin"` directives
- **Protection Level**: Low (can be bypassed by modifying client-side code)
- **Benefit**: Prevents confusion and accidental unauthorized attempts

#### Layer 2: Backend API (Already Implemented)
- **Purpose**: Actual security enforcement
- **Method**: ROLE_ADMIN checks in router middleware
- **Protection Level**: High (cannot be bypassed)
- **Endpoints Protected**:
  - `POST /api/metrics-catalog` - Create metric
  - `PUT /api/metrics-catalog/{id}` - Update metric
  - `DELETE /api/metrics-catalog/{id}` - Delete metric

### Example Backend Protection

From `go-api/router/router.go`:

```go
// Metrics Catalog CRUD endpoints (protected - ROLE_ADMIN only)
protected.HandleFunc("/metrics-catalog", func(w http.ResponseWriter, r *http.Request) {
    if !middleware.HasRole(r.Context(), "realm:ROLE_ADMIN") {
        http.Error(w, "Forbidden: ROLE_ADMIN required", http.StatusForbidden)
        return
    }
    metricCatalogHandler.CreateMetric(w, r)
}).Methods("POST")
```

## User Experience by Role

### ROLE_ADMIN Users

**Can See**:
- ✅ "Создать метрику" (Create) button
- ✅ Edit icon (pencil) for each metric
- ✅ Delete icon (trash) for each metric
- ✅ Actions column in table

**Can Do**:
- ✅ Create new metrics
- ✅ Edit existing metrics
- ✅ Delete metrics
- ✅ View all metrics
- ✅ Filter by group
- ✅ Use pagination

### ROLE_MONITOR / ROLE_OPERATOR / Other Roles

**Can See**:
- ✅ Metrics table (without Actions column)
- ✅ Group filter buttons
- ✅ Pagination controls
- ✅ Total metrics count

**Cannot See**:
- ❌ "Создать метрику" button
- ❌ Edit buttons
- ❌ Delete buttons
- ❌ Actions column

**Can Do**:
- ✅ View all metrics (read-only)
- ✅ Filter by group
- ✅ Use pagination

**Cannot Do** (UI hidden + backend blocked):
- ❌ Create new metrics
- ❌ Edit existing metrics
- ❌ Delete metrics

## Testing the Fix

### Test as ROLE_ADMIN
1. Login with admin credentials
2. Navigate to Metrics Catalog
3. **Expected**: See "Создать метрику" button
4. **Expected**: See edit/delete icons in table
5. **Expected**: Can create, edit, delete metrics successfully

### Test as ROLE_MONITOR
1. Login with monitor credentials
2. Navigate to Metrics Catalog
3. **Expected**: NO "Создать метрику" button
4. **Expected**: NO edit/delete icons in table
5. **Expected**: NO "Actions" column header
6. **Expected**: Can view and filter metrics only

### Test Backend Protection (Optional)
Even if a non-admin user somehow triggered a create/edit/delete request:

```bash
# Attempt to create metric without ROLE_ADMIN token
curl -X POST http://localhost:8081/api/metrics-catalog \
  -H "Authorization: Bearer {monitor_token}" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test", "unit": "ms"}'

# Expected Response: 403 Forbidden
```

## Build Status

✅ **Angular Build**: Successful
- No compilation errors
- No linter errors
- Bundle size: ~1.33 MB (256.43 kB gzipped)
- Catalog module: 44.js increased from 22.00 kB to 22.59 kB (+590 bytes for auth logic)

## Files Modified

1. `frontend/src/app/routed/catalog/pages/metric-catalog/metric-catalog.component.ts`
   - Added `KeycloakAuthService` import and injection
   - Added `isAdmin` property
   - Added auth state subscription in `ngOnInit()`
   - Added `updateDisplayedColumns()` method

2. `frontend/src/app/routed/catalog/pages/metric-catalog/metric-catalog.component.html`
   - Added `*ngIf="isAdmin"` to Create button
   - Added `*ngIf="isAdmin"` to action buttons in table

## Security Notes

1. **Frontend protection is for UX only** - it improves user experience but is not a security boundary
2. **Backend protection is mandatory** - all write operations are protected at the API level
3. **Token-based authentication** - relies on Keycloak JWT tokens with role claims
4. **Role checking** - uses `authState.isAdmin` which checks for `ROLE_ADMIN` in Keycloak roles

## Next Steps

After rebuilding the frontend, users will experience proper role-based access:
- Admins get full CRUD capabilities
- Monitors/Operators get read-only access
- UI automatically adapts based on user role


