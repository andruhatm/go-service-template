# Dashboard Settings Persistence

## Overview
Dashboard view settings (time period, auto-refresh, and refresh interval) are now persisted in the database along with widget configurations. This means users' preferred settings are preserved across sessions and page reloads.

## What Settings Are Saved

### 1. Time Period (`period`)
- **Type**: Number (seconds)
- **Default**: 3600 (1 hour)
- **Available Options**:
  - 15 minutes (900)
  - 30 minutes (1800)
  - 1 hour (3600)
  - 3 hours (10800)
  - 6 hours (21600)
  - 12 hours (43200)
  - 24 hours (86400)
  - 1 month (2592000)
  - 3 months (7776000)
  - 6 months (15552000)

### 2. Auto-Refresh (`autoRefresh`)
- **Type**: Boolean
- **Default**: false (disabled)
- **Description**: Controls whether widgets automatically refresh their data

### 3. Refresh Interval (`refreshInterval`)
- **Type**: Number (milliseconds)
- **Default**: 60000 (1 minute)
- **Available Options**:
  - 30 seconds (30000)
  - 1 minute (60000)
  - 2 minutes (120000)
  - 5 minutes (300000)
  - 10 minutes (600000)

## Implementation Details

### Data Structure

The dashboard data now includes a `settings` object:

```json
{
  "widgets": [...],
  "layout": [],
  "settings": {
    "period": 3600,
    "autoRefresh": false,
    "refreshInterval": 60000
  }
}
```

### Database Storage

Settings are stored in the `dashboards` table in the `data` JSONB column:

```sql
-- Example dashboard record
{
  "id": "uuid",
  "user_id": "user-uuid",
  "data": {
    "widgets": [...],
    "layout": [],
    "settings": {
      "period": 3600,
      "autoRefresh": false,
      "refreshInterval": 60000
    }
  },
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

## Code Changes

### 1. Dashboard Service (`dashboard.service.ts`)

Updated `DashboardData` interface:

```typescript
export interface DashboardData {
  widgets: Widget[];
  layout: any[];
  // Dashboard settings
  settings?: {
    period?: number;           // Time period in seconds (default: 3600)
    autoRefresh?: boolean;     // Auto-refresh enabled (default: false)
    refreshInterval?: number;  // Refresh interval in milliseconds (default: 60000)
  };
}
```

Updated `getOrCreateDashboard()` to include default settings when creating new dashboards:

```typescript
data: { 
  widgets: [], 
  layout: [],
  settings: {
    period: 3600,
    autoRefresh: false,
    refreshInterval: 60000
  }
}
```

### 2. Dashboard Page Component (`dashboard.page.ts`)

#### Loading Settings

Settings are loaded in `parseDashboardData()`:

```typescript
// Initialize settings if not present
if (!this.dashboardData.settings) {
  this.dashboardData.settings = {
    period: 3600,
    autoRefresh: false,
    refreshInterval: 60000
  };
}

// Load settings into component properties
this.period = this.dashboardData.settings.period || 3600;
this.autoRefresh = this.dashboardData.settings.autoRefresh || false;
this.refreshInterval = this.dashboardData.settings.refreshInterval || 60000;
```

#### Saving Settings

Settings are saved when changed:

```typescript
onPeriodChange(): void {
  console.log('Period changed to:', this.period);
  if (!this.dashboardData.settings) {
    this.dashboardData.settings = {};
  }
  this.dashboardData.settings.period = this.period;
  this.saveDashboardDebounced(); // Debounced save (500ms)
}

onAutoRefreshChange(): void {
  console.log('Auto-refresh toggled:', this.autoRefresh);
  if (!this.dashboardData.settings) {
    this.dashboardData.settings = {};
  }
  this.dashboardData.settings.autoRefresh = this.autoRefresh;
  this.saveDashboardDebounced();
}

