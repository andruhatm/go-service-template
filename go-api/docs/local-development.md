# Local Development Guide

This guide explains how to run the Go service locally during development with all required dependencies.

## Prerequisites

- **Go 1.24.3** or higher installed
- **Docker & Docker Compose** installed
- Access to the project directory

## Architecture Overview

The application consists of:
- **Go API Service** (Port 8081) - Main application entry point at `go-api/main.go`
- **PostgreSQL** (Port 5432) - Application database
- **Keycloak** (Port 8080) - Authentication & authorization server
- **Keycloak DB** - PostgreSQL database for Keycloak
- **VictoriaMetrics** (Port 8428) - Metrics storage

## Quick Start

```bash
# 1. Navigate to project root
cd /path/to/go-service-template

# 2. Start required containers
docker compose up -d keycloak-db keycloak victoriametrics db

# 3. Wait for services to be ready (30-60 seconds)
docker compose logs -f keycloak
# Wait for "Started Keycloak" message, then Ctrl+C

# 4. Create local configuration (see step-by-step guide below)

# 5. Run the Go application
cd go-api
go run main.go
```

## Step-by-Step Setup

### 1. Start Required Database Containers

Start all necessary containers using Docker Compose:

```bash
cd /path/to/go-service-template
docker compose up -d keycloak-db keycloak victoriametrics db
```

Verify containers are running:

```bash
# Check container status
docker compose ps

# Should show all 4 containers as "Up"
# - keycloak-db
# - keycloak
# - victoriametrics
# - db
```

**Wait for Keycloak to be fully started** (important!):

```bash
docker compose logs -f keycloak
# Wait until you see logs indicating Keycloak has started
# Then press Ctrl+C to exit log view
```

### 2. Configure for Local Development

The current `configuration.yaml` uses Docker container hostnames (e.g., `db`, `keycloak`). For local development, create a configuration that uses `localhost`.

**Option A: Create `configuration.local.yaml`** (Recommended)

Create a new file `go-api/configuration.local.yaml`:

```yaml
apiCfg:
  host: 0.0.0.0
  port: 8081
logging:
  level: debug
postgresCfg:
  - host: localhost
    port: 5432
    user: user
    password: pass
    database: appdb
sqliteCfg:
  path: "./db"
victoriaCfg:
  url: http://localhost:8428
keycloakCfg:
  issuer: http://localhost:8080/realms/myrealm
  client_id: spa-client
  client_secret: jym5bshxscBAQJqBsfo45hphL0oRdhx3
```

Then modify `main.go` line 30 to use this file:

```go
// Change from:
cfg, err := configuration.InitConfiguration("./configuration.yaml")

// To:
cfg, err := configuration.InitConfiguration("./configuration.local.yaml")
```

**Option B: Temporarily modify `configuration.yaml`**

Update the existing `go-api/configuration.yaml` to use localhost:

```yaml
postgresCfg:
  - host: localhost  # Changed from: db
    # ... rest of config

victoriaCfg:
  url: http://localhost:8428  # Changed from: http://victoriametrics:8428

keycloakCfg:
  issuer: http://localhost:8080/realms/myrealm  # Changed from: http://keycloak:8080/realms/myrealm
  # ... rest of config
```

> **Note**: Remember to revert these changes before committing!

### 3. Install Go Dependencies

```bash
cd go-api
go mod download
```

### 4. Configure Keycloak (First Time Only)

Before running the application for the first time, you need to set up Keycloak:

#### Access Keycloak Admin Console

1. Open browser: http://localhost:8080
2. Click "Administration Console"
3. Login with:
   - Username: `admin`
   - Password: `admin`

#### Create Realm

1. Click the dropdown at the top left (currently showing "master")
2. Click "Create Realm"
3. Set Realm name: `myrealm`
4. Click "Create"

#### Create Client

1. In the `myrealm` realm, go to "Clients" in the left sidebar
2. Click "Create client"
3. Configure:
   - **Client ID**: `spa-client`
   - **Client authentication**: ON (toggle to enable)
   - **Valid redirect URIs**: `http://localhost:*`
   - Click "Save"
4. Go to "Credentials" tab
5. Set/copy the **Client secret**: `jym5bshxscBAQJqBsfo45hphL0oRdhx3`
   - Or use the generated one and update your configuration file

