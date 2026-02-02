# Dashboard Implementation Guide

## Overview
This document describes the implementation of the Dashboard feature for the Metrics Forecaster application, including both backend (Go) and frontend (Angular) components.

## Backend Implementation

### Database Migration
**Location:** `go-api/db/migrations/000008_create_dashboards_table.up.sql`

Created a new `dashboards` table with:
- `id` (UUID, primary key)
- `user_id` (UUID, not null) - Links dashboard to a user
- `data` (JSONB, not null) - Stores dashboard configuration and widgets
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)
- Index on `user_id` for optimized queries

### Backend Structure

#### 1. Model (`go-api/models/dashboard.go`)
- `Dashboard` - Main dashboard entity
- `CreateDashboardRequest` - Request for creating new dashboard
- `UpdateDashboardRequest` - Request for updating dashboard
- `DashboardListResponse` - Paginated list response

#### 2. Repository (`go-api/repository/dashboard_repository.go`)
Database operations:
- `Create()` - Insert new dashboard
- `GetByID()` - Retrieve dashboard by ID
- `GetAll()` - List dashboards with pagination and user filtering
- `Update()` - Update dashboard data
- `Delete()` - Remove dashboard

#### 3. Handler (`go-api/handlers/dashboard_handler.go`)
HTTP request handlers:
- `CreateDashboard()` - POST /api/dashboards
- `GetDashboard()` - GET /api/dashboards/{id}
- `ListDashboards()` - GET /api/dashboards
- `UpdateDashboard()` - PUT /api/dashboards/{id}
- `DeleteDashboard()` - DELETE /api/dashboards/{id}

#### 4. Routes (`go-api/router/router.go`)
**Public Endpoints (Read-only):**
- `GET /api/dashboards` - List all dashboards (with optional user_id filter)
- `GET /api/dashboards/{id}` - Get specific dashboard

**Protected Endpoints (ROLE_ADMIN required):**
- `POST /api/dashboards` - Create new dashboard
- `PUT /api/dashboards/{id}` - Update dashboard
- `DELETE /api/dashboards/{id}` - Delete dashboard

## Frontend Implementation

### Angular Module Structure
**Location:** `frontend/src/app/routed/dashboard/`

```
dashboard/
├── services/
│   └── dashboard.service.ts
├── pages/
│   └── dashboard/
│       ├── dashboard.page.ts
│       ├── dashboard.page.html
│       └── dashboard.page.css
├── dashboard-routing.module.ts
└── dashboard.module.ts
```

### Components

#### 1. Dashboard Service (`services/dashboard.service.ts`)
Provides API communication:
- `getDashboards()` - Fetch dashboards with pagination and filtering
- `getDashboard()` - Get single dashboard by ID
- `createDashboard()` - Create new dashboard
- `updateDashboard()` - Update existing dashboard
- `deleteDashboard()` - Delete dashboard
- `getOrCreateDashboard()` - **Smart method** that checks if user has a dashboard, creates one if not

#### 2. Dashboard Page Component (`pages/dashboard/dashboard.page.ts`)
Main dashboard page with:
- Automatic user profile loading via Keycloak
- Dashboard initialization on component load
- Auto-creation of empty dashboard if none exists
- Save functionality for dashboard updates

**Key Features:**
- Loading state while fetching data
- Error handling and display
- User-specific dashboard loading
- Save button to persist changes

#### 3. Dashboard Template (`pages/dashboard/dashboard.page.html`)
UI includes:
- Loading spinner during initialization
- Error message display
- Dashboard metadata (ID, User ID, timestamps)
- Empty workspace placeholder for future widgets
- Save button

#### 4. Dashboard Styles (`pages/dashboard/dashboard.page.css`)
Professional styling with:
- Responsive layout
- Clean card-based design
- Empty state visualization
- Loading and error states

### Routing

#### App Routing (`app-routing.module.ts`)
Added lazy-loaded route:
```typescript
{
  path: 'dashboard',
  loadChildren: () => import('./routed/dashboard/dashboard.module').then((m) => m.DashboardModule)
}
```

#### Header Navigation (`app.component.html`)
Added "Дашборд" tab in the main navigation menu (visible when logged in).

## Usage Flow

### 1. User Navigation
1. User logs in to the application
2. Clicks on "Дашборд" in the header navigation
3. Application routes to `/dashboard`

### 2. Dashboard Initialization
1. Component loads user profile from Keycloak
2. Extracts user ID
3. Calls `getOrCreateDashboard(userId)`:
   - First attempts to fetch existing dashboard for user
   - If no dashboard exists, creates a new one with empty data structure:
     ```json
     {
       "widgets": [],
       "layout": []
     }
     ```
4. Displays dashboard in the UI

### 3. Dashboard Management
- **View:** Dashboard displays metadata and current data
- **Edit:** User can modify dashboard (future feature)
- **Save:** Click "Сохранить" button to persist changes

## API Endpoints

### Public Endpoints
```
GET /api/dashboards?user_id={userId}&page=1&pageSize=20
GET /api/dashboards/{id}
```

### Protected Endpoints (ROLE_ADMIN)
```
POST /api/dashboards
PUT /api/dashboards/{id}
DELETE /api/dashboards/{id}
```

## Data Structure

### Dashboard Data (JSONB)
Initial structure:
```json
{
  "widgets": [],
  "layout": []
}
```

This structure can be extended to include:
- Widget configurations
- Layout positions
- Chart settings
- Custom preferences

## Security

### Backend
- Read operations are public (for development)
- Write operations (Create, Update, Delete) require `ROLE_ADMIN`
- User-based filtering available via `user_id` query parameter

### Frontend
- Uses Keycloak for authentication
- Automatically loads user profile
- Dashboard is user-specific based on Keycloak user ID

## Future Enhancements

1. **Widget System:**
   - Add draggable widgets
   - Chart components (line, bar, pie)
   - Metric displays
   - Custom widgets

2. **Layout Management:**
   - Grid-based layout system
   - Drag-and-drop positioning
   - Responsive breakpoints

3. **Data Visualization:**
   - Integration with metrics catalog
   - Real-time data updates
   - Custom date ranges

4. **Sharing & Permissions:**
   - Share dashboards with other users
   - Role-based access control
   - Public/private dashboards

5. **Templates:**
   - Pre-built dashboard templates
   - Export/import functionality
   - Clone existing dashboards

## Testing

### Backend Testing
```bash
# List dashboards for a user
curl -X GET "http://localhost:8081/api/dashboards?user_id={userId}"

# Get specific dashboard
curl -X GET "http://localhost:8081/api/dashboards/{id}"

# Create dashboard (requires auth)
curl -X POST "http://localhost:8081/api/dashboards" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{"userId": "{userId}", "data": {"widgets": [], "layout": []}}'
```

### Frontend Testing
1. Start the backend: `cd go-api && go run main.go`
2. Start the frontend: `cd frontend && npm start`
3. Navigate to `http://localhost:4200/dashboard`
4. Verify dashboard loads or creates automatically

## Migration

The migration will run automatically on server start. To manually run:
```bash
cd go-api
go run main.go
```

The migration creates the `dashboards` table in PostgreSQL.

## Dependencies

### Backend
- PostgreSQL with JSONB support
- Keycloak for authentication
- Standard Go libraries (database/sql, encoding/json)

### Frontend
- Angular 12+
- Angular Material
- Keycloak Angular adapter
- RxJS

## Notes

- Dashboard data is stored as JSONB for flexibility
- One dashboard per user by default
- Empty dashboards are created automatically
- All timestamps are managed by the database
- User ID comes from Keycloak authentication


