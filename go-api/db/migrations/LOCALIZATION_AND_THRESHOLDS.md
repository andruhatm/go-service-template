# Metric Localization and Alert Thresholds

## Overview

Migration `000007_add_descriptions_and_thresholds` adds localization support (Russian) and configurable alert thresholds to all 155 metrics in the system.

## Schema Changes

### New Columns

| Column | Type | Description |
|--------|------|-------------|
| `description_ru` | TEXT | Russian language description of the metric |
| `threshold_critical` | TEXT | Critical alert threshold (P1 - immediate action required) |
| `threshold_warning` | TEXT | Warning alert threshold (P2 - high priority monitoring) |

### Table Structure

```sql
CREATE TABLE metrics_configuration (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    unit VARCHAR(100),
    degradation VARCHAR(100),
    "group" VARCHAR(100),
    description_ru TEXT,                    -- NEW
    threshold_critical TEXT,                -- NEW
    threshold_warning TEXT,                 -- NEW
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Threshold Format

Thresholds are stored as text strings with comparison operators:

### Format Examples

| Format | Meaning | Example Metric |
|--------|---------|----------------|
| `< 95` | Value below 95 is critical | Success rates (%) |
| `> 100` | Value above 100 is critical | Latency (ms) |
| `< -120` | Value below -120 dBm is critical | Signal strength (dBm) |
| `> 10` | Value above 10 is critical | Error rates (%) |

### Degradation Alignment

Thresholds align with the `degradation` column:

- **Lower degradation**: Lower values are worse → `threshold_critical` uses `<` operator
- **Higher degradation**: Higher values are worse → `threshold_critical` uses `>` operator

## Alert Priority Levels

### 🔴 Critical (P1) - Immediate Action Required

Indicates severe service degradation requiring immediate attention.

**Examples:**
- `RRC_Setup_Success_Rate < 95%` - Connection establishment failures
- `Call_Drop_Rate > 2%` - Excessive call drops
- `URLLC_Reliability < 99.9%` - Ultra-reliable service degradation
- `User_Plane_Latency > 50ms` - Severe latency issues

### 🟡 Warning (P2) - High Priority Monitoring

Indicates potential issues requiring close monitoring and proactive measures.

**Examples:**
- `RRC_Setup_Success_Rate < 98%` - Connection quality degrading
- `Call_Drop_Rate > 1%` - Increasing call drops
- `Handover_Success_Rate < 98%` - Mobility issues
- `PRB_Utilization > 85%` - High resource usage

### Threshold Gap

A gap exists between warning and critical thresholds to allow for:
- Early warning before critical situations
- Time to investigate and take corrective action
- Graduated response based on severity

## Localization Coverage

### Language Support

Currently supported: **Russian (RU)**

All 155 metrics include Russian translations covering:

#### Technical Accuracy
- Proper telecommunications terminology
- 3GPP standard term translations
- Industry-recognized Russian technical terms

#### Coverage by Group

| Group | Metrics | Translation Status |
|-------|---------|-------------------|
| Radio Quality | 6 | ✅ Complete |
| Throughput | 6 | ✅ Complete |
| Latency | 4 | ✅ Complete |
| Call/Session Quality | 6 | ✅ Complete |
| 5G Specific | 6 | ✅ Complete |
| Network Performance | 8 | ✅ Complete |
| Accessibility | 10 | ✅ Complete |
| Retainability | 7 | ✅ Complete |
| Mobility | 10 | ✅ Complete |
| Integrity | 8 | ✅ Complete |
| Resource Utilization | 7 | ✅ Complete |
| Capacity | 8 | ✅ Complete |
| Voice Quality | 8 | ✅ Complete |
| 5G Advanced | 10 | ✅ Complete |
| Control Plane | 6 | ✅ Complete |
| User Plane | 9 | ✅ Complete |
| Energy Efficiency | 5 | ✅ Complete |
| QoS | 8 | ✅ Complete |
| Coverage | 6 | ✅ Complete |
| Interference | 6 | ✅ Complete |
| Carrier Aggregation | 5 | ✅ Complete |
| Dual Connectivity | 6 | ✅ Complete |
| **Total** | **155** | **✅ 100%** |

## Usage Examples

### Query Metrics with Russian Descriptions

```sql
SELECT 
    name,
    description_ru,
    unit,
    "group"
FROM metrics_configuration
WHERE "group" = 'Radio Quality'
ORDER BY name;
```

**Result:**
| name | description_ru | unit | group |
|------|---------------|------|-------|
| RSRP | Принятая мощность опорного сигнала - средняя мощность принимаемого сигнала | dBm | Radio Quality |
| RSRQ | Качество принятого опорного сигнала - отношение сигнал/помеха | dB | Radio Quality |
| RSSI | Индикатор уровня принятого сигнала - общая мощность принимаемого сигнала | dBm | Radio Quality |

### Query Metrics with Alert Thresholds

```sql
SELECT 
    name,
    unit,
    degradation,
    threshold_warning,
    threshold_critical
