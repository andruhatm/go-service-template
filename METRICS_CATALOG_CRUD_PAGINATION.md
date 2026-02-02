# Metrics Catalog - CRUD Operations & Pagination Implementation

## Overview

This document describes the complete implementation of pagination and CRUD (Create, Read, Update, Delete) operations for the Metrics Catalog feature with ROLE_ADMIN protection.

## Features Implemented

### ✅ Backend Features

1. **Protected CRUD Endpoints** (ROLE_ADMIN required)
   - `POST /api/metrics-catalog` - Create new metric
   - `PUT /api/metrics-catalog/{id}` - Update existing metric
   - `DELETE /api/metrics-catalog/{id}` - Delete metric

2. **Repository Methods**
   - `CreateMetric` - Insert new metric with validation
   - `UpdateMetric` - Dynamic update with partial fields
   - `DeleteMetric` - Safe deletion with existence check

3. **Validation & Error Handling**
   - Required field validation
   - Duplicate name detection
   - Not found handling
   - Conflict responses for unique constraint violations

### ✅ Frontend Features

1. **Pagination**
   - Material paginator component
   - Configurable page sizes (10, 20, 50, 100)
   - Shows total count
   - First/Last page navigation

2. **Create/Edit Dialog**
   - Modal dialog for creating new metrics
   - Edit existing metrics with pre-filled data
   - Autocomplete for group field based on existing groups
   - Form validation (required name field)
   - Clean, modern Material Design UI

3. **Delete Confirmation**
   - Confirmation dialog before deletion
   - Shows metric name in warning
   - Prevents accidental deletions

4. **Action Buttons**
   - Edit button (pencil icon) for each row
   - Delete button (trash icon) for each row
   - Tooltips for better UX
   - Create button in header with icon

5. **Loading States**
   - Spinner during data fetch
   - Loading indicator during CRUD operations
   - Prevents multiple simultaneous operations

## File Changes

### Backend (Go)

#### New/Modified Files:
1. **`go-api/models/metric_catalog.go`**
   - Added `CreateMetricCatalogRequest`
   - Added `UpdateMetricCatalogRequest`

2. **`go-api/repository/metric_catalog_repository.go`**
   - Added `CreateMetric(req)`
   - Added `UpdateMetric(id, req)` with dynamic query building
   - Added `DeleteMetric(id)`

3. **`go-api/handlers/metric_catalog_handler.go`**
   - Added `CreateMetric(w, r)` handler
   - Added `UpdateMetric(w, r)` handler
   - Added `DeleteMetric(w, r)` handler
   - Added imports for `models` and `strings`

4. **`go-api/router/router.go`**
   - Added protected POST `/api/metrics-catalog` with ROLE_ADMIN check
   - Added protected PUT `/api/metrics-catalog/{id}` with ROLE_ADMIN check
   - Added protected DELETE `/api/metrics-catalog/{id}` with ROLE_ADMIN check

### Frontend (Angular)

#### New/Modified Files:
1. **`frontend/src/app/routed/catalog/services/metric-catalog.service.ts`**
   - Added `createMetric(metric)`
   - Added `updateMetric(id, metric)`
   - Added `deleteMetric(id)`

2. **`frontend/src/app/routed/catalog/pages/metric-catalog/metric-catalog.component.ts`**
   - Added pagination properties and ViewChild
   - Added `MetricDialogComponent` for create/edit
   - Added `DeleteConfirmDialogComponent` for deletion
   - Added action column to table
   - Added methods: `openCreateDialog()`, `openEditDialog()`, `openDeleteDialog()`
   - Added methods: `createMetric()`, `updateMetric()`, `deleteMetric()`
   - Added `onPageChange()` for pagination
   - Updated imports for paginator and validators

3. **`frontend/src/app/routed/catalog/pages/metric-catalog/metric-catalog.component.html`**
   - Added action column with edit/delete buttons
   - Added Material paginator component
   - Updated create button with icon
   - Added tooltips for action buttons

