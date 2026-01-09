# Dashboard Widget Usage Guide

## Quick Start

### Adding a Widget
1. Click the **"Добавить виджет"** (Add Widget) button in the dashboard controls
2. Fill in the widget information:
   - **Title**: Give your widget a descriptive name
   - **Type**: Choose chart type (currently supports line charts)
   - **Monitoring Object**: Select the object to monitor (e.g., Server-01)
   - **Metric**: Select the metric to display (e.g., CPU usage)
3. Click **Save**
4. The new widget will appear on your dashboard

### Resizing a Widget
1. Hover over the widget you want to resize
2. Move your cursor to the bottom-right corner or any edge
3. When the cursor changes to a resize icon, click and drag
4. Release to set the new size
5. Changes are automatically saved

**Size Options:**
- **Minimum Size**: 2 columns × 2 rows (160px × 160px)
- **Maximum Size**: 12 columns × 100 rows (full width)
- **Default Size**: 6 columns × 5 rows (~50% width, 400px height)

### Moving a Widget
1. Click and hold anywhere on the widget (except buttons)
2. Drag the widget to your desired position
3. Other widgets will automatically rearrange
4. Release to place the widget
5. Changes are automatically saved

### Deleting a Widget
1. Click the **×** (close) button in the top-right corner of the widget
2. The widget will be removed immediately
3. Layout will automatically adjust

## Dashboard Controls

### Time Period
Select how far back to display data:
- **15 минут** - Last 15 minutes
- **30 минут** - Last 30 minutes
- **1 час** - Last hour (default)
- **3 часа** - Last 3 hours
- **6 часов** - Last 6 hours
- **12 часов** - Last 12 hours
- **24 часа** - Last 24 hours
- **1 месяц** - Last month
- **3 месяца** - Last 3 months
- **6 месяцев** - Last 6 months

### Auto-Refresh
- **Checkbox**: Enable/disable automatic data refresh
- **Interval Options** (when enabled):
  - 30 сек - Every 30 seconds
  - 1 мин - Every minute (default)
  - 2 мин - Every 2 minutes
  - 5 мин - Every 5 minutes
  - 10 мин - Every 10 minutes

### Manual Refresh
Click the **"Обновить все"** (Refresh All) button to manually refresh all widgets at once.

## Widget Features

### Individual Widget Refresh
Each widget has a refresh button (🔄) in its header to update just that widget.

### Chart Interaction
- **Hover**: View exact values at data points
- **Legend**: Click legend items to show/hide series
- **Zoom**: Charts automatically scale to fit data

### Responsive Design
- Widgets automatically adjust to screen size
- Charts resize to fill available space
- Optimal viewing on desktop, tablet, and mobile

## Grid System

The dashboard uses a 12-column grid system:

### Common Widget Sizes

| Size Description | Columns × Rows | Approximate Dimensions | Use Case |
|-----------------|----------------|------------------------|----------|
| Quarter Screen  | 3 × 3          | 25% width × 240px     | Small KPIs |
| Half Screen     | 6 × 5          | 50% width × 400px     | Default, single metrics |
| Three Quarters  | 9 × 5          | 75% width × 400px     | Detailed charts |
| Full Width      | 12 × 5         | 100% width × 400px    | Wide time-series |
| Tall Chart      | 6 × 8          | 50% width × 640px     | Detailed data |

### Layout Tips
1. **Start with defaults**: New widgets are 6×5 (half screen)
2. **Use full width for time-series**: Set to 12 columns for better timeline visibility
3. **Group related metrics**: Place similar widgets adjacent to each other
4. **Leave room to grow**: Don't fill every space initially

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Cancel drag/resize | ESC |
| Save changes | Automatic |

## Best Practices

### Widget Organization
1. **Priority First**: Place most important metrics at the top
2. **Logical Grouping**: Group related metrics together
3. **Consistent Sizing**: Use similar sizes for comparable metrics
4. **White Space**: Don't overcrowd - leave breathing room

### Performance
1. **Limit Widgets**: Keep 4-8 widgets per dashboard for best performance
2. **Appropriate Periods**: Use shorter periods (1-3 hours) for real-time monitoring
3. **Auto-Refresh**: Disable auto-refresh when not actively monitoring
4. **Longer Intervals**: Use longer refresh intervals (5-10 min) for historical analysis

### Data Selection
1. **Meaningful Titles**: Use descriptive widget titles
2. **Appropriate Metrics**: Choose metrics relevant to your monitoring goals
3. **Multiple Dashboards**: Create separate dashboards for different purposes

## Troubleshooting

### Widget Not Displaying Data
- **Check Period**: Ensure data exists for the selected time period
- **Verify Metric**: Confirm the metric is being collected
- **Refresh**: Try the widget refresh button
- **Check Connection**: Ensure backend API is accessible

### Layout Not Saving
- **Wait for Save**: Changes are debounced (500ms delay)
- **Check Console**: Open browser console for error messages
- **Verify Authentication**: Ensure you're still logged in
- **API Status**: Verify backend API is running

### Slow Performance
- **Reduce Widgets**: Try removing some widgets
- **Increase Interval**: Use longer auto-refresh intervals
- **Shorter Periods**: Query shorter time ranges
- **Clear Cache**: Clear browser cache and reload

### Chart Not Resizing
- **Wait**: Give charts a moment to adjust after resize
- **Refresh Page**: Reload if charts seem stuck
- **Minimum Size**: Ensure widget meets minimum size requirements

## Technical Details

### Auto-Save Behavior
- Changes are saved automatically after 500ms of inactivity
- Multiple rapid changes trigger only one save
- Visual feedback: No explicit save indicator (seamless UX)

### Data Storage
- Widget configurations stored in PostgreSQL database
- Each user has their own dashboard
- Changes persist across sessions and devices
- Widget positions stored as grid coordinates

### Chart Technology
- Uses ngx-charts (based on D3.js)
- Responsive SVG rendering
- Smooth animations and transitions
- Accessible chart interactions

## API Integration

The dashboard integrates with these backend endpoints:

### Dashboard Management
- `GET /api/dashboards` - List your dashboards
- `GET /api/dashboards/{id}` - Get specific dashboard
- `POST /api/dashboards` - Create new dashboard
- `PUT /api/dashboards/{id}` - Update dashboard (auto-called on resize/move)

### Data Queries
- `POST /api/metrics/query` - Query metrics data
- `GET /api/mon-objects` - List monitoring objects
- `GET /api/metrics-catalog` - List available metrics

## Support

For issues or questions:
1. Check this guide first
2. Review the technical documentation (DASHBOARD_WIDGETS_RESIZE.md)
3. Check browser console for errors
4. Contact your system administrator

## Version Information

- **Dashboard Version**: 2.0 (with resizable widgets)
- **Grid System**: angular-gridster2 v18.0.0
- **Chart Library**: @swimlane/ngx-charts v20.5.0
- **Framework**: Angular 18.0.0

