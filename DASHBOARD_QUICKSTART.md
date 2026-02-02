# Dashboard Quick Start Guide

## 🚀 What Was Built

A complete dashboard system with:
- ✅ Auto-refresh controls (30s - 10min intervals)
- ✅ Period selection (15min - 24 hours)
- ✅ Dynamic chart widget creation
- ✅ VictoriaMetrics integration for time-series data
- ✅ Object and metric selection from database
- ✅ Line chart visualization with NGX Charts

## 📦 Installation

### 1. Install Frontend Dependencies

```bash
cd frontend
npm install
```

This will install the new `@swimlane/ngx-charts` package added to `package.json`.

### 2. Ensure VictoriaMetrics is Running

```bash
# If using Docker
docker run -d -p 8428:8428 victoriametrics/victoria-metrics

# Or use existing VictoriaMetrics instance from docker-compose
docker-compose up -d
```

### 3. Start Backend

```bash
cd go-api
go run main.go
```

The backend will:
- Run migration 000008 to create `dashboards` table
- Initialize VictoriaMetrics service
- Expose new metrics query endpoints

### 4. Start Frontend

```bash
cd frontend
npm start
```

Navigate to: `http://localhost:4200`

## 🎯 Usage

### Step 1: Navigate to Dashboard
Click **"Дашборд"** in the header (new tab added)

### Step 2: Configure Period and Auto-Refresh
- **Period:** Select time range (e.g., "1 час")
- **Auto-refresh:** Enable checkbox
- **Interval:** Select refresh rate (e.g., "1 мин")

### Step 3: Add a Widget
1. Click **"Добавить виджет"** button
2. Fill in the form:
   - **Title:** "My Traffic Chart"
   - **Type:** "Линейный график"
   - **Object:** Select from dropdown (e.g., "enb27738")
   - **Metric:** Select from dropdown (e.g., "test1")
3. Click **"Добавить"**

### Step 4: View the Chart
- Widget appears with time-series chart
- Data is queried from VictoriaMetrics
- Chart auto-refreshes based on settings
- Multiple series displayed (actual, forecast, etc.)

### Step 5: Manage Widgets
- **Remove:** Click ❌ button on widget
- **Refresh All:** Click "Обновить все" button
- **Change Period:** Select different period from dropdown
- Widgets automatically update

## 📊 Sample Data Format

VictoriaMetrics expects data in this format:
```
test1{name="enb27738", type="actual"} 42 1767533671
test1{name="enb27738", type="forecast"} 50 1767534971
```

Where:
- `test1` = metric name
- `name="enb27738"` = object name
- `type="actual"` = series type
- `42` = value
- `1767533671` = timestamp (Unix seconds)

## 🔧 API Endpoints

### Query Metrics (POST)
```bash
curl -X POST http://localhost:8081/api/metrics/query \
  -H "Content-Type: application/json" \
  -d '{
    "metricName": "test1",
    "objectName": "enb27738",
    "startTime": 1767530071,
    "endTime": 1767533671,
    "step": 60
  }'
```

### List Monitoring Objects (GET)
```bash
curl http://localhost:8081/api/mon-objects
```

### List Metrics (GET)
```bash
curl http://localhost:8081/api/metrics-catalog
```

### Get Dashboards (GET)
```bash
curl http://localhost:8081/api/dashboards?user_id={userId}
```

## 📁 File Structure

```
go-api/
├── handlers/
│   ├── metrics_query_handler.go  ← NEW: VictoriaMetrics queries
│   ├── dashboard_handler.go
│   └── ...
├── db/migrations/
│   ├── 000008_create_dashboards_table.up.sql  ← NEW
│   └── 000008_create_dashboards_table.down.sql
└── router/router.go  ← UPDATED: Added metrics endpoints

frontend/src/app/routed/dashboard/
├── components/
│   ├── add-widget-dialog/  ← NEW: Widget creation dialog
│   │   ├── add-widget-dialog.component.ts
│   │   ├── add-widget-dialog.component.html
│   │   └── add-widget-dialog.component.css
│   └── chart-widget/  ← NEW: Chart display component
│       ├── chart-widget.component.ts
│       ├── chart-widget.component.html
│       └── chart-widget.component.css
├── pages/dashboard/  ← UPDATED: Added controls & widget management
│   ├── dashboard.page.ts
│   ├── dashboard.page.html
│   └── dashboard.page.css
├── services/
│   └── dashboard.service.ts  ← UPDATED: Added metrics query
└── dashboard.module.ts  ← UPDATED: Added NGX Charts
```

## 🎨 Features

### Dashboard Controls
- **Period Selector:** 7 options from 15min to 24 hours
- **Auto-refresh Toggle:** Enable/disable automatic updates
- **Refresh Interval:** 5 options from 30sec to 10min
- **Add Widget Button:** Create new chart widgets
- **Refresh All Button:** Force refresh all widgets

### Widget Features
- **Line Chart Visualization:** Using NGX Charts library
- **Multiple Series Support:** Shows actual, forecast, etc.
- **Auto-refresh:** Individual widget auto-updates
- **Manual Refresh:** Button to refresh single widget
- **Remove Widget:** Delete button on each widget
- **Loading States:** Spinner during data load
- **Error Handling:** Clear error messages

### Data Features
- **Real-time Queries:** Direct VictoriaMetrics integration
- **Adaptive Step:** Automatically calculates optimal step size
- **Time Range Control:** User-configurable period
- **Persistent Storage:** Widgets saved to database

## 🔍 Testing

### Test Widget Creation
1. Navigate to dashboard
2. Click "Добавить виджет"
3. Verify objects and metrics load in dropdowns
4. Create widget
5. Verify widget appears in grid

### Test Data Query
1. Create widget with known metric
2. Check browser console for query request
3. Verify chart displays data
4. Change period and verify chart updates

### Test Auto-Refresh
1. Enable auto-refresh
2. Select 30-second interval
3. Watch widget update every 30 seconds
4. Check browser console for automatic queries

### Test Persistence
1. Create 2-3 widgets
2. Refresh page
3. Verify widgets are still there
4. Remove a widget
5. Refresh page
6. Verify widget is gone

## ⚠️ Troubleshooting

### Widgets Not Loading
- Check backend is running on port 8081
- Verify VictoriaMetrics is accessible
- Check browser console for errors

### No Data in Charts
- Verify VictoriaMetrics has data for selected metric/object
- Check time range includes actual data points
- View Network tab in DevTools for API responses

### Auto-Refresh Not Working
- Enable auto-refresh checkbox
- Verify refresh interval is selected
- Check console for subscription errors

### Objects/Metrics Not Loading in Dialog
- Verify mon_objects table has data
- Verify metrics_configuration table has data
- Check API endpoints return data

## 📝 Next Steps

1. **Add Sample Data to VictoriaMetrics:**
```bash
curl -X POST http://localhost:8428/api/v1/import/prometheus \
  -d 'test1{name="enb27738",type="actual"} 42
test1{name="enb27738",type="forecast"} 50'
```

2. **Create Monitoring Objects:**
- Use existing objects from mon_objects table
- Or create via admin panel

3. **Configure Metrics:**
- Use existing metrics from metrics_configuration
- Or add new ones via metrics catalog

4. **Build Dashboard:**
- Add multiple widgets
- Configure different periods
- Enable auto-refresh
- Share with team

## 🎉 Success!

You now have a fully functional dashboard with:
- Dynamic widget creation
- Real-time data visualization
- Auto-refresh capabilities
- VictoriaMetrics integration
- Professional UI

Ready to monitor your metrics! 📈


