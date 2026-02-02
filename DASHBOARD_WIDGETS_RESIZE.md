# Dashboard Widget Resizing Implementation

## Overview
This document describes the implementation of widget resizing functionality for the dashboard, allowing users to resize and rearrange chart widgets with automatic saving to the database.

## What Was Changed

### 1. Added Angular Gridster2 Library
- **Package**: `angular-gridster2@18.0.0`
- **Purpose**: Provides drag-and-drop and resizable grid layout functionality
- **Installation**: Added to `frontend/package.json` with `--legacy-peer-deps` flag

### 2. Updated Widget Data Structure

**File**: `frontend/src/app/routed/dashboard/services/dashboard.service.ts`

Updated the `Widget` interface to include gridster properties:
```typescript
export interface Widget {
  id: string;
  type: 'line-chart' | 'bar-chart' | 'gauge';
  title: string;
  metricName: string;
  metricId: string;
  objectName: string;
  objectId: string;
  // Gridster item configuration
  x: number;        // Grid X position
  y: number;        // Grid Y position
  cols: number;     // Width in columns (out of 12)
  rows: number;     // Height in rows
  // Legacy support
  position?: { x: number; y: number; w: number; h: number };
}
```

### 3. Dashboard Module Updates

**File**: `frontend/src/app/routed/dashboard/dashboard.module.ts`

- Added `GridsterModule` import and configuration

### 4. Dashboard Component Updates

**File**: `frontend/src/app/routed/dashboard/pages/dashboard/dashboard.page.ts`

#### Gridster Configuration
```typescript
gridsterOptions: GridsterConfig = {
  gridType: 'fit',                    // Fit to container
  displayGrid: 'onDrag&Resize',       // Show grid when dragging/resizing
  pushItems: true,                    // Push other items when moving
  draggable: { enabled: true },       // Enable drag
  resizable: { enabled: true },       // Enable resize
  minCols: 12,                        // 12-column grid system
  maxCols: 12,
  fixedRowHeight: 80,                 // Each row is 80px high
  defaultItemCols: 6,                 // Default widget width: half screen
  defaultItemRows: 5,                 // Default widget height: 400px
  margin: 10,                         // 10px spacing between items
  itemChangeCallback: this.itemChange.bind(this),
  itemResizeCallback: this.itemResize.bind(this)
}
```

#### Key Features
1. **Drag and Drop**: Users can drag widgets to rearrange them
2. **Resizing**: Users can resize widgets by dragging corners/edges
3. **Auto-save**: Changes are automatically saved to the database (debounced by 500ms)
4. **Backwards Compatibility**: Converts old position format to new gridster format

#### New Methods
- `itemChange()`: Called when widget is moved
- `itemResize()`: Called when widget is resized
- `saveDashboardDebounced()`: Debounces save operations to avoid excessive API calls
- `parseDashboardData()`: Enhanced to initialize gridster properties for existing widgets

### 5. Dashboard Template Updates

**File**: `frontend/src/app/routed/dashboard/pages/dashboard/dashboard.page.html`

Changed from simple grid to gridster layout:
```html
<gridster [options]="gridsterOptions">
  <gridster-item [item]="widget" *ngFor="let widget of dashboardData.widgets">
    <app-chart-widget 
      [widget]="widget" 
      [period]="period"
      [autoRefresh]="autoRefresh"
      [refreshInterval]="refreshInterval"
      (removeWidget)="onRemoveWidget($event)">
    </app-chart-widget>
  </gridster-item>
</gridster>
```

### 6. Chart Widget Component Updates

**File**: `frontend/src/app/routed/dashboard/components/chart-widget/chart-widget.component.ts`

#### Responsive Chart Sizing
The chart widget now automatically adjusts to its container size:

1. **Dynamic View Size**: Chart view size is calculated based on container dimensions
2. **Window Resize Listener**: Updates chart size on window resize
3. **ResizeObserver**: Detects gridster item resizing and updates chart accordingly
4. **Minimum Sizes**: Ensures charts maintain readable minimum dimensions (300x250px)

#### Key Methods
- `updateChartSize()`: Calculates and updates chart dimensions based on container
- `ngAfterViewInit()`: Sets up ResizeObserver for gridster item changes
- `onResize()`: Handles window resize events

### 7. Chart Widget Styling Updates

**File**: `frontend/src/app/routed/dashboard/components/chart-widget/chart-widget.component.css`

- Changed widget container to use flexbox layout
- Made chart container fill available space
- Set minimum chart dimensions for readability
- Improved spacing and padding

**File**: `frontend/src/app/routed/dashboard/pages/dashboard/dashboard.page.css`

