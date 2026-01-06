# Metrics Catalog Implementation

This document describes the implementation of the Metrics Catalog feature that fetches data from the `metrics_configuration` database table and displays it in the frontend.

## Overview

The implementation includes:
- Backend API endpoints to query the `metrics_configuration` table
- Frontend service to consume the API
- Updated UI component to display metrics data with filtering and pagination

## Backend Implementation

### 1. Model (`go-api/models/metric_catalog.go`)

Defines the data structure for metrics:
- `MetricCatalog` - represents a single metric with fields: id, name, unit, degradation, group, timestamps
- `MetricCatalogListResponse` - paginated response structure

### 2. Repository (`go-api/repository/metric_catalog_repository.go`)

Database access layer with methods:
- `ListMetrics(page, pageSize, groupFilter)` - fetches paginated metrics with optional group filtering
- `GetMetricByID(id)` - fetches a single metric by UUID
- `GetGroupsList()` - fetches all unique group names

### 3. Handler (`go-api/handlers/metric_catalog_handler.go`)

HTTP request handlers:
- `ListMetrics` - handles GET requests with pagination and filtering
- `GetMetric` - handles GET requests for single metric
- `GetGroups` - returns list of available groups

### 4. Routes (`go-api/router/router.go`)

Public endpoints added:
- `GET /api/metrics-catalog` - list all metrics (with optional query params: page, pageSize, group)
- `GET /api/metrics-catalog/groups` - get all unique groups
- `GET /api/metrics-catalog/{id}` - get specific metric by ID

## Frontend Implementation

### 1. Service (`frontend/src/app/routed/catalog/services/metric-catalog.service.ts`)

Angular service with methods:
- `getMetrics(page, pageSize, group?)` - fetches paginated metrics
- `getMetric(id)` - fetches single metric
- `getGroups()` - fetches available groups

### 2. Component (`frontend/src/app/routed/catalog/pages/metric-catalog/metric-catalog.component.ts`)

Updated component features:
- Fetches data from backend on initialization
- Displays loading spinner while fetching
- Shows total count of metrics
- Implements group filtering
- Pagination support (ready for UI implementation)

### 3. Template (`frontend/src/app/routed/catalog/pages/metric-catalog/metric-catalog.component.html`)

UI updates:
- Loading spinner during data fetch
- Group filter buttons
- Total count display
- Empty state message
- Displays metrics in Material table

### 4. Module (`frontend/src/app/routed/catalog/catalog.module.ts`)

Added imports:
- `HttpClientModule` - for HTTP requests
- `MatProgressSpinnerModule` - for loading indicator

## API Usage Examples

### List all metrics
```bash
curl http://localhost:8081/api/metrics-catalog
```

### List metrics with pagination
```bash
curl "http://localhost:8081/api/metrics-catalog?page=1&pageSize=10"
```

### List metrics filtered by group
```bash
curl "http://localhost:8081/api/metrics-catalog?group=RAN"
```

### Get all groups
```bash
curl http://localhost:8081/api/metrics-catalog/groups
```

### Get specific metric
```bash
curl http://localhost:8081/api/metrics-catalog/{uuid}
```

## Testing

Run the test script to verify all endpoints:
```bash
./test_metrics_catalog_api.sh
```

Note: The backend service must be running on port 8081.

## Database Schema

The implementation queries the `metrics_configuration` table with the following structure:

```sql
CREATE TABLE metrics_configuration (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    unit VARCHAR(100),
    degradation VARCHAR(100),
    "group" VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Features

✅ Pagination support (page, pageSize parameters)
✅ Group filtering
✅ Loading states
✅ Error handling
✅ Empty state display
✅ Total count display
✅ Material Design UI components
✅ TypeScript type safety
✅ Responsive design

## Future Enhancements

Potential improvements:
- Add sorting functionality
- Implement search/filter by name
- Add pagination UI controls (next/previous buttons)
- Implement create/update/delete operations for metrics
- Add detailed metric view with all fields
- Export metrics to CSV/Excel
- Add metrics visualization/charts