#### Create Test User (Optional)

1. Go to "Users" in the left sidebar
2. Click "Create new user"
3. Fill in username and email
4. Click "Create"
5. Go to "Credentials" tab
6. Set password (uncheck "Temporary")

### 5. Run the Go Application

From the `go-api` directory:

```bash
cd go-api
go run main.go
```

You should see output similar to:

```
Connected to PostgreSQL successfully
Connected to VictoriaMetrics successfully
Starting server at 8081
```

The application is now running at **http://localhost:8081**

### 6. Verify the Application

Test the application is responding:

```bash
# Basic health check (if implemented)
curl http://localhost:8081/health

# Check VictoriaMetrics
curl http://localhost:8428/health

# Check PostgreSQL connection
docker compose exec db psql -U user -d appdb -c "SELECT 1;"
```

## Service URLs & Credentials

| Service | URL | Credentials | Purpose |
|---------|-----|-------------|---------|
| **Go API** | http://localhost:8081 | - | Main application |
| **Keycloak** | http://localhost:8080 | admin/admin | Auth server |
| **VictoriaMetrics** | http://localhost:8428 | - | Metrics storage |
| **PostgreSQL** | localhost:5432 | user/pass | App database (appdb) |
| **Keycloak DB** | localhost:5432 | keycloak/keycloak | Keycloak database |

## Development Workflow

### Typical Development Session

```bash
# Start containers (if not already running)
docker compose up -d keycloak-db keycloak victoriametrics db

# Wait for services to be ready
sleep 30  # or watch logs

# Run the Go application
cd go-api
go run main.go

# Make code changes...
# Stop with Ctrl+C
# Re-run: go run main.go
```

### Hot Reload (Optional)

For automatic reloading during development, you can use tools like `air`:

```bash
# Install air
go install github.com/air-verse/air@latest

# Run with air (create .air.toml config first)
cd go-api
air
```

### Useful Docker Commands

```bash
# Start specific containers
docker compose up -d keycloak-db keycloak victoriametrics db

# Check container status
docker compose ps

# View logs for a specific service
docker compose logs -f keycloak
docker compose logs -f db
docker compose logs -f victoriametrics

# Stop containers (preserves data)
docker compose stop

# Restart a specific container
docker compose restart db

# Stop and remove containers (preserves volumes)
docker compose down

# Stop and remove everything including data
docker compose down -v
```

### Database Commands

```bash
# Access PostgreSQL (application database)
docker compose exec db psql -U user -d appdb

# Access Keycloak database
docker compose exec keycloak-db psql -U keycloak -d keycloak

# Run SQL query
docker compose exec db psql -U user -d appdb -c "SELECT * FROM your_table;"

# Dump database
docker compose exec db pg_dump -U user appdb > backup.sql

# Restore database
docker compose exec -T db psql -U user -d appdb < backup.sql
```

## Configuration Files

### configuration.yaml vs configuration.local.yaml

- **`configuration.yaml`**: Docker container hostnames (for production/docker compose)
- **`configuration.local.yaml`**: Localhost addresses (for local development)

Key differences:

| Setting | Docker (configuration.yaml) | Local (configuration.local.yaml) |
|---------|----------------------------|----------------------------------|
| PostgreSQL host | `db` | `localhost` |
| VictoriaMetrics URL | `http://victoriametrics:8428` | `http://localhost:8428` |
| Keycloak issuer | `http://keycloak:8080/realms/myrealm` | `http://localhost:8080/realms/myrealm` |

### Configuration Structure

```yaml
apiCfg:
  host: 0.0.0.0      # Bind address
  port: 8081         # Application port

logging:
  level: debug       # Log level: debug, info, warn, error

postgresCfg:        # PostgreSQL configuration
  - host: localhost
    port: 5432
    user: user
    password: pass
    database: appdb

sqliteCfg:          # SQLite configuration (if used)
  path: "./db"

victoriaCfg:        # VictoriaMetrics configuration
  url: http://localhost:8428

keycloakCfg:        # Keycloak authentication configuration
  issuer: http://localhost:8080/realms/myrealm
  client_id: spa-client
  client_secret: jym5bshxscBAQJqBsfo45hphL0oRdhx3
```

## Troubleshooting

### Connection Refused to PostgreSQL

