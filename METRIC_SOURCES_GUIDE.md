# Metric Sources (EMS) - Implementation Guide

## Overview

This feature allows you to configure external metric sources that automatically import Prometheus-formatted metrics into VictoriaMetrics at specified intervals. Sources can be configured via the UI and include support for FTP, SFTP, HTTP, and local file sources.

## Architecture

### Components

1. **Database Migration** (`000011_create_metric_sources_table`)
   - Creates `metric_sources` table to store source configurations
   - Includes fields for connection details, scheduling, and sync status

2. **Backend API** (`/api/ems`)
   - CRUD endpoints for managing metric sources
   - Protected by Keycloak authentication (ROLE_ADMIN required)

3. **Background Importer Service** (`MetricImporterService`)
   - Runs every minute checking for sources that need syncing
   - Fetches metrics from configured sources
   - Imports data to VictoriaMetrics using Prometheus format

4. **Frontend Integration** (`ems.service.ts`)
   - Angular service for UI integration
   - Manages "Текущие подписки" (Current Subscriptions) table

## Database Schema

```sql
CREATE TABLE metric_sources (
    id SERIAL PRIMARY KEY,
    source_name VARCHAR(255) NOT NULL,
    description TEXT,
    connection_type VARCHAR(50) NOT NULL DEFAULT 'ftp',
    host VARCHAR(255) NOT NULL,
    port INTEGER DEFAULT 21,
    file_path VARCHAR(500) NOT NULL,
    username VARCHAR(255),
    password VARCHAR(255),
    schedule VARCHAR(100) NOT NULL,
    enabled BOOLEAN DEFAULT true,
    last_sync_at TIMESTAMP,
    last_sync_status VARCHAR(50),
    last_sync_error TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255)
);
```

## API Endpoints

All endpoints require authentication and are prefixed with `/api/ems`.

### List All Sources
```bash
GET /api/ems
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "id": 1,
    "source_name": "Production FTP Server",
    "description": "Main metrics source",
    "connection_type": "ftp",
    "host": "ftp.example.com",
    "FTPport": 21,
    "file_path": "/metrics/prometheus.txt",
    "username": "user",
    "password": "****",
    "schedule": "5m",
    "enabled": true,
    "last_sync_at": "2026-02-02T12:00:00Z",
    "last_sync_status": "success",
    "created_at": "2026-02-01T10:00:00Z"
  }
]
```

### Get Single Source
```bash
GET /api/ems/{id}
Authorization: Bearer <token>
```

### Create Source
```bash
POST /api/ems
Authorization: Bearer <token>
Content-Type: application/json

{
  "source_name": "Production FTP Server",
  "description": "Main metrics source",
  "connection_type": "ftp",
  "host": "ftp.example.com",
  "FTPport": 21,
  "file_path": "/metrics/prometheus.txt",
  "username": "user",
  "password": "password",
  "schedule": "5m",
  "enabled": true
}
```

**Required fields:**
- `source_name`
- `connection_type` (one of: `ftp`, `sftp`, `http`, `file`)
- `host`
- `FTPport`
- `file_path`
- `schedule`

### Update Source
```bash
PUT /api/ems/{id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "enabled": false,
  "schedule": "10m"
}
```

### Delete Source
```bash
DELETE /api/ems/{id}
Authorization: Bearer <token>
```

## Connection Types

### FTP
```json
{
  "connection_type": "ftp",
  "host": "ftp.example.com",
  "FTPport": 21,
  "file_path": "/metrics/data.txt",
  "username": "user",
  "password": "pass"
}
```

### SFTP (SSH File Transfer Protocol)
```json
{
  "connection_type": "sftp",
  "host": "sftp.example.com",
  "FTPport": 22,
  "file_path": "/metrics/data.txt",
  "username": "user",
  "password": "pass"
}
```

### HTTP/HTTPS
```json
{
  "connection_type": "http",
  "host": "metrics.example.com",
  "FTPport": 80,
  "file_path": "/metrics",
  "username": "user",
  "password": "pass"
}
```

### Local File
```json
{
  "connection_type": "file",
  "host": "localhost",
  "FTPport": 0,
  "file_path": "/var/metrics/data.txt"
}
```

## Schedule Format

The `schedule` field supports time duration formats:

- `30s` - Every 30 seconds
- `5m` - Every 5 minutes
- `1h` - Every hour
- `1h30m` - Every 1 hour 30 minutes

**Examples:**
- `"5m"` - Import every 5 minutes
- `"30s"` - Import every 30 seconds
- `"1h"` - Import every hour

## Metrics File Format

The metrics file must be in Prometheus exposition format:

```
# HELP http_requests_total The total number of HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="GET",status="200"} 1234 1672531200000
http_requests_total{method="POST",status="200"} 567 1672531200000

# HELP cpu_usage_percent CPU usage percentage
# TYPE cpu_usage_percent gauge
cpu_usage_percent{host="server1"} 45.2 1672531200000
cpu_usage_percent{host="server2"} 67.8 1672531200000
```

**Format:**
```
metric_name{label="value",label2="value2"} value [timestamp_ms]
```

- Timestamp is optional (will use current time if omitted)
- Supports counter, gauge, histogram, and summary types
- Lines starting with `#` are comments/metadata

## How It Works

### 1. User Creates Source via UI
- User fills out form with connection details and schedule
- Frontend sends POST request to `/api/ems`
- Backend validates and stores in database

### 2. Background Service Monitors Sources
- `MetricImporterService` runs every minute
- Checks all enabled sources
- Determines if sync is needed based on schedule and last sync time

