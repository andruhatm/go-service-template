# Dashboard Thresholds Display Feature

## Overview
The dashboard now supports displaying warning and critical threshold lines on chart widgets. This feature helps users quickly identify when metrics exceed or fall below configured threshold values, making it easier to spot potential issues.

## What Was Implemented

### 1. Show Thresholds Control
A new toggle control "Показать пороги" (Show Thresholds) has been added to the dashboard controls panel. This setting:
- Is persisted in the database per user
- Applies to all widgets on the dashboard
- Can be toggled on/off at any time
- Default state: OFF (disabled)

### 2. Threshold Data Source
Thresholds are fetched from the `metrics_configuration` table which contains:
- **threshold_warning**: Warning level threshold (e.g., "< -110", "> 5")
- **threshold_critical**: Critical level threshold (e.g., "< -120", "> 10")

These thresholds are configured per metric and follow 3GPP standards.

### 3. Visual Display
When enabled, threshold lines appear on line charts as:
- **Warning Threshold** (Предупреждение): Horizontal reference line
- **Critical Threshold** (Критический): Horizontal reference line
- Lines are labeled and clearly visible on the chart
- Lines adjust automatically with chart resizing

## Implementation Details

### Data Structure

#### Dashboard Settings
The `DashboardData` interface now includes `showThresholds`:

```typescript
export interface DashboardData {
  widgets: Widget[];
  layout: any[];
  settings?: {
    period?: number;
    autoRefresh?: boolean;
    refreshInterval?: number;
    showThresholds?: boolean;  // NEW: Show threshold lines
  };
}
```

#### Threshold Format in Database
Thresholds are stored as TEXT in the format:
- **Comparison operator + value**: `< -120`, `> 10`, `< 98`
- **Parsed to numeric value** for display

Example from database:
```sql
SELECT name, threshold_warning, threshold_critical 
FROM metrics_configuration 
WHERE name = 'RSRP';

-- Result:
-- name: RSRP
-- threshold_warning: < -110
-- threshold_critical: < -120
```

### Code Changes

#### 1. Dashboard Service (`dashboard.service.ts`)

Added `showThresholds` to settings:
```typescript
settings?: {
  period?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
  showThresholds?: boolean;  // Default: false
};
```

#### 2. Dashboard Page Component (`dashboard.page.ts`)

**New Properties:**
```typescript
showThresholds: boolean = false;
```

**Settings Management:**
```typescript
// Load from database
this.showThresholds = this.dashboardData.settings.showThresholds || false;

// Save on change
onShowThresholdsChange(): void {
  this.dashboardData.settings.showThresholds = this.showThresholds;
  this.saveDashboardDebounced();
}
```

#### 3. Dashboard Template (`dashboard.page.html`)

**Added Toggle Control:**
```html
<div class="control-group">
  <label>
    <input type="checkbox" 
           [(ngModel)]="showThresholds" 
           (change)="onShowThresholdsChange()">
    Показать пороги
  </label>
</div>
```

**Pass to Widgets:**
```html
<app-chart-widget 
  [widget]="widget" 
  [period]="period"
  [autoRefresh]="autoRefresh"
  [refreshInterval]="refreshInterval"
  [showThresholds]="showThresholds"
  (removeWidget)="onRemoveWidget($event)">
</app-chart-widget>
```

#### 4. Chart Widget Component (`chart-widget.component.ts`)

**New Properties:**
```typescript
@Input() showThresholds: boolean = false;

thresholdWarning: number | null = null;
thresholdCritical: number | null = null;
referenceLines: any[] = [];
```

