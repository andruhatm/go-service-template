# Database Migrations

This directory contains database migrations for the application using [golang-migrate](https://github.com/golang-migrate/migrate).

## Migration Files

Migration files follow the naming convention:
```
{version}_{description}.{up|down}.sql
```

- `version`: Sequential number (e.g., 000001, 000002)
- `description`: Brief description of the migration
- `up`: Applied when migrating forward
- `down`: Applied when rolling back

## Current Migrations

### 000001_create_mon_objects_table

Creates the `mon_objects` table for storing monitoring objects with the following columns:
- `id` (UUID) - Primary key
- `name` (VARCHAR) - Object name
- `type` (VARCHAR) - Object type
- `parent_id` (UUID) - Reference to parent object
- `child_id` (UUID) - Reference to child object
- `technology` (VARCHAR) - Technology type
- `platform` (VARCHAR) - Platform information
- `network` (VARCHAR) - Network information
- `manufacturer` (VARCHAR) - Manufacturer information
- `created_at` (TIMESTAMP) - Creation timestamp
- `updated_at` (TIMESTAMP) - Last update timestamp

Indexes are created on frequently queried columns for better performance.

### 000002_seed_sample_data

Seeds the database with 39 sample monitoring objects including:
- 5 eNodeB devices (LTE base stations)
- 3 gNodeB devices (5G base stations)
- 6 Cells
- 3 Centralized Units (CU)
- 3 Distributed Units (DU)
- 6 Remote Radio Units (RRU)
- 3 Routers
- 3 Switches
- 3 Servers

See [SAMPLE_DATA.md](./SAMPLE_DATA.md) for complete details.

### 000003_create_metrics_configuration_table

Creates the `metrics_configuration` table for storing metric definitions:
- `id` (UUID) - Primary key
- `name` (VARCHAR) - Metric name (unique)
- `unit` (VARCHAR) - Unit of measurement
- `degradation` (VARCHAR) - Degradation direction ('lower' or 'higher')
- `group` (VARCHAR) - Metric category/group
- `created_at` (TIMESTAMP) - Creation timestamp
- `updated_at` (TIMESTAMP) - Last update timestamp

Indexes are created on `name` and `group` columns for optimal query performance.

### 000004_seed_3gpp_metrics

Populates the `metrics_configuration` table with 36 3GPP-compliant metrics organized into 6 groups:
1. **Radio Quality** (6 metrics) - RSRP, RSRQ, RSSI, SINR, CQI, BLER
2. **Throughput** (6 metrics) - DL/UL throughput, PRB utilization, cell/user throughput
3. **Latency** (4 metrics) - Latency, Jitter, RTT, Packet Delay
4. **Call/Session Quality** (6 metrics) - Drop rates, success rates, handover performance
5. **5G Specific** (6 metrics) - SS-RSRP/RSRQ/SINR, CSI-RSRP/RSRQ/SINR
6. **Network Performance** (8 metrics) - Users, efficiency, availability, interference

See [METRICS_GROUPS.md](./METRICS_GROUPS.md) for complete metrics documentation.

### 000005_add_group_to_metrics_configuration

Migration for backward compatibility with existing databases. This migration:
- Adds the `group` column if it doesn't exist (for databases where migration 000003 ran before the column was added)
- Creates index on the `group` column if it doesn't exist
- Updates existing metrics with their appropriate group values

**Note**: For new installations, this migration is effectively a no-op since migrations 000003 and 000004 already create and populate the `group` column.

### 000006_add_extended_3gpp_metrics

Adds comprehensive set of 119 additional 3GPP-compliant metrics for LTE and 5G networks, organized into 16 specialized groups:

1. **Accessibility** (10 metrics) - RRC setup, RACH, attach procedures
2. **Retainability** (7 metrics) - Connection maintenance, drop rates
3. **Mobility** (10 metrics) - Handover performance (intra/inter-freq, X2/S1)
4. **Integrity** (8 metrics) - Protocol layer performance (PDCP, RLC, MAC, HARQ)
5. **Resource Utilization** (7 metrics) - PRB, CCE, spectrum efficiency
6. **Capacity** (8 metrics) - User density, traffic volume, area capacity
7. **Voice Quality** (8 metrics) - VoLTE/VoNR performance, MOS, SRVCC
8. **5G Advanced** (10 metrics) - Beamforming, network slicing, URLLC, mMTC, eMBB
9. **Control Plane** (6 metrics) - Signaling, paging, registration
10. **User Plane** (9 metrics) - User-experienced data rates, cell edge performance
11. **Energy Efficiency** (5 metrics) - Power consumption, energy per bit
12. **QoS** (8 metrics) - QCI-specific metrics, bearer setup, PDB/PELR
13. **Coverage** (6 metrics) - Coverage area, indoor/outdoor penetration
14. **Interference** (6 metrics) - Inter/intra-cell, adjacent channel, noise
15. **Carrier Aggregation** (5 metrics) - CA setup, SCell addition, throughput gain
16. **Dual Connectivity** (6 metrics) - EN-DC, SgNB operations, MR-DC

**Total Metrics**: 155 (36 base + 119 extended)

See [EXTENDED_METRICS_GUIDE.md](./EXTENDED_METRICS_GUIDE.md) for complete documentation including:
- Detailed metric descriptions with target values
- Technology mapping (LTE/5G/Common)
- Use cases for each metric group
- SQL query examples
- Integration guidance
- Alerting thresholds
- 3GPP standards references

### 000007_add_descriptions_and_thresholds

Enhances the `metrics_configuration` table with localization and alerting capabilities by adding:

**New Columns:**
- `description_ru` (TEXT) - Russian language descriptions for all 155 metrics
- `threshold_critical` (TEXT) - Critical alert thresholds (P1 priority)
- `threshold_warning` (TEXT) - Warning alert thresholds (P2 priority)

**Features:**
- Russian translations for all metrics covering radio quality, throughput, latency, voice quality, 5G advanced features, and more
- Industry-standard alert thresholds based on 3GPP recommendations and operational best practices
- Flexible threshold format supporting various comparison operators (>, <, ranges)

**Alert Priority Levels:**
- 🔴 **Critical (P1)**: Immediate attention required (e.g., RRC_Setup_Success_Rate < 95%)
- 🟡 **Warning (P2)**: High priority monitoring (e.g., Handover_Success_Rate < 98%)

**Coverage:**
- All 22 metric groups fully translated and configured
- Technology-specific thresholds for LTE and 5G metrics
- VoLTE/VoNR voice quality thresholds
- Advanced 5G features (URLLC, mMTC, eMBB, network slicing)
- Resource utilization and capacity management thresholds

See [METRICS_SUMMARY.md](./METRICS_SUMMARY.md) for complete metrics overview and alert priority guidelines.

## Running Migrations

Migrations run automatically when the application starts. The migration system will:
1. Check the current database version
2. Apply all pending migrations
3. Log the current migration version

## Creating New Migrations

To create a new migration:

1. Create two files with the next sequential number:
   ```
   000002_your_migration_name.up.sql
   000002_your_migration_name.down.sql
   ```

2. Write the forward migration in the `.up.sql` file
3. Write the rollback logic in the `.down.sql` file

Example:
```sql
-- 000002_add_status_to_mon_objects.up.sql
ALTER TABLE mon_objects ADD COLUMN status VARCHAR(50) DEFAULT 'active';
```

```sql
-- 000002_add_status_to_mon_objects.down.sql
ALTER TABLE mon_objects DROP COLUMN status;
```

## Manual Migration Control

The migration service provides methods for manual control:

- `RunMigrations()` - Apply all pending migrations
- `Rollback()` - Rollback the last migration
- `MigrateTo(version)` - Migrate to a specific version

## Best Practices

1. **Always write down migrations** - Every up migration must have a corresponding down migration
2. **Test migrations** - Test both up and down migrations before deploying
3. **Keep migrations small** - Each migration should do one thing
4. **Don't modify existing migrations** - Once applied in production, never modify a migration
5. **Use transactions** - For complex migrations, wrap in BEGIN/COMMIT
6. **Backup before migration** - Always backup production data before running migrations

## Troubleshooting

If a migration fails:
1. Check the error message in the logs
2. The migration system marks the database as "dirty"
3. Fix the issue in the migration file
4. Manually fix the database state if needed
5. Update the schema_migrations table to mark as clean

Check current migration status:
```sql
SELECT * FROM schema_migrations;
```