4. **`frontend/src/app/routed/catalog/catalog.module.ts`**
   - Added `MatPaginatorModule`
   - Added `MatIconModule`
   - Added `MatTooltipModule`
   - Added `MatAutocompleteModule`
   - Declared `MetricDialogComponent` and `DeleteConfirmDialogComponent`

## API Endpoints Summary

### Public Endpoints (Read-Only)
```
GET  /api/metrics-catalog           - List metrics with pagination
GET  /api/metrics-catalog/groups    - Get all groups
GET  /api/metrics-catalog/{id}      - Get single metric
```

### Protected Endpoints (ROLE_ADMIN Required)
```
POST   /api/metrics-catalog         - Create new metric
PUT    /api/metrics-catalog/{id}    - Update metric
DELETE /api/metrics-catalog/{id}    - Delete metric
```

## Usage Examples

### Create Metric (ROLE_ADMIN)
```bash
curl -X POST http://localhost:8081/api/metrics-catalog \
  -H "Authorization: Bearer {admin_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "CPU_Usage",
    "unit": "percent",
    "degradation": "increase",
    "group": "Performance"
  }'
```

### Update Metric (ROLE_ADMIN)
```bash
curl -X PUT http://localhost:8081/api/metrics-catalog/{uuid} \
  -H "Authorization: Bearer {admin_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "unit": "percentage",
    "degradation": "higher"
  }'
```

### Delete Metric (ROLE_ADMIN)
```bash
curl -X DELETE http://localhost:8081/api/metrics-catalog/{uuid} \
  -H "Authorization: Bearer {admin_token}"
```

## Security

- All write operations (Create, Update, Delete) require authentication
- ROLE_ADMIN role is mandatory for all CRUD operations
- Read operations remain public for development (should be restricted in production)
- All endpoints validate input and handle errors gracefully

## User Interface

### Main Features:
1. **Header Section**
   - Total metrics count display
   - Create button (only visible to admins)
   - Group filter buttons

2. **Table View**
   - Columns: Name, Group, Unit, Degradation, Actions
   - Edit/Delete buttons for each row
   - Responsive Material table design

3. **Pagination**
   - Bottom of table
   - Page size selector
   - First/Previous/Next/Last navigation
   - Total count indicator

4. **Dialogs**
   - Create/Edit: Form with 4 fields (name required)
   - Delete: Confirmation with metric name
   - Modern Material Design styling

## Testing Steps

### 1. Rebuild and Restart Backend
```bash
cd /Users/andrewgerasimov/GolandProjects/go-service-template/go-api
go build -o ./out/app .
./out/app
```

### 2. Build Frontend
```bash
cd /Users/andrewgerasimov/GolandProjects/go-service-template/frontend
npm run build
```

### 3. Test in Browser
1. Login as user with ROLE_ADMIN
2. Navigate to Metrics Catalog page
3. Test Create: Click "Создать метрику" button
4. Test Edit: Click edit icon on any metric
5. Test Delete: Click delete icon, confirm deletion
6. Test Pagination: Change page size, navigate pages
7. Test Filtering: Click group filter buttons

## Build Status

✅ **Backend**: All linter checks passed
✅ **Frontend**: Build successful (no errors)
- Main bundle: 953.94 kB (208.76 kB gzipped)
- Catalog module: 4 lazy chunks (30.81 kB + 29.91 kB + 22.00 kB + 6.77 kB)

## Next Steps

1. **Restart the Go API server** to load new endpoints
2. **Test CRUD operations** with admin user
3. **Verify pagination** works correctly
4. **Test role-based access** (non-admin should not see action buttons)

## Notes

- The frontend gracefully handles errors with alert messages
- All operations reload data after completion
- Group list updates after create/update operations
- Pagination state resets when filtering by group
- Compatible with existing Keycloak authentication