**Threshold Loading:**
```typescript
loadThresholds(): void {
  if (!this.showThresholds || !this.widget.metricId) {
    this.referenceLines = [];
    return;
  }

  this.http.get<any>(`http://localhost:8081/api/metrics-catalog/${this.widget.metricId}`)
    .subscribe({
      next: (metric) => {
        if (metric.threshold_warning) {
          this.thresholdWarning = this.parseThreshold(metric.threshold_warning);
        }
        if (metric.threshold_critical) {
          this.thresholdCritical = this.parseThreshold(metric.threshold_critical);
        }
        this.updateReferenceLines();
      }
    });
}
```

**Threshold Parsing:**
```typescript
parseThreshold(threshold: string): number | null {
  if (!threshold) return null;
  
  // Remove operators and parse number
  // Formats: "< -120", "> 10", "< 98", etc.
  const cleaned = threshold.replace(/[<>]/g, '').trim();
  const value = parseFloat(cleaned);
  
  return isNaN(value) ? null : value;
}
```

**Reference Lines Update:**
```typescript
updateReferenceLines(): void {
  this.referenceLines = [];
  
  if (this.showThresholds) {
    if (this.thresholdWarning !== null) {
      this.referenceLines.push({
        name: 'Предупреждение',
        value: this.thresholdWarning
      });
    }
    
    if (this.thresholdCritical !== null) {
      this.referenceLines.push({
        name: 'Критический',
        value: this.thresholdCritical
      });
    }
  }
}
```

**Change Detection:**
```typescript
ngOnChanges(changes: SimpleChanges): void {
  if (changes['showThresholds'] && !changes['showThresholds'].firstChange) {
    this.loadThresholds();
  }
}
```

#### 5. Chart Template (`chart-widget.component.html`)

**Added Reference Lines:**
```html
<ngx-charts-line-chart
  [view]="view"
  [scheme]="colorScheme"
  [results]="chartData"
  ...
  [referenceLines]="referenceLines"
  [showRefLines]="showThresholds"
  [showRefLabels]="showThresholds">
