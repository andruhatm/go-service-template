# Dashboard with Widgets and VictoriaMetrics Integration

## Overview
Complete implementation of a dynamic dashboard system with real-time chart widgets that query VictoriaMetrics for time-series data visualization.

## Features Implemented

### ✅ Backend (Go API)

#### 1. **VictoriaMetrics Query Handler**
**File:** `go-api/handlers/metrics_query_handler.go`

New handler for querying VictoriaMetrics:
- `QueryMetrics()` - POST endpoint for range queries
- `QueryMetricsInstant()` - GET endpoint for instant queries
- Builds PromQL queries based on metric name and object name
- Supports custom time ranges and step intervals

**API Endpoints:**
```
POST /api/metrics/query
GET  /api/metrics/query-instant
```

**Request Format (POST):**
```json
{
  "metricName": "test1",
  "objectName": "enb27738",
  "startTime": 1767530071,
  "endTime": 1767533671,
  "step": 60
}
```

**Response Format:**
```json
{
  "status": "success",
  "data": {
    "resultType": "matrix",
    "result": [
      {
        "metric": {
          "name": "enb27738",
          "type": "actual"
        },
        "values": [
          [1767533671, "42"],
          [1767534971, "50"]
        ]
      }
    ]
  }
}
```

#### 2. **Router Updates**
**File:** `go-api/router/router.go`

- Added VictoriaMetrics service to router initialization
- Registered metrics query endpoints (public access)
- Updated `GenerateServeMux()` to accept `vmService` parameter

#### 3. **Main Application Updates**
**File:** `go-api/main.go`

- Passes VictoriaMetrics service to router

---

### ✅ Frontend (Angular)

#### 1. **Dashboard Service Updates**
**File:** `dashboard.service.ts`

**New Interfaces:**
```typescript
interface Widget {
  id: string;
  type: 'line-chart' | 'bar-chart' | 'gauge';
  title: string;
  metricName: string;
  metricId: string;
  objectName: string;
  objectId: string;
  position: { x: number; y: number; w: number; h: number };
}

interface DashboardData {
  widgets: Widget[];
  layout: any[];
}
```

**New Methods:**
- `queryMetrics(request)` - Query VictoriaMetrics for time-series data

#### 2. **Add Widget Dialog Component**
**Files:** `components/add-widget-dialog/`

Modal dialog for creating new chart widgets:
- Select widget type (line chart, bar chart, gauge)
- Choose monitoring object from `mon_objects` table
- Choose metric from `metrics_configuration` table
- Auto-loads available objects and metrics via API
- Returns configured widget on submission

**Features:**
- Real-time loading of objects and metrics
- Form validation
- Clean Material Design UI

#### 3. **Chart Widget Component**
**Files:** `components/chart-widget/`

Displays individual chart widgets with VictoriaMetrics data:
- **Auto-refresh support** with configurable intervals
- **Period control** (15min to 24 hours)
- Queries VictoriaMetrics on load and refresh
- Displays time-series data using NGX Charts
- Manual refresh button
- Loading and error states
- Responsive design

**Key Features:**
- Line chart visualization using `@swimlane/ngx-charts`
- Handles multiple metric series (actual, forecast, etc.)
- Automatic data parsing from VictoriaMetrics format
- Adaptive step calculation based on period
- Clean widget card design with badges

#### 4. **Dashboard Page Updates**
**Files:** `pages/dashboard/`

Main dashboard page with full widget management:

**Controls:**
- **Period Selector:** 15min, 30min, 1h, 3h, 6h, 12h, 24h
- **Auto-refresh Toggle:** Enable/disable automatic updates
- **Refresh Interval:** 30sec, 1min, 2min, 5min, 10min
- **Refresh All Button:** Force refresh all widgets
- **Add Widget Button:** Open widget creation dialog

**Widget Management:**
- Display widgets in responsive grid layout
- Remove individual widgets
- Save widget configuration to backend
- Persist widgets in dashboard JSON data

**Layout:**
```
┌─────────────────────────────────────────────┐
│ Period: [1 hour] ☑ Auto-refresh [1 min]    │
│ [Refresh All] [+ Add Widget]               │
├─────────────────────────────────────────────┤
│ ┌─────────────┐  ┌─────────────┐          │
│ │  Widget 1   │  │  Widget 2   │          │
│ │   Chart     │  │   Chart     │          │
│ └─────────────┘  └─────────────┘          │
│ ┌─────────────┐  ┌─────────────┐          │
│ │  Widget 3   │  │  Widget 4   │          │
│ │   Chart     │  │   Chart     │          │
│ └─────────────┘  └─────────────┘          │
└─────────────────────────────────────────────┘
```

#### 5. **Module Updates**
**File:** `dashboard.module.ts`