- Added gridster-specific styling
- Improved visual feedback for dragging/resizing
- Added grid line display during drag operations

### 8. Add Widget Dialog Updates

**File**: `frontend/src/app/routed/dashboard/components/add-widget-dialog/add-widget-dialog.component.ts`

Updated to create widgets with new gridster properties:
```typescript
const widget = {
  // ... other properties
  x: 0,
  y: 0,
  cols: 6,  // Default: half screen width
  rows: 5,  // Default: 400px height (5 rows * 80px)
};
```

## Widget Size System

### Grid System
- **Columns**: 12 (like Bootstrap grid)
- **Row Height**: 80px (fixed)
- **Margin**: 10px between items
- **Outer Margin**: 10px around the grid

### Default Widget Size
- **Width**: 6 columns (50% of screen width)
- **Height**: 5 rows (400px)

### Size Constraints
- **Minimum Width**: 2 columns
- **Maximum Width**: 12 columns (full width)
- **Minimum Height**: 2 rows (160px)
- **Maximum Height**: 100 rows

## Database Storage

Widget configurations are stored in the `dashboards` table (managed by the Go API):

```sql
CREATE TABLE dashboards (
    id UUID PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    data JSONB NOT NULL,  -- Contains widgets array with gridster properties
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

The `data` field contains JSON structure:
```json
{
  "widgets": [
    {
      "id": "widget-abc123",
      "type": "line-chart",
      "title": "CPU Usage",
      "metricName": "cpu_usage",
      "metricId": "metric-uuid",
      "objectName": "Server-01",
      "objectId": "object-uuid",
      "x": 0,
      "y": 0,
      "cols": 6,
      "rows": 5
    }
  ],
  "layout": []
}
```

## API Endpoints Used

The dashboard uses the following API endpoints from `go-api/router/router.go`:

1. **GET /api/dashboards** - List dashboards (filtered by user_id)
2. **GET /api/dashboards/{id}** - Get specific dashboard
3. **POST /api/dashboards** - Create new dashboard
4. **PUT /api/dashboards/{id}** - Update dashboard (saves widget positions/sizes)
5. **DELETE /api/dashboards/{id}** - Delete dashboard (admin only)

Widget resize and position changes trigger PUT requests to update the dashboard data.

## User Experience

### Resizing Widgets
1. Hover over any widget
2. Drag from the bottom-right corner (or edges) to resize
3. Changes are automatically saved after 500ms
4. Chart automatically adjusts to new size

### Moving Widgets
1. Click and hold on any widget
2. Drag to desired position
3. Other widgets will automatically adjust
4. Release to place widget
5. Changes are automatically saved

### Visual Feedback
- Grid lines appear when dragging/resizing
- Widget shadow increases on hover
- Smooth transitions during layout changes

## Chart Improvements

### Bigger Chart Display
1. **Increased Default Size**: Charts now default to 6 columns × 5 rows (larger than before)
2. **Better Space Utilization**: Charts fill their entire container with minimal padding
3. **Responsive Sizing**: Charts automatically adjust to widget size
4. **Minimum Readable Size**: Charts maintain minimum 300×250px for readability

### Chart Features
- Auto-scaling based on data
- Responsive to container changes
- Timeline view with proper date formatting
- Multiple series support
- Legend and axis labels

## Browser Compatibility

The implementation uses:
- **ResizeObserver API**: For detecting widget size changes (supported in modern browsers)
- **Flexbox**: For layout (widely supported)
- **CSS Grid**: For gridster display (widely supported)

Fallback behavior: If ResizeObserver is not available, charts will still resize on window resize events.

## Performance Considerations

1. **Debounced Saving**: Widget changes are debounced (500ms) to avoid excessive API calls
2. **Efficient Updates**: Only modified data is sent to the API
3. **Lazy Chart Updates**: Charts only update when their size actually changes
4. **Minimal Re-renders**: Angular change detection is optimized

## Testing Recommendations

1. **Create Multiple Widgets**: Verify layout with 2-6 widgets
2. **Test Resizing**: Try different widget sizes
3. **Test Dragging**: Move widgets around and verify positions are saved
4. **Test Auto-refresh**: Ensure charts update while maintaining size
5. **Test Browser Resize**: Verify charts adjust to window size changes
6. **Test Data Persistence**: Refresh page and verify widget positions are restored

## Future Enhancements

Potential improvements:
1. Widget templates (predefined sizes)
2. Snap-to-grid improvements
3. Widget duplication
4. Dashboard templates
5. Export/import dashboard configurations
6. Fullscreen widget mode
7. Widget grouping/tabs
8. Custom widget minimum/maximum sizes per type


