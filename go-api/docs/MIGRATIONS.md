# Database Migration System

## Overview

The application uses [golang-migrate](https://github.com/golang-migrate/migrate) for database schema management. Migrations run automatically on application startup.

## Setup

### 1. Install Dependencies

```bash
cd go-api
go mod download
```

This will install the `golang-migrate/migrate` library and all other dependencies.

### 2. Verify Migration Files

Migration files are located in `go-api/db/migrations/`:
```
db/migrations/
├── 000001_create_mon_objects_table.up.sql
├── 000001_create_mon_objects_table.down.sql
└── README.md
```

### 3. Run the Application

Migrations will run automatically when you start the application:

```bash
cd go-api
go run main.go
```

You should see logs indicating:
```
INFO Connected to PostgreSQL successfully
INFO Running database migrations from: ./db/migrations
INFO Current migration version: 1 (dirty: false)
INFO Database migrations completed successfully
```

## Migration System Architecture

### Components

1. **Migration Files** (`db/migrations/*.sql`)
   - SQL files containing schema changes
   - Paired `.up.sql` and `.down.sql` files

2. **Migration Service** (`db/migration.go`)
   - Handles migration execution
   - Provides methods: `RunMigrations()`, `Rollback()`, `MigrateTo()`

3. **PostgreSQL Service** (`db/pg/postgresql.go`)
   - Exposes `GetDB()` method for migration access

4. **Main Application** (`main.go`)
   - Runs migrations after database connection
   - Before starting the HTTP server

### Integration Flow

```
main.go
  ↓
PostgreSQL Connection
  ↓
Migration Service Init
  ↓
Run Migrations
  ↓
Start HTTP Server
```

## First Migration: mon_objects Table

The initial migration creates the `mon_objects` table:

```sql
CREATE TABLE mon_objects (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100),
    parent_id UUID,
    child_id UUID,
    technology VARCHAR(100),
    platform VARCHAR(100),
    network VARCHAR(100),
    manufacturer VARCHAR(100),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

With indexes on:
- `parent_id`
- `child_id`
- `type`
- `name`

## Creating New Migrations

### Step 1: Create Migration Files

Create two files with sequential numbering:

```bash
touch db/migrations/000002_your_change.up.sql
touch db/migrations/000002_your_change.down.sql
```

### Step 2: Write Migration SQL

**Up migration** (`000002_your_change.up.sql`):
```sql
ALTER TABLE mon_objects ADD COLUMN description TEXT;
```

**Down migration** (`000002_your_change.down.sql`):
```sql
ALTER TABLE mon_objects DROP COLUMN description;
```

### Step 3: Test

Restart the application - the new migration will run automatically.

## Manual Migration Commands

While migrations run automatically, you can also control them programmatically:

```go
import "live/db"

// Create migration service
migrationService := db.NewMigrationService(dbConnection, "./db/migrations")

// Run all pending migrations
err := migrationService.RunMigrations()

// Rollback last migration
err := migrationService.Rollback()

// Migrate to specific version
err := migrationService.MigrateTo(2)
```

## Verification

After migrations run, verify the table was created:

```sql
-- Connect to PostgreSQL
psql -h localhost -U your_user -d your_database

-- List tables
\dt

-- Describe mon_objects table
\d mon_objects

-- Check migration version
SELECT * FROM schema_migrations;
```

## Common Issues

### Issue: "no change" error
This is normal - it means migrations are already up to date.

### Issue: "dirty" database
A migration failed partway through. Check:
1. Database logs for errors
2. `schema_migrations` table
3. Manually fix database state
4. Update migration version

### Issue: Migration file not found
Ensure the path in `main.go` is correct:
```go
migrationsDir := filepath.Join(".", "db", "migrations")
```

## Dependencies

The migration system requires:
- `github.com/golang-migrate/migrate/v4` - Migration library
- `github.com/lib/pq` - PostgreSQL driver
- PostgreSQL database running and accessible

## Next Steps

1. Review the generated table structure
2. Create models/repositories for `mon_objects`
3. Add API endpoints to interact with the data
4. Create additional migrations as needed

For more details, see [db/migrations/README.md](../db/migrations/README.md).


