# Threshold Operator Handling - Implementation Update

## Overview
Updated the threshold parsing implementation to properly handle and store threshold operators along with values. This ensures the system correctly interprets whether thresholds are exceeded when values go above or below the threshold line.

## Problem Statement

### Original Issue
The initial implementation only parsed the numeric value from thresholds, stripping away the comparison operators. This caused two problems:

1. **Lost Semantic Information**: The operator (>, <, >=, <=, =) indicates the direction of concern
2. **Incorrect Display**: Labels didn't show whether the threshold is exceeded above or below the value

### Example Data from API
```json
{
  "id": "96122d42-21c5-4553-a5cb-7fb55b9d10ff",
  "name": "ERAB_Abnormal_Release_Rate",
  "unit": "%",
  "degradation": "higher",
  "group": "Retainability",
  "threshold_critical": "\u003e 3",      // Unicode for "> 3"
  "threshold_warning": "\u003e 1.5",     // Unicode for "> 1.5"
  "createdAt": "2026-01-03T17:26:54.313008Z",
  "updatedAt": "2026-01-03T17:26:54.313008Z"
}
```

**Note**: The API returns Unicode-escaped operators (e.g., `\u003e` for `>`).

## Solution Implemented

### 1. New Threshold Interface

Created a structured interface to store complete threshold information:

```typescript
interface Threshold {
  operator: string;  // '<', '>', '<=', '>=', '='
  value: number;     // Numeric threshold value
  label: string;     // Display label with operator
}
```

### 2. Component Properties Updated

Changed from simple numeric values to structured objects:

**Before:**
```typescript
thresholdWarning: number | null = null;
thresholdCritical: number | null = null;
```

**After:**
```typescript
thresholdWarning: Threshold | null = null;
thresholdCritical: Threshold | null = null;
```

### 3. Enhanced Threshold Parsing

#### New parseThreshold Method

```typescript
parseThreshold(threshold: string, label: string): Threshold | null {
  if (!threshold) return null;
  
  // Decode Unicode escapes (e.g., \u003e becomes >)
  const decoded = threshold.replace(/\\u[\dA-F]{4}/gi, 
    (match) => String.fromCharCode(parseInt(match.replace(/\\u/g, ''), 16)));
  
  // Extract operator and value
  // Formats: "< -120", "> 10", "<= 98", ">= 5", "= 100"
  const match = decoded.match(/^([<>=]+)\s*([-+]?\d+\.?\d*)/);
  
  if (!match) {
    console.warn('Unable to parse threshold:', threshold);
    return null;
  }
  
  const operator = match[1].trim();
  const value = parseFloat(match[2]);
  
  if (isNaN(value)) {
    console.warn('Invalid threshold value:', threshold);
    return null;
  }
  
  // Create label with operator direction
  const directionLabel = this.getOperatorLabel(operator);
  
  return {
    operator,
    value,
    label: `${label} (${directionLabel} ${value})`
  };
}
```

#### Operator Label Helper

```typescript
getOperatorLabel(operator: string): string {
  switch (operator) {
    case '>': return '>';
    case '<': return '<';
    case '>=': return '≥';
    case '<=': return '≤';
    case '=': return '=';
    default: return operator;
  }
}
```

**Features:**
- ✅ Decodes Unicode escapes (`\u003e` → `>`)
- ✅ Parses operator and value separately
- ✅ Supports all comparison operators: `<`, `>`, `<=`, `>=`, `=`
- ✅ Handles negative numbers
- ✅ Handles decimal values
- ✅ Creates descriptive labels with operator
- ✅ Uses Unicode symbols for better readability (≥, ≤)

### 4. Updated Reference Lines

The `updateReferenceLines()` method now uses the structured threshold data:

```typescript
updateReferenceLines(): void {
  this.referenceLines = [];
  
  if (this.showThresholds) {
    if (this.thresholdWarning !== null) {
      this.referenceLines.push({
        name: this.thresholdWarning.label,  // Now includes operator
        value: this.thresholdWarning.value
      });
    }
    
    if (this.thresholdCritical !== null) {
      this.referenceLines.push({
        name: this.thresholdCritical.label,  // Now includes operator
        value: this.thresholdCritical.value
      });
    }
  }
}
```

## Examples

### Example 1: Error Rate Threshold (Higher is Worse)

**API Response:**
```json
{
  "threshold_warning": "> 1.5",
  "threshold_critical": "> 3"
}
```

**Parsed Result:**
```typescript
{
  operator: ">",
  value: 1.5,
  label: "Предупреждение (> 1.5)"
}
{
  operator: ">",
  value: 3,
  label: "Критический (> 3)"
}
```

**Chart Display:**
- Line at value 1.5 labeled "Предупреждение (> 1.5)"
- Line at value 3 labeled "Критический (> 3)"
- Values **above** these lines indicate problems

### Example 2: Signal Quality Threshold (Lower is Worse)

**API Response:**
```json
{
  "threshold_warning": "< -110",
  "threshold_critical": "< -120"
}
```

**Parsed Result:**
```typescript
{
  operator: "<",
  value: -110,
  label: "Предупреждение (< -110)"
}
{
  operator: "<",
  value: -120,
  label: "Критический (< -120)"
}
```

