# Fix Backend Issues

## Issue 1: Dirty Migration State

The migration for the forecasts table is in a dirty state. Fix it with these steps:

### Step 1: Connect to PostgreSQL

```bash
docker exec -i go-service-template-db-1 psql -U user -d appdb
```

Or if you have psql installed locally:
```bash
psql -h 127.0.0.1 -U user -d appdb
# Password: pass
```

### Step 2: Check the Migration State

```sql
SELECT version, dirty FROM schema_migrations;
```

You should see something like:
```
 version | dirty 
---------+-------
       9 | t
```

### Step 3: Check if Forecasts Table Exists

```sql
\dt forecasts
```

### Step 4A: If Forecasts Table Does NOT Exist

The migration failed before creating the table. Reset to version 8:

```sql
UPDATE schema_migrations SET version = 8, dirty = false;
```

### Step 4B: If Forecasts Table DOES Exist

The migration completed but wasn't marked clean. Just mark it clean:

```sql
UPDATE schema_migrations SET version = 9, dirty = false;
```

### Step 5: Verify

```sql
SELECT version, dirty FROM schema_migrations;
```

Should show:
```
 version | dirty 
---------+-------
       8 | f     (if you chose 4A)
   or
       9 | f     (if you chose 4B)
```

### Step 6: Exit psql

```sql
\q
```

---

## Issue 2: Keycloak HTTPS Required Error

Keycloak is configured to require HTTPS by default. For local development, we need to disable this.

### Option A: Fix Keycloak Configuration (Recommended for Development)

1. Access Keycloak admin console:
   ```
   http://localhost:8080
   ```

2. Login with:
   - Username: `admin`
   - Password: `admin`

3. Go to: **Realm Settings** → **myrealm** → **Login** tab

4. Find **Require SSL** and change it to: **None** (for development) or **External requests** (if behind a proxy)

5. Click **Save**

### Option B: Restart Keycloak with Dev Mode

The docker-compose already has `start-dev` which should work, but if you still get HTTPS errors:

1. Edit `docker-compose.yaml` and add to keycloak service:
   ```yaml
   environment:
     # ... existing vars ...
     KC_HOSTNAME_STRICT: "false"
     KC_HOSTNAME_STRICT_HTTPS: "false"
   ```

2. Restart Keycloak:
   ```bash
   docker-compose restart keycloak
   ```

### Option C: Use Environment Variable

Set this before running your Go app:
```bash
export KEYCLOAK_DISABLE_SSL_VALIDATION=true
go run main.go
```

---

## Quick Fix Script

Run this script to fix both issues:

```bash
#!/bin/bash

echo "Fixing migration state..."
docker exec -i go-service-template-db-1 psql -U user -d appdb <<EOF
SELECT version, dirty FROM schema_migrations;
UPDATE schema_migrations SET version = 8, dirty = false;
SELECT version, dirty FROM schema_migrations;
EOF

echo ""
echo "Migration fixed! Now run your Go app:"
echo "  cd go-api"
echo "  go run main.go"
echo ""
echo "If you still get Keycloak HTTPS errors:"
echo "1. Go to http://localhost:8080"
echo "2. Login as admin/admin"
echo "3. Go to Realm Settings → Login"
echo "4. Set 'Require SSL' to 'None'"
echo "5. Save"
```

---

## After Fixing

Once both issues are resolved, start your backend:

```bash
cd go-api
go run main.go
```

You should see:
```
Connected to PostgreSQL successfully
Running database migrations from: db/migrations
Current migration version: 9 (dirty: false)
Database migrations completed successfully
Connected to VictoriaMetrics successfully
Auth middleware created successfully
Server starting on 0.0.0.0:8081
```

Then your forecast API will be available at:
- `http://localhost:8081/api/forecasts`

