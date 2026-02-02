# Migration Fix Instructions

## Problem

The forecasts table migration failed because we tried to create foreign keys to non-unique columns:
- `mon_objects.name` is NOT unique (multiple objects can have the same name)
- We can't create a foreign key constraint on a non-unique column

## Solution

I've removed the foreign key constraints. The table will now store the names as strings, and the application code will validate that the names exist when creating forecasts.

## Steps to Fix

### 1. Reset the Migration State

```bash
cd /Users/andrewgerasimov/GolandProjects/go-service-template
bash fix_migration.sh
```

This will reset the migration to version 8 (before the forecasts table).

### 2. Run Your Backend Again

```bash
cd go-api
go run main.go
```

The migration will now run successfully without the foreign key constraints.

## Why This Works

The application-level validation in the handler will ensure:
1. The `mon_object_name` exists in the database before creating a forecast
2. The `metric_name` exists in the database before creating a forecast

This is actually better than database constraints because:
- More flexible (can handle edge cases)
- Better error messages to users
- Doesn't prevent data cleanup/archival

## Alternative: If You Really Want Foreign Keys

If you absolutely need database-level foreign key constraints, you would need to:

### Option A: Add unique constraints to the referenced tables

```sql
-- This might break existing data if there are duplicates
ALTER TABLE mon_objects ADD CONSTRAINT mon_objects_name_unique UNIQUE (name);
```

### Option B: Reference IDs instead of names

Change the forecasts table to use UUIDs:
```sql
mon_object_id UUID NOT NULL REFERENCES mon_objects(id) ON DELETE CASCADE,
metric_id UUID NOT NULL REFERENCES metrics_configuration(id) ON DELETE CASCADE,
```

But this requires changing the application code to lookup IDs first.

## Recommendation

**Use the current solution** (no foreign keys, application-level validation). It's simpler and more flexible for this use case.