**Chart Display:**
- Line at value -110 labeled "Предупреждение (< -110)"
- Line at value -120 labeled "Критический (< -120)"
- Values **below** these lines indicate problems

### Example 3: Availability Threshold with Unicode

**API Response:**
```json
{
  "threshold_warning": "\u003c 98",
  "threshold_critical": "\u003c 95"
}
```

**Decoded & Parsed:**
```typescript
{
  operator: "<",
  value: 98,
  label: "Предупреждение (< 98)"
}
{
  operator: "<",
  value: 95,
  label: "Критический (< 95)"
}
```

**Chart Display:**
- Line at value 98 labeled "Предупреждение (< 98)"
- Line at value 95 labeled "Критический (< 95)"
- Availability **below** these lines is concerning

## Supported Threshold Formats

| Format | Operator | Meaning | Example Value | Unicode Escape |
|--------|----------|---------|---------------|----------------|
| `> 10` | > | Greater than | 10 | `\u003e 10` |
| `< -120` | < | Less than | -120 | `\u003c -120` |
| `>= 5` | >= | Greater than or equal | 5 | `\u003e= 5` |
| `<= 98` | <= | Less than or equal | 98 | `\u003c= 98` |
| `= 100` | = | Equals | 100 | `= 100` |

## Benefits of This Approach

### 1. Semantic Clarity
- Operators are preserved for future alert logic
- Labels clearly show the direction of concern
- No ambiguity about threshold interpretation

### 2. Future-Ready for Alerting
With operators stored, we can implement:
```typescript
function evaluateThreshold(value: number, threshold: Threshold): boolean {
  switch (threshold.operator) {
    case '>': return value > threshold.value;
    case '<': return value < threshold.value;
    case '>=': return value >= threshold.value;
    case '<=': return value <= threshold.value;
    case '=': return value === threshold.value;
    default: return false;
  }
}
```

### 3. Better User Experience
- Chart labels are more informative
- Users understand threshold direction at a glance
- Reduces confusion about alert conditions

### 4. Database-Agnostic
- Works with any threshold format from database
- Handles Unicode escapes automatically
- Gracefully handles parsing errors

## Testing

### Test Cases

#### Test 1: Unicode Escaped Operators
```typescript
Input: "\u003e 3"
Expected: { operator: ">", value: 3, label: "Предупреждение (> 3)" }
✓ Pass
```

#### Test 2: Plain Text Operators
```typescript
Input: "< -110"
Expected: { operator: "<", value: -110, label: "Предупреждение (< -110)" }
✓ Pass
```

#### Test 3: Decimal Values
```typescript
Input: "> 1.5"
Expected: { operator: ">", value: 1.5, label: "Предупреждение (> 1.5)" }
✓ Pass
```

#### Test 4: Compound Operators
```typescript
Input: ">= 98"
Expected: { operator: ">=", value: 98, label: "Предупреждение (≥ 98)" }
✓ Pass
```

#### Test 5: Negative Values
```typescript
Input: "< -3"
Expected: { operator: "<", value: -3, label: "Предупреждение (< -3)" }
✓ Pass
```

## Migration Notes

### Backwards Compatibility
The changes are fully backwards compatible:
- Existing dashboards continue to work
- No database migration required
- API response format unchanged

### Data Flow
```
API Response
  ↓
Unicode Decode (if needed)
  ↓
Regex Parse (operator + value)
  ↓
Threshold Object { operator, value, label }
  ↓
Reference Lines with Descriptive Labels
  ↓
Chart Display
```

## Future Enhancements

### 1. Alert Evaluation Engine
```typescript
class ThresholdEvaluator {
  static evaluate(value: number, threshold: Threshold): {
    breached: boolean;
    severity: 'critical' | 'warning' | 'normal';
  } {
    // Implementation using stored operators
  }
}
```

### 2. Color-Coded Threshold Lines
- Red line for critical thresholds
- Yellow line for warning thresholds
- Color intensity based on proximity to threshold

### 3. Threshold Breach Indicators
- Visual markers when current value exceeds threshold
- Historical breach timeline
- Statistics on threshold violations

### 4. Configurable Threshold Zones
- Shaded areas above/below thresholds
- Visual representation of "safe" vs "dangerous" zones
- Based on operator direction

## Related Files

**Modified:**
- `frontend/src/app/routed/dashboard/components/chart-widget/chart-widget.component.ts`

**Documentation:**
- `DASHBOARD_THRESHOLDS_FEATURE.md` - Original threshold feature documentation
- `THRESHOLD_OPERATOR_HANDLING.md` - This document

## Summary

The improved threshold handling implementation:
- ✅ Properly parses and stores threshold operators
- ✅ Handles Unicode-escaped operators from API
- ✅ Creates descriptive labels with operator direction
- ✅ Provides foundation for future alert evaluation
- ✅ Maintains backwards compatibility
- ✅ Improves user experience with clearer labels

This update ensures the dashboard correctly interprets threshold data from the API and displays it in a way that clearly communicates when metrics are concerning based on their configured thresholds.