</ngx-charts-line-chart>
```

## User Experience

### How to Use

1. **Enable Thresholds**
   - Open the dashboard
   - Locate the "Показать пороги" (Show Thresholds) checkbox
   - Check the box to enable threshold display

2. **View Thresholds**
   - Threshold lines appear on all chart widgets
   - Warning threshold (if configured)
   - Critical threshold (if configured)
   - Lines are labeled with their names

3. **Disable Thresholds**
   - Uncheck the "Показать пороги" box
   - Threshold lines disappear from all charts
   - Setting is saved automatically

### Visual Examples

#### Without Thresholds
```
Chart showing only metric data lines
```

#### With Thresholds Enabled
```
Chart showing:
- Metric data lines (colored)
- Warning threshold line (labeled "Предупреждение")
- Critical threshold line (labeled "Критический")
```

## API Integration

### Endpoint Used
```
GET /api/metrics-catalog/{metricId}
```

### Response Example
```json
{
  "id": "uuid",
  "name": "RSRP",
  "unit": "dBm",
  "degradation": "LM",
  "group": "Radio Quality",
  "threshold_warning": "< -110",
  "threshold_critical": "< -120",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

## Threshold Interpretation

### Threshold Format Examples

| Format | Meaning | Parsed Value | Alert When |
|--------|---------|--------------|------------|
| `< -120` | Less than -120 | -120 | value < -120 |
| `> 10` | Greater than 10 | 10 | value > 10 |
| `< 98` | Less than 98% | 98 | value < 98 |
| `> 5` | Greater than 5% | 5 | value > 5 |

### Common Metrics and Their Thresholds

#### Radio Quality Metrics

**RSRP (Reference Signal Received Power)**
- Warning: < -110 dBm
- Critical: < -120 dBm

**RSRQ (Reference Signal Received Quality)**
- Warning: < -15 dB
- Critical: < -20 dB

**SINR (Signal to Interference plus Noise Ratio)**
- Warning: < 5 dB
- Critical: < -3 dB

#### Error Rate Metrics

**BLER (Block Error Rate)**
- Warning: > 5%
- Critical: > 10%

**Packet Loss Rate**
- Warning: > 1%
- Critical: > 2%

#### Throughput Metrics

**DL_Throughput (Downlink Throughput)**
- Warning: < 10 Mbps
- Critical: < 5 Mbps

## Performance Considerations

### API Calls
- Thresholds are loaded once per widget when enabled
- Cached in component memory
- Only reloaded when `showThresholds` changes
- No performance impact when disabled

### Chart Rendering
- Reference lines are native to ngx-charts
- Minimal performance overhead
- Lines scale and resize with chart

### Database Impact
- Setting stored in existing `dashboards` table
- No additional database tables
- Uses existing JSONB `data` column

## Browser Compatibility

The threshold display feature works on all modern browsers:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## Troubleshooting

### Thresholds Not Displaying

**Issue**: Toggle is enabled but no lines appear

**Possible Causes**:
1. **Metric has no configured thresholds**
   - Check database: `SELECT threshold_warning, threshold_critical FROM metrics_configuration WHERE id = '{metricId}'`
   - Solution: Configure thresholds for the metric

2. **API error loading thresholds**
   - Check browser console for errors
   - Verify metric catalog API is accessible
   - Solution: Fix API connectivity or permissions

3. **Invalid threshold format**
   - Check database threshold format
   - Must be in format: `< value` or `> value`
   - Solution: Update threshold format in database

### Wrong Threshold Values

**Issue**: Threshold lines appear at incorrect values

**Possible Causes**:
1. **Incorrect database values**
   - Verify threshold values in database
   - Solution: Update thresholds in metrics configuration

2. **Parsing error**
   - Check console for parsing errors
   - Verify threshold format
   - Solution: Fix threshold format

### Performance Issues

**Issue**: Dashboard feels slow with thresholds enabled

**Possible Causes**:
1. **Too many widgets**
   - Each widget makes an API call for thresholds
   - Solution: Reduce number of widgets or implement caching

2. **Slow API response**
   - Check API response times
   - Solution: Optimize metrics catalog API queries

## Testing Scenarios

### Test Case 1: Enable Thresholds
1. Open dashboard
2. Enable "Показать пороги"
3. **Expected**: 
   - Setting saved to database
   - Threshold lines appear on charts
   - Lines are labeled

### Test Case 2: Disable Thresholds
1. Dashboard with thresholds enabled
2. Disable "Показать пороги"
3. **Expected**:
   - Setting saved to database
   - Threshold lines disappear
   - Charts show only data

### Test Case 3: Metric Without Thresholds
1. Add widget for metric without configured thresholds
2. Enable "Показать пороги"
3. **Expected**:
   - No errors in console
   - Chart displays normally without threshold lines

### Test Case 4: Persistence
1. Enable thresholds
2. Refresh browser
3. **Expected**:
   - Thresholds still enabled
   - Lines visible on charts

### Test Case 5: Multiple Users
1. User A enables thresholds
2. User B has their own dashboard
3. **Expected**:
   - User A sees thresholds
   - User B's setting is independent
   - Each user has their own preference

## Future Enhancements

Potential improvements:
1. **Color-coded thresholds** - Different colors for warning vs critical
2. **Threshold alerts** - Visual indicators when thresholds are breached
3. **Threshold history** - Show when thresholds were breached historically
4. **Custom thresholds** - Allow users to override default thresholds per widget
5. **Threshold notifications** - Email/SMS alerts when thresholds are breached
6. **Threshold statistics** - Show % of time above/below thresholds
7. **Multiple threshold levels** - Support more than 2 levels
8. **Dynamic thresholds** - Thresholds that adjust based on time of day or historical patterns

## Related Documentation

- `DASHBOARD_WIDGETS_RESIZE.md` - Widget resizing implementation
- `DASHBOARD_SETTINGS_PERSISTENCE.md` - Dashboard settings persistence
- `DASHBOARD_USAGE_GUIDE.md` - User guide for dashboard features
- `go-api/db/migrations/MIGRATION_000007_SUMMARY.md` - Threshold database schema

## Database Schema

### Metrics Configuration Table
```sql
CREATE TABLE metrics_configuration (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    unit VARCHAR(100),
    degradation VARCHAR(100),
    "group" VARCHAR(100),
    threshold_critical TEXT,    -- e.g., "< -120"
    threshold_warning TEXT,     -- e.g., "< -110"
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

### Dashboard Configuration
```json
{
  "widgets": [...],
  "layout": [],
  "settings": {
    "period": 3600,
    "autoRefresh": false,
    "refreshInterval": 60000,
    "showThresholds": false
  }
}
```

## Summary

The threshold display feature provides users with clear visual indicators of metric health by showing configured warning and critical threshold lines on charts. This makes it easier to:
- Quickly identify potential issues
- Understand metric context
- Monitor service quality against standards
- Make informed decisions about system health

The feature is fully integrated with the existing dashboard infrastructure, persists user preferences, and works seamlessly with all other dashboard features including resizing, auto-refresh, and period selection.

