# Metrics Configuration Group Column - Migration Summary

## Overview

This document summarizes the changes made to add a `group` column to the `metrics_configuration` table, organizing 3GPP metrics into logical categories based on 3GPP telecommunications standards (TS 32.425 and TS 28.552).

## Changes Made

### 1. Updated Migration 000003 (create_metrics_configuration_table)

**File**: `000003_create_metrics_configuration_table.up.sql`

Added the `group` column to the initial table creation:
- Added `"group" VARCHAR(100)` column definition
- Added index `idx_metrics_configuration_group` for query optimization

**File**: `000003_create_metrics_configuration_table.down.sql`

Updated to drop the group index when rolling back.

### 2. Updated Migration 000004 (seed_3gpp_metrics)

**File**: `000004_seed_3gpp_metrics.up.sql`

Updated all INSERT statements to include the `group` value for each metric:
- Radio Quality (6 metrics)
- Throughput (6 metrics)
- Latency (4 metrics)
- Call/Session Quality (6 metrics)
- 5G Specific (6 metrics)
- Network Performance (8 metrics)

**File**: `000004_seed_3gpp_metrics.down.sql`

No changes needed - deletion by name remains the same.

### 3. Created Migration 000005 (add_group_to_metrics_configuration)

**File**: `000005_add_group_to_metrics_configuration.up.sql`

Migration for backward compatibility with existing databases:
- Adds `group` column using `IF NOT EXISTS` (safe for both new and existing databases)
- Creates index using `IF NOT EXISTS`
- Updates all existing metrics with appropriate group values

**File**: `000005_add_group_to_metrics_configuration.down.sql`

Rollback script that:
- Drops the group index
- Removes the group column

### 4. Created Documentation

**File**: `METRICS_GROUPS.md`

Comprehensive documentation including:
- Detailed description of each metric group
- All metrics with their definitions and units
- Database schema details
- Query examples
- API integration guidance
- 3GPP standards references

**File**: `README.md` (updated)

Added complete documentation for migrations 000002-000005.

## Metric Groups

The 36 3GPP metrics are now organized into 6 groups:

| Group | Metric Count | Examples |
|-------|--------------|----------|
| Radio Quality | 6 | RSRP, RSRQ, SINR |
| Throughput | 6 | DL_Throughput, UL_Throughput |
| Latency | 4 | Latency, Jitter, RTT |
| Call/Session Quality | 6 | Call_Drop_Rate, Handover_Success_Rate |
| 5G Specific | 6 | SS-RSRP, CSI-RSRP |
| Network Performance | 8 | Active_Users, Cell_Availability |

## Migration Strategy

### New Installations
The migrations run in sequence and everything is created correctly from the start:
1. **000003** creates table with `group` column
2. **000004** inserts metrics with group values
3. **000005** is effectively a no-op (safe to run)

### Existing Installations
For databases that already ran migrations 000003 and 000004 before this update:
1. **000005** adds the missing `group` column and populates it

Both scenarios are handled safely using `IF NOT EXISTS` clauses.

## Database Schema Changes

### Before
```sql
CREATE TABLE metrics_configuration (
    id UUID PRIMARY KEY,
    name VARCHAR(255) UNIQUE,
    unit VARCHAR(100),
    degradation VARCHAR(100),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

### After
```sql
CREATE TABLE metrics_configuration (
    id UUID PRIMARY KEY,
    name VARCHAR(255) UNIQUE,
    unit VARCHAR(100),
    degradation VARCHAR(100),
    "group" VARCHAR(100),        -- NEW
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE INDEX idx_metrics_configuration_group ON metrics_configuration("group");  -- NEW
```

## Testing

### Verify Migration Status
```bash
# Check current migration version
docker exec go-service-template-db-1 psql -U user -d appdb -c "SELECT * FROM schema_migrations;"
```

### Verify Metrics with Groups
```sql
-- Count metrics by group
SELECT "group", COUNT(*) as count 
FROM metrics_configuration 
GROUP BY "group" 
ORDER BY count DESC;

-- Expected result:
-- Network Performance: 8
-- Radio Quality: 6
-- Throughput: 6
-- Call/Session Quality: 6
-- 5G Specific: 6
-- Latency: 4
```

### Verify All Metrics Have Groups
```sql
-- Should return 0
SELECT COUNT(*) FROM metrics_configuration WHERE "group" IS NULL;
```

## API Usage Examples

### Get Metrics by Group
```bash
# Example API endpoint (to be implemented)
GET /api/metrics?group=Radio%20Quality
```

### Get All Groups
```bash
# Example API endpoint (to be implemented)
GET /api/metrics/groups
```

### Expected Response
```json
{
  "groups": [
    "Radio Quality",
    "Throughput",
    "Latency",
    "Call/Session Quality",
    "5G Specific",
    "Network Performance"
  ]
}
```

## Standards Compliance

The grouping follows 3GPP standards:
- **TS 32.425**: Performance Management (PM) for UMTS and LTE
- **TS 28.552**: Management and orchestration; 5G performance measurements

This ensures compliance with industry standards for network monitoring and performance analysis.

## Rollback

If needed, rollback the migrations in reverse order:

```bash
# Rollback to version 4 (removes group column and updates)
migrate -path db/migrations -database "postgres://..." down 1

# Rollback to version 3 (removes all metrics)
migrate -path db/migrations -database "postgres://..." down 1

# And so on...
```

## Next Steps

### Backend
1. Update Go models to include the `group` field
2. Add group filtering to API endpoints
3. Add endpoint to retrieve distinct groups
4. Update API documentation

### Frontend
1. Add group filter dropdown in metrics configuration UI
2. Group metrics by category in selection interfaces
3. Create grouped metric dashboards
4. Update admin panel to show metrics by group

## Files Modified

- ✅ `000003_create_metrics_configuration_table.up.sql` - Added group column
- ✅ `000003_create_metrics_configuration_table.down.sql` - Added index cleanup
- ✅ `000004_seed_3gpp_metrics.up.sql` - Added group values to INSERTs
- ✅ `000005_add_group_to_metrics_configuration.up.sql` - New migration
- ✅ `000005_add_group_to_metrics_configuration.down.sql` - New migration
- ✅ `METRICS_GROUPS.md` - New documentation
- ✅ `README.md` - Updated with new migrations
- ✅ `MIGRATION_SUMMARY.md` - This file

## Conclusion

The metrics configuration table now supports grouping of metrics according to 3GPP standards, enabling better organization, filtering, and presentation of monitoring metrics in the application.