onRefreshIntervalChange(): void {
  console.log('Refresh interval changed to:', this.refreshInterval);
  if (!this.dashboardData.settings) {
    this.dashboardData.settings = {};
  }
  this.dashboardData.settings.refreshInterval = this.refreshInterval;
  this.saveDashboardDebounced();
}
```

## User Experience

### Before
- Settings reset to defaults on page reload
- Users had to reconfigure their preferred view settings every session
- No persistence of viewing preferences

### After
- Settings are automatically saved when changed
- Preferred settings persist across browser sessions
- Each user can have their own dashboard configuration
- Settings are restored when returning to the dashboard

## Behavior

### Auto-Save
- Settings changes are automatically saved to the database
- Saves are debounced by 500ms to prevent excessive API calls
- No manual "Save" button required

### Per-User Settings
- Each user has their own dashboard with separate settings
- Settings are isolated per user (not shared)
- Different users can have different preferred time periods and refresh rates

### Backwards Compatibility
- Existing dashboards without settings will use defaults
- Settings object is created on first save if missing
- No migration required for existing data

## API Endpoints Used

Settings persistence uses the existing dashboard API:

- **PUT /api/dashboards/{id}** - Updates dashboard data including settings

Example request body:
```json
{
  "data": {
    "widgets": [...],
    "layout": [],
    "settings": {
      "period": 10800,
      "autoRefresh": true,
      "refreshInterval": 120000
    }
  }
}
```

## Performance Considerations

### Debouncing
- All settings changes are debounced (500ms)
- Multiple rapid changes trigger only one API call
- Reduces server load and database writes

### Minimal Data Transfer
- Only the dashboard `data` field is updated
- Settings are part of the same JSON structure as widgets
- No additional API endpoints or tables required

## Testing Scenarios

### Test Case 1: New User
1. User logs in for the first time
2. Dashboard is created with default settings
3. User changes period to "3 hours"
4. Page is refreshed
5. **Expected**: Period remains "3 hours"

### Test Case 2: Existing Dashboard
1. User has existing dashboard (without settings)
2. Dashboard loads with defaults
3. User enables auto-refresh
4. User refreshes page
5. **Expected**: Auto-refresh is still enabled

### Test Case 3: Multiple Settings Changes
1. User changes period to "6 hours"
2. User enables auto-refresh
3. User sets refresh interval to "5 minutes"
4. All changes debounced and saved together
5. Page refreshed
6. **Expected**: All three settings preserved

### Test Case 4: Different Users
1. User A sets period to "1 hour"
2. User B sets period to "24 hours"
3. Both users refresh their dashboards
4. **Expected**: Each sees their own period setting

## Troubleshooting

### Settings Not Persisting
1. **Check Console**: Look for API errors in browser console
2. **Verify Authentication**: Ensure user is logged in
3. **Check API**: Verify PUT request completes successfully
4. **Database**: Check that `data` JSONB is updated in `dashboards` table

### Settings Reset to Defaults
1. **Check Dashboard Data**: Verify settings object exists in database
2. **Check User ID**: Ensure correct dashboard is loaded for user
3. **Check JSON Format**: Verify settings structure matches expected format

### Auto-Refresh Not Working
1. **Check Setting**: Verify `autoRefresh` is true in settings
2. **Check Interval**: Ensure refresh interval is set
3. **Check Widgets**: Verify widgets are receiving the settings
4. **Check Console**: Look for errors during refresh cycles

## Future Enhancements

Potential additional settings to persist:
1. **Theme preferences** (light/dark mode)
2. **Chart type preferences** (line/bar/gauge defaults)
3. **Display density** (compact/comfortable/spacious)
4. **Time zone** preference
5. **Number format** preferences
6. **Export format** preferences
7. **Dashboard layout** (grid size, margins)

## Migration Notes

### For Existing Deployments
- No database migration required
- Existing dashboards will work without settings
- Settings will be initialized on first save
- No user action required

### For Developers
- Always use `saveDashboardDebounced()` when updating settings
- Check for settings existence before accessing properties
- Provide sensible defaults for missing settings
- Maintain backwards compatibility with old dashboard format

## Related Documentation
- `DASHBOARD_WIDGETS_RESIZE.md` - Widget resizing implementation
- `DASHBOARD_USAGE_GUIDE.md` - User guide for dashboard features
- `DASHBOARD_IMPLEMENTATION.md` - Original dashboard implementation

## API Contract

The dashboard API endpoint expects this structure:

```typescript
// Request
PUT /api/dashboards/{id}
{
  "data": {
    "widgets": Widget[],
    "layout": any[],
    "settings": {
      "period": number,
      "autoRefresh": boolean,
      "refreshInterval": number
    }
  }
}

// Response
{
  "id": string,
  "userId": string,
  "data": {
    "widgets": Widget[],
    "layout": any[],
    "settings": {
      "period": number,
      "autoRefresh": boolean,
      "refreshInterval": number
    }
  },
  "createdAt": string,
  "updatedAt": string
}
```

## Summary

This implementation provides a seamless user experience by persisting dashboard view preferences. Users can now configure their dashboard once and have their settings automatically saved and restored across sessions. The implementation is backwards compatible, performant (with debouncing), and integrates cleanly with the existing dashboard architecture.