**Symptoms**: 
```
Failed to connect to PostgreSQL: dial tcp [::1]:5432: connect: connection refused
```

**Solutions**:
1. Ensure the `db` container is running:
   ```bash
   docker compose ps db
   ```

2. Check PostgreSQL logs:
   ```bash
   docker compose logs db
   ```

3. Verify port is accessible:
   ```bash
   nc -zv localhost 5432
   # or
   telnet localhost 5432
   ```

4. Ensure configuration uses `localhost` (not `db`) for local development

### Keycloak Authentication Fails

**Symptoms**:
```
Failed to create auth middleware: failed to verify issuer
```

**Solutions**:
1. Verify Keycloak is running and accessible:
   ```bash
   curl http://localhost:8080
   ```

2. Check Keycloak logs:
   ```bash
   docker compose logs -f keycloak
   ```

3. Ensure realm `myrealm` exists in Keycloak admin console

4. Verify client `spa-client` is configured correctly

5. Wait longer for Keycloak to fully start (can take 30-60 seconds)

### VictoriaMetrics Connection Error

**Symptoms**:
```
Failed to create VictoriaMetricsService: connection timeout
```

**Solutions**:
1. Check if VictoriaMetrics is running:
   ```bash
   docker compose ps victoriametrics
   ```

2. Test VictoriaMetrics endpoint:
   ```bash
   curl http://localhost:8428/health
   ```

3. Check VictoriaMetrics logs:
   ```bash
   docker compose logs victoriametrics
   ```

### Application Uses Wrong Configuration

**Symptoms**:
```
Failed to connect to PostgreSQL: dial tcp: lookup db: no such host
```

**Solution**:
- Update `main.go` line 30 to use local configuration:
  ```go
  cfg, err := configuration.InitConfiguration("./configuration.local.yaml")
  ```

### Port Already in Use

**Symptoms**:
```
bind: address already in use
```

**Solutions**:
1. Check what's using the port:
   ```bash
   lsof -i :8081
   # or for macOS
   sudo lsof -i :8081
   ```

2. Kill the process or change the port in `configuration.yaml`

### Containers Won't Start

**Solutions**:
1. Check for port conflicts:
   ```bash
   docker compose ps
   docker compose logs
   ```

2. Clean up and restart:
   ```bash
   docker compose down
   docker compose up -d keycloak-db keycloak victoriametrics db
   ```

3. If issues persist, remove volumes and restart:
   ```bash
   docker compose down -v
   docker compose up -d keycloak-db keycloak victoriametrics db
   ```
   ⚠️ **Warning**: This will delete all data!

## Building for Production

To build the Go application:

```bash
cd go-api
go build -o bin/app main.go

# Run the built binary
./bin/app
```

## Testing

Run tests from the `go-api` directory:

```bash
cd go-api

# Run all tests
go test ./...

# Run tests with coverage
go test -cover ./...

# Run specific test
go test -v ./utils/...
```

## Additional Resources

- [Go Documentation](https://golang.org/doc/)
- [Keycloak Documentation](https://www.keycloak.org/documentation)
- [VictoriaMetrics Documentation](https://docs.victoriametrics.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)

## Project Structure

```
go-api/
├── main.go                 # Application entry point
├── configuration/          # Configuration management
│   └── configuration.go
├── configuration.yaml      # Docker configuration
├── configuration.local.yaml # Local development configuration (create this)
├── db/                     # Database clients
│   ├── pg/                # PostgreSQL
│   ├── sqlite/            # SQLite
│   └── victoria/          # VictoriaMetrics
├── handlers/              # HTTP handlers
├── middleware/            # Middleware (auth, logging, etc.)
├── router/                # HTTP router configuration
└── utils/                 # Utility functions
```

## Environment Variables (Alternative to Configuration File)

You can also override configuration using environment variables:

```bash
export POSTGRES_HOST=localhost
export POSTGRES_PORT=5432
export POSTGRES_USER=user
export POSTGRES_PASSWORD=pass
export POSTGRES_DB=appdb
export KEYCLOAK_ISSUER=http://localhost:8080/realms/myrealm
export VICTORIA_URL=http://localhost:8428

go run main.go
```

---

**Last Updated**: December 29, 2025  
**Go Version**: 1.24.3  
**Docker Compose Version**: 3.8