FROM metrics_configuration
WHERE "group" = 'Voice Quality'
ORDER BY name;
```

**Result:**
| name | unit | degradation | threshold_warning | threshold_critical |
|------|------|-------------|-------------------|-------------------|
| VoLTE_Call_Setup_Success_Rate | % | lower | < 98 | < 95 |
| VoLTE_Call_Drop_Rate | % | higher | > 1 | > 2 |
| Voice_MOS | score | lower | < 3.5 | < 3.0 |

### Query Critical Metrics (High Risk)

```sql
SELECT 
    name,
    description_ru,
    threshold_critical,
    unit
FROM metrics_configuration
WHERE name IN (
    'RRC_Setup_Success_Rate',
    'Call_Drop_Rate',
    'URLLC_Reliability',
    'Network_Slice_Availability'
)
ORDER BY name;
```

### Filter Metrics by Threshold Type

```sql
-- Find all metrics where lower values are critical
SELECT name, threshold_critical, unit
FROM metrics_configuration
WHERE threshold_critical LIKE '<%'
ORDER BY "group", name;

-- Find all metrics where higher values are critical
SELECT name, threshold_critical, unit
FROM metrics_configuration
WHERE threshold_critical LIKE '>%'
ORDER BY "group", name;
```

## Implementation Guidelines

### Backend Integration

#### 1. Model Updates

Update your Go model to include new fields:

```go
type MetricConfiguration struct {
    ID               uuid.UUID  `json:"id" db:"id"`
    Name             string     `json:"name" db:"name"`
    Unit             string     `json:"unit" db:"unit"`
    Degradation      string     `json:"degradation" db:"degradation"`
    Group            string     `json:"group" db:"group"`
    DescriptionRu    *string    `json:"description_ru,omitempty" db:"description_ru"`
    ThresholdCritical *string   `json:"threshold_critical,omitempty" db:"threshold_critical"`
    ThresholdWarning  *string   `json:"threshold_warning,omitempty" db:"threshold_warning"`
    CreatedAt        time.Time  `json:"created_at" db:"created_at"`
    UpdatedAt        time.Time  `json:"updated_at" db:"updated_at"`
}
```

#### 2. Threshold Parsing

Utility function to parse and evaluate thresholds:

```go
func EvaluateThreshold(value float64, threshold string) bool {
    threshold = strings.TrimSpace(threshold)
    
    if strings.HasPrefix(threshold, "<") {
        limit, _ := strconv.ParseFloat(strings.TrimSpace(threshold[1:]), 64)
        return value < limit
    }
    
    if strings.HasPrefix(threshold, ">") {
        limit, _ := strconv.ParseFloat(strings.TrimSpace(threshold[1:]), 64)
        return value > limit
    }
    
    return false
}
```

#### 3. Alert Generation

```go
func GenerateAlert(metric MetricConfiguration, currentValue float64) *Alert {
    if metric.ThresholdCritical != nil && 
       EvaluateThreshold(currentValue, *metric.ThresholdCritical) {
        return &Alert{
            Metric:   metric.Name,
            Severity: "critical",
            Value:    currentValue,
            Message:  fmt.Sprintf("%s: %v %s (threshold: %s)", 
                metric.Name, currentValue, metric.Unit, *metric.ThresholdCritical),
        }
    }
    
    if metric.ThresholdWarning != nil && 
       EvaluateThreshold(currentValue, *metric.ThresholdWarning) {
        return &Alert{
            Metric:   metric.Name,
            Severity: "warning",
            Value:    currentValue,
            Message:  fmt.Sprintf("%s: %v %s (threshold: %s)", 
                metric.Name, currentValue, metric.Unit, *metric.ThresholdWarning),
        }
    }
    
    return nil
}
```

### Frontend Integration

#### 1. Localization Support

```typescript
interface MetricConfiguration {
  id: string;
  name: string;
  unit: string;
  degradation: string;
  group: string;
  description_ru?: string;
  threshold_critical?: string;
  threshold_warning?: string;
}

function getLocalizedDescription(
  metric: MetricConfiguration, 
  locale: string
): string {
  if (locale === 'ru' && metric.description_ru) {
    return metric.description_ru;
  }
  return metric.name; // Fallback to English name
}
```

#### 2. Threshold Visualization

```typescript
function getThresholdColor(
  value: number,
  metric: MetricConfiguration
): string {
  if (metric.threshold_critical && 
      evaluateThreshold(value, metric.threshold_critical)) {
    return 'red'; // Critical
  }
  if (metric.threshold_warning && 
      evaluateThreshold(value, metric.threshold_warning)) {
    return 'orange'; // Warning
  }
  return 'green'; // Normal
}