Added dependencies:
- `@swimlane/ngx-charts` - Chart library
- Angular Material components (Dialog, Form Fields, etc.)
- FormsModule and ReactiveFormsModule
- All new components declared and exported

---

## Usage Flow

### Creating a Chart Widget

1. **Navigate to Dashboard**
   - Click "Дашборд" in header
   - Dashboard loads with controls

2. **Click "Добавить виджет"**
   - Dialog opens

3. **Configure Widget**
   - Enter widget title (e.g., "Traffic Forecast")
   - Select widget type (Line Chart)
   - Choose monitoring object (e.g., "enb27738")
   - Choose metric (e.g., "test1")
   - Click "Добавить"

4. **Widget Created**
   - Widget appears in dashboard
   - Automatically queries VictoriaMetrics
   - Displays time-series data as line chart
   - Shows both "actual" and "forecast" series if available

5. **Customize Display**
   - Change period (e.g., 3 hours)
   - Enable auto-refresh (e.g., 1 minute)
   - Widget automatically updates

### Auto-Refresh Flow

```
User enables auto-refresh with 1-minute interval
    ↓
ChartWidgetComponent.startAutoRefresh()
    ↓
RxJS interval(60000) triggers every 60 seconds
    ↓
queryMetrics() called automatically
    ↓
VictoriaMetrics queried with current period
    ↓
Chart updates with new data
    ↓
Repeat...
```

### Period Change Flow

```
User selects "3 hours" period
    ↓
DashboardPage.onPeriodChange()
    ↓
period variable updated
    ↓
All widgets receive new period via @Input
    ↓
Widgets automatically query with new time range
    ↓
Charts update to show 3-hour data
```

---

## VictoriaMetrics Query Details

### PromQL Query Construction

The system builds PromQL queries in the format:
```
{metricName}{name="{objectName}"}
```

**Example:**
```
test1{name="enb27738"}
```

This query returns all time series for metric "test1" where the object name is "enb27738".

### Time Range Parameters

- **startTime:** Unix timestamp (seconds) - Start of time range
- **endTime:** Unix timestamp (seconds) - End of time range
- **step:** Interval in seconds between data points

**Example Calculation for 1-hour period:**
```typescript
const now = Math.floor(Date.now() / 1000);  // Current time
const startTime = now - 3600;                // 1 hour ago
const endTime = now;                         // Now
const step = Math.max(Math.floor(3600 / 100), 60);  // ~36 seconds
```

### Response Parsing

VictoriaMetrics returns data in format:
```json
{
  "metric": { "name": "enb27738", "type": "actual" },
  "values": [
    [1767533671, "42"],
    [1767534971, "50"]
  ]
}
```

Parsed to chart format:
```typescript
{
  name: "actual",
  series: [
    { name: "10:21:11", value: 42 },
    { name: "10:42:51", value: 50 }
  ]
}
```

---

## Configuration

### Backend Configuration

VictoriaMetrics connection is configured in `configuration.yaml`:
```yaml
victoria:
  url: "http://localhost:8428"
```

### Frontend Configuration

API URL in `dashboard.service.ts`:
```typescript
private apiUrl = 'http://localhost:8081/api';
```

---

## Widget Types

Currently supported:
- **Line Chart** - Time-series line visualization (implemented)
- **Bar Chart** - Bar chart visualization (structure ready)
- **Gauge** - Single value gauge (structure ready)

---

## Data Flow Diagram

```
User Action (Dashboard Page)
    ↓
Add Widget Dialog
    ↓
Select Object + Metric
    ↓
Create Widget Configuration
    ↓
Save to Dashboard Data (JSON)
    ↓
POST /api/dashboards/{id} (Update)
    ↓
Widget Component Renders
    ↓
Query VictoriaMetrics
    ↓
POST /api/metrics/query
    ↓
Go Backend Handler
    ↓
VictoriaMetrics.QueryRange()
    ↓
VictoriaMetrics HTTP API
    ↓
Return Time-Series Data
    ↓
Parse & Format for Chart
    ↓
NGX Charts Renders
    ↓
User Sees Visualization
```

---

## API Reference

### Backend Endpoints

#### Query Metrics (Range)
```
POST /api/metrics/query
Content-Type: application/json

{
  "metricName": "test1",
  "objectName": "enb27738",
  "startTime": 1767530071,
  "endTime": 1767533671,
  "step": 60
}
```

#### Query Metrics (Instant)
```
GET /api/metrics/query-instant?metric=test1&object=enb27738&time=1767533671
```

### Frontend Service Methods