### 3. Metric Import Process
```
1. Fetch metrics file from source (FTP/SFTP/HTTP/File)
2. Validate Prometheus format
3. Send to VictoriaMetrics via /api/v1/import/prometheus
4. Update sync status in database
```

### 4. Status Tracking
- `last_sync_at` - Timestamp of last sync
- `last_sync_status` - `pending`, `success`, or `error`
- `last_sync_error` - Error message if sync failed

## Installation

### 1. Run Migration
The migration runs automatically on service startup, or manually:

```bash
cd go-api
go run main.go
```

### 2. Install Dependencies
```bash
cd go-api
go get github.com/jlaffaye/ftp
go get github.com/pkg/sftp
go get golang.org/x/crypto/ssh
```

### 3. Restart Service
```bash
docker-compose restart go-api
```

## Usage Examples

### Example 1: FTP Server with 5-minute interval
```bash
curl -X POST http://localhost:8081/api/ems \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "source_name": "Production Metrics",
    "description": "Main production server metrics",
    "connection_type": "ftp",
    "host": "ftp.example.com",
    "FTPport": 21,
    "file_path": "/exports/metrics.txt",
    "username": "metrics_user",
    "password": "secure_password",
    "schedule": "5m",
    "enabled": true
  }'
```

### Example 2: Local File with 1-minute interval
```bash
curl -X POST http://localhost:8081/api/ems \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "source_name": "Local Test Metrics",
    "connection_type": "file",
    "host": "localhost",
    "FTPport": 0,
    "file_path": "/tmp/test_metrics.txt",
    "schedule": "1m",
    "enabled": true
  }'
```

### Example 3: Disable a Source
```bash
curl -X PUT http://localhost:8081/api/ems/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "enabled": false
  }'
```

## Monitoring and Troubleshooting

### Check Sync Status
```bash
curl -X GET http://localhost:8081/api/ems/1 \
  -H "Authorization: Bearer $TOKEN"
```

Look for:
- `last_sync_status`: Should be `success`
- `last_sync_error`: Should be null
- `last_sync_at`: Should be recent

### Common Issues

#### 1. Connection Failed
**Error:** `failed to connect to FTP server`

**Solutions:**
- Check host and port are correct
- Verify firewall allows connection
- Test credentials manually

#### 2. File Not Found
**Error:** `failed to retrieve file from FTP`

**Solutions:**
- Verify `file_path` is correct
- Check user has read permissions
- Test path with FTP client

#### 3. Invalid Metrics Format
**Error:** `no valid metrics found in data`

**Solutions:**
- Ensure file is in Prometheus format
- Check for syntax errors in metrics file
- Validate with Prometheus exposition format spec

#### 4. VictoriaMetrics Write Failed
**Error:** `failed to write metrics to VictoriaMetrics`

**Solutions:**
- Check VictoriaMetrics is running
- Verify `victoriaCfg.url` in configuration
- Check VictoriaMetrics logs

### Logs
```bash
# View service logs
docker-compose logs -f go-api

# Look for:
# "Starting metric importer service"
# "Syncing source: Production Metrics (ID: 1)"
# "Successfully synced metrics from source Production Metrics"
```

## Security Considerations

### Password Storage
⚠️ **Current Implementation:** Passwords are stored in plain text in the database.

**Recommendations for Production:**
1. Encrypt passwords using AES-256 or similar
2. Use environment variables for sensitive credentials
3. Consider using secrets management (HashiCorp Vault, AWS Secrets Manager)
4. Implement password rotation policies

### Access Control
- All EMS endpoints require authentication
- Only users with `ROLE_ADMIN` can create/update/delete sources
- Source credentials are only accessible to admins

### Network Security
- Use SFTP instead of FTP when possible (encrypted)
- Use HTTPS for HTTP-based sources
- Restrict network access to metric sources
- Use VPN or private networks for production

## Performance Considerations

- **Polling Interval:** Service checks every 1 minute
- **Concurrent Syncs:** Each source syncs in its own goroutine
- **File Size Limits:** No hard limit, but large files may cause memory issues
- **VictoriaMetrics Limits:** Respects VictoriaMetrics ingestion limits

**Recommendations:**
- Keep metric files under 10MB
- Use schedule intervals ≥ 1 minute
- Monitor VictoriaMetrics performance
- Consider batching if importing millions of metrics

## Future Enhancements

Potential improvements:
1. **Cron Expression Support** - More flexible scheduling
2. **Webhook Triggers** - Push-based metric collection
3. **Data Transformation** - Convert from other formats (JSON, CSV)
4. **Compression Support** - Handle gzipped files
5. **Retry Logic** - Automatic retry on transient failures
6. **Health Checks** - Endpoint to check source connectivity
7. **Metrics** - Export Prometheus metrics about sync operations

## Testing

### Create Test Metrics File
```bash
cat > /tmp/test_metrics.txt << 'EOF'
# Test metrics
test_counter{label="value1"} 100
test_gauge{label="value2"} 42.5
EOF
```

### Create Local File Source
```bash
curl -X POST http://localhost:8081/api/ems \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "source_name": "Test Local Source",
    "connection_type": "file",
    "host": "localhost",
    "FTPport": 0,
    "file_path": "/tmp/test_metrics.txt",
    "schedule": "1m",
    "enabled": true
  }'
```

### Verify in VictoriaMetrics
```bash
curl "http://localhost:8428/api/v1/query?query=test_counter"
```

## References

- [Prometheus Exposition Format](https://prometheus.io/docs/instrumenting/exposition_formats/)
- [VictoriaMetrics Import API](https://docs.victoriametrics.com/#how-to-import-data-in-prometheus-exposition-format)
- [Go FTP Library](https://github.com/jlaffaye/ftp)
- [Go SFTP Library](https://github.com/pkg/sftp)