function evaluateThreshold(value: number, threshold: string): boolean {
  threshold = threshold.trim();
  
  if (threshold.startsWith('<')) {
    const limit = parseFloat(threshold.substring(1));
    return value < limit;
  }
  
  if (threshold.startsWith('>')) {
    const limit = parseFloat(threshold.substring(1));
    return value > limit;
  }
  
  return false;
}
```

#### 3. Alert Display Component

```typescript
function AlertBadge({ metric, value }: { 
  metric: MetricConfiguration, 
  value: number 
}) {
  const severity = getAlertSeverity(metric, value);
  
  if (severity === 'critical') {
    return (
      <Badge color="red" icon="🔴">
        Critical: {value} {metric.unit}
      </Badge>
    );
  }
  
  if (severity === 'warning') {
    return (
      <Badge color="orange" icon="🟡">
        Warning: {value} {metric.unit}
      </Badge>
    );
  }
  
  return <Badge color="green" icon="🟢">Normal</Badge>;
}
```

## Extension Opportunities

### Additional Languages

To add more languages:

1. Add new column:
```sql
ALTER TABLE metrics_configuration 
ADD COLUMN description_es TEXT;  -- Spanish
```

2. Populate translations:
```sql
UPDATE metrics_configuration 
SET description_es = 'Potencia de señal de referencia recibida'
WHERE name = 'RSRP';
```

### Additional Threshold Levels

To add more threshold levels:

1. Add columns:
```sql
ALTER TABLE metrics_configuration 
ADD COLUMN threshold_medium TEXT,
ADD COLUMN threshold_low TEXT;
```

2. Populate values based on alert priority guidelines in METRICS_SUMMARY.md

### Complex Threshold Rules

For range-based or multi-condition thresholds:

1. Consider JSON format:
```sql
ALTER TABLE metrics_configuration 
ADD COLUMN threshold_rules JSONB;

UPDATE metrics_configuration 
SET threshold_rules = '{
  "critical": {"operator": "<", "value": 95},
  "warning": {"operator": "<", "value": 98},
  "normal": {"operator": ">=", "value": 98}
}'::jsonb
WHERE name = 'RRC_Setup_Success_Rate';
```

## Best Practices

### Threshold Management

1. **Review Regularly**: Network conditions change; thresholds should be reviewed quarterly
2. **Environment-Specific**: Consider different thresholds for test vs. production
3. **Vendor-Specific**: Some equipment may have different normal operating ranges
4. **Historical Data**: Use historical data to refine thresholds

### Localization

1. **Professional Translation**: Use telecommunications experts for translations
2. **Consistency**: Maintain terminology consistency across all metrics
3. **Context**: Include context in descriptions to disambiguate similar metrics
4. **Updates**: Keep translations in sync when adding new metrics

### Alert Fatigue Prevention

1. **Appropriate Thresholds**: Set thresholds to minimize false positives
2. **Hysteresis**: Implement hysteresis to prevent flapping alerts
3. **Aggregation**: Aggregate similar alerts to reduce noise
4. **Escalation**: Implement gradual escalation (warning → critical)

## Testing

### Threshold Validation

```sql
-- Verify all metrics have thresholds
SELECT name, "group"
FROM metrics_configuration
WHERE threshold_critical IS NULL 
   OR threshold_warning IS NULL;

-- Should return 0 rows
```

### Translation Validation

```sql
-- Verify all metrics have Russian descriptions
SELECT name, "group"
FROM metrics_configuration
WHERE description_ru IS NULL OR description_ru = '';

-- Should return 0 rows
```

### Threshold Logic Validation

```sql
-- Verify thresholds align with degradation direction
-- Lower degradation should use < operator for critical
SELECT name, degradation, threshold_critical
FROM metrics_configuration
WHERE degradation = 'lower' 
  AND threshold_critical NOT LIKE '<%';

-- Higher degradation should use > operator for critical
SELECT name, degradation, threshold_critical
FROM metrics_configuration
WHERE degradation = 'higher' 
  AND threshold_critical NOT LIKE '>%';

-- Both should return 0 rows
```

## Migration Information

- **Migration ID**: 000007
- **Created**: 2026-01-03
- **Metrics Affected**: All 155 metrics
- **Backward Compatible**: Yes (adds columns, doesn't modify existing data)
- **Rollback**: Safe (removes added columns only)

## References

- [METRICS_SUMMARY.md](./METRICS_SUMMARY.md) - Complete metrics overview
- [EXTENDED_METRICS_GUIDE.md](./EXTENDED_METRICS_GUIDE.md) - Detailed metric documentation
- [README.md](./README.md) - Migration system documentation
- 3GPP TS 32.425 - LTE Performance Management
- 3GPP TS 28.552 - 5G Performance Measurements

---

**Document Version**: 1.0  
**Last Updated**: Migration 000007  
**Languages**: Russian (RU)  
**Threshold Levels**: Critical (P1), Warning (P2)