```typescript
// Dashboard Service
getDashboards(userId?, page?, pageSize?): Observable<DashboardListResponse>
getDashboard(id: string): Observable<Dashboard>
createDashboard(request: CreateDashboardRequest): Observable<Dashboard>
updateDashboard(id: string, request: UpdateDashboardRequest): Observable<Dashboard>
deleteDashboard(id: string): Observable<void>
getOrCreateDashboard(userId: string): Observable<Dashboard>
queryMetrics(request: MetricsQueryRequest): Observable<MetricsQueryResponse>
```

---

## Installation & Setup

### Backend (Go)

1. Ensure VictoriaMetrics is running:
```bash
docker run -d -p 8428:8428 victoriametrics/victoria-metrics
```

2. Start the Go API:
```bash
cd go-api
go run main.go
```

### Frontend (Angular)

1. Install dependencies:
```bash
cd frontend
npm install
```

2. Install ngx-charts (if not already added):
```bash
npm install @swimlane/ngx-charts --save
```

3. Start the development server:
```bash
npm start
```

4. Navigate to: `http://localhost:4200/dashboard`

---

## Testing

### Manual Testing

1. **Create Test Data in VictoriaMetrics:**
```bash
curl -X POST http://localhost:8428/api/v1/import/prometheus \
  -d 'test1{name="enb27738",type="actual"} 42 1767533671
test1{name="enb27738",type="forecast"} 50 1767534971'
```

2. **Test Backend API:**
```bash
curl -X POST http://localhost:8081/api/metrics/query \
  -H "Content-Type: application/json" \
  -d '{
    "metricName": "test1",
    "objectName": "enb27738",
    "startTime": 1767530000,
    "endTime": 1767540000,
    "step": 60
  }'
```

3. **Test Frontend:**
   - Navigate to Dashboard
   - Click "Добавить виджет"
   - Select object and metric
   - Verify chart displays
   - Test auto-refresh
   - Test period changes

---

## Troubleshooting

### No Data Displayed

1. Check VictoriaMetrics is running:
```bash
curl http://localhost:8428/metrics
```

2. Verify data exists:
```bash
curl http://localhost:8428/api/v1/query?query=test1
```

3. Check backend logs for query errors

4. Verify frontend API URL is correct

### Auto-Refresh Not Working

1. Check browser console for errors
2. Verify `autoRefresh` is enabled in UI
3. Check `refreshInterval` is set correctly
4. Ensure no subscription leaks (check component destroy)

### Widgets Not Saving

1. Check dashboard update API response
2. Verify user has proper permissions
3. Check dashboard data JSON structure
4. Verify backend database connection

---

## Future Enhancements

1. **Additional Chart Types:**
   - Bar charts implementation
   - Gauge widgets implementation
   - Pie charts
   - Heat maps

2. **Advanced Features:**
   - Drag-and-drop widget positioning
   - Widget resizing
   - Custom PromQL query editor
   - Dashboard templates
   - Export/import dashboards

3. **Performance:**
   - Data caching
   - WebSocket real-time updates
   - Lazy loading for large datasets

4. **Collaboration:**
   - Share dashboards with other users
   - Public dashboards
   - Dashboard comments

---

## Files Created/Modified

### Backend
- ✅ `go-api/handlers/metrics_query_handler.go` (NEW)
- ✅ `go-api/router/router.go` (MODIFIED)
- ✅ `go-api/main.go` (MODIFIED)

### Frontend
- ✅ `frontend/src/app/routed/dashboard/services/dashboard.service.ts` (MODIFIED)
- ✅ `frontend/src/app/routed/dashboard/components/add-widget-dialog/` (NEW)
  - `add-widget-dialog.component.ts`
  - `add-widget-dialog.component.html`
  - `add-widget-dialog.component.css`
- ✅ `frontend/src/app/routed/dashboard/components/chart-widget/` (NEW)
  - `chart-widget.component.ts`
  - `chart-widget.component.html`
  - `chart-widget.component.css`
- ✅ `frontend/src/app/routed/dashboard/pages/dashboard/` (MODIFIED)
  - `dashboard.page.ts`
  - `dashboard.page.html`
  - `dashboard.page.css`
- ✅ `frontend/src/app/routed/dashboard/dashboard.module.ts` (MODIFIED)
- ✅ `frontend/package.json` (MODIFIED - added @swimlane/ngx-charts)

### Documentation
- ✅ `DASHBOARD_IMPLEMENTATION.md`
- ✅ `DASHBOARD_WIDGETS_GUIDE.md` (this file)

---

## Summary

The dashboard now supports:
- ✅ Dynamic widget creation with object and metric selection
- ✅ Real-time VictoriaMetrics data visualization
- ✅ Auto-refresh with configurable intervals
- ✅ Period controls (15min to 24 hours)
- ✅ Multiple chart types structure
- ✅ Widget persistence in database
- ✅ Responsive grid layout
- ✅ Professional UI with Material Design

Ready for production use! 🎉


