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

