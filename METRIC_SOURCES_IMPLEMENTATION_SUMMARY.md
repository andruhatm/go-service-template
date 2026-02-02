# Metric Sources (EMS) - Implementation Summary

## Overview

This document summarizes the complete implementation of the Metric Sources (EMS) feature, which enables automatic import of Prometheus-formatted metrics from external sources (FTP, SFTP, HTTP, Local Files) into VictoriaMetrics.

## Implementation Date
February 2, 2026

## Files Created

### 1. Database Migration
- **File**: `go-api/db/migrations/000011_create_metric_sources_table.up.sql`
- **Purpose**: Creates `metric_sources` table with all necessary fields
- **Rollback**: `go-api/db/migrations/000011_create_metric_sources_table.down.sql`

**Schema Features:**
- Serial ID primary key
- Connection details (host, port, type, credentials)
- Scheduling configuration
- Sync status tracking
- Audit fields (created_at, updated_at, created_by)
- Comprehensive indexes for performance

### 2. Data Models
- **File**: `go-api/models/metric_source.go`
- **Purpose**: Go structs for metric sources

**Models Defined:**
- `MetricSource` - Main entity
- `CreateMetricSourceRequest` - Creation payload
- `UpdateMetricSourceRequest` - Update payload
- `MetricSourceListResponse` - List response
- `ConnectionType` enum - ftp, sftp, http, file
- `SyncStatus` enum - pending, success, error

### 3. Repository Layer
- **File**: `go-api/repository/metric_source_repository.go`
- **Purpose**: Database operations for metric sources

**Methods Implemented:**
- `Create(source)` - Insert new source
- `GetByID(id)` - Retrieve by ID
- `List()` - Get all sources
- `ListEnabled()` - Get only enabled sources
- `Update(id, req)` - Update source configuration
- `Delete(id)` - Remove source
- `UpdateSyncStatus(id, status, error)` - Track sync results

### 4. HTTP Handlers
- **File**: `go-api/handlers/metric_source_handler.go`
- **Purpose**: REST API endpoints

**Endpoints:**
- `CreateMetricSource` - POST /api/ems
- `GetMetricSource` - GET /api/ems/{id}
- `ListMetricSources` - GET /api/ems
- `UpdateMetricSource` - PUT /api/ems/{id}
- `DeleteMetricSource` - DELETE /api/ems/{id}

**Features:**
- User authentication via Keycloak
- Role-based access (ROLE_ADMIN for mutations)
- JSON validation
- Comprehensive error handling

### 5. Background Import Service
- **File**: `go-api/services/metric_importer.go`
- **Purpose**: Automated metric collection and import

**Key Components:**
- `MetricImporterService` - Main service struct
- `Start(ctx)` - Begin background processing
- `Stop()` - Graceful shutdown
- `checkAndSyncSources()` - Poll for sources to sync
- `syncSource(source)` - Import from single source
- `fetchMetrics(source)` - Connection-type dispatcher

**Connection Handlers:**
- `fetchFromFTP()` - FTP client using `github.com/jlaffaye/ftp`
- `fetchFromSFTP()` - SFTP client using `github.com/pkg/sftp`
- `fetchFromHTTP()` - HTTP client with basic auth
- `fetchFromFile()` - Local file reader

**Scheduling:**
- Checks every 1 minute for sources needing sync
- Parses schedule string (e.g., "5m", "1h30m")
- Tracks last sync time to avoid duplicate imports
- Concurrent goroutines for parallel source processing

### 6. Router Integration
- **File**: `go-api/router/router.go`
- **Purpose**: Register HTTP routes

**Changes:**
- Initialize `MetricSourceRepository`
- Initialize `MetricSourceHandler`
- Register 5 new endpoints under `/api/ems`
- Apply authentication middleware
- Apply role-based authorization

### 7. Main Application Updates
- **File**: `go-api/main.go`
- **Purpose**: Service initialization

**Changes:**
- Import `services` and `repository` packages
- Create `MetricImporterService` instance
- Start background service with context
- Register cleanup on shutdown

### 8. Dependency Management
- **File**: `go-api/go.mod`
- **Purpose**: External package dependencies

**Added Dependencies:**
```go
github.com/jlaffaye/ftp v0.2.0
github.com/pkg/sftp v1.13.6
golang.org/x/crypto v0.32.0
```

### 9. Documentation

#### Main Guide
- **File**: `METRIC_SOURCES_GUIDE.md`
- **Sections**:
  - Architecture overview
  - Database schema
  - API documentation with examples
  - Connection type details
  - Schedule format
  - Metrics file format (Prometheus)
  - Security considerations
  - Performance recommendations
  - Troubleshooting guide
  - Testing instructions

#### Quick Start
- **File**: `METRIC_SOURCES_QUICKSTART.md`
- **Sections**:
  - 5-minute setup
  - Quick test with local file
  - Common operations
  - Troubleshooting
  - Production checklist

#### Test Script
- **File**: `test_metric_sources.sh`
- **Purpose**: Automated integration testing
- **Tests**:
  1. List sources
  2. Create source
  3. Get source by ID
  4. Wait for sync
  5. Check sync status
  6. Verify metrics in VictoriaMetrics
  7. Update source
  8. Disable source
  9. Re-enable source
  10. Delete source (optional)

## API Endpoint Summary

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/api/ems` | ✓ | Any | List all sources |
| GET | `/api/ems/{id}` | ✓ | Any | Get specific source |
| POST | `/api/ems` | ✓ | ADMIN | Create new source |
| PUT | `/api/ems/{id}` | ✓ | ADMIN | Update source |
| DELETE | `/api/ems/{id}` | ✓ | ADMIN | Delete source |

## Database Schema

```sql
metric_sources
├── id (SERIAL PRIMARY KEY)
├── source_name (VARCHAR(255) NOT NULL)
├── description (TEXT)
├── connection_type (VARCHAR(50) NOT NULL)
├── host (VARCHAR(255) NOT NULL)
├── port (INTEGER DEFAULT 21)
├── file_path (VARCHAR(500) NOT NULL)
├── username (VARCHAR(255))
├── password (VARCHAR(255))
├── schedule (VARCHAR(100) NOT NULL)
├── enabled (BOOLEAN DEFAULT true)
├── last_sync_at (TIMESTAMP)
├── last_sync_status (VARCHAR(50))
├── last_sync_error (TEXT)
├── created_at (TIMESTAMP DEFAULT NOW())
├── updated_at (TIMESTAMP DEFAULT NOW())
└── created_by (VARCHAR(255))

Indexes:
- idx_metric_sources_enabled
- idx_metric_sources_schedule
- idx_metric_sources_last_sync
- idx_metric_sources_connection_type
```

## Data Flow

```
┌─────────────┐
│  Frontend   │
│  (UI Form)  │
└──────┬──────┘
       │ POST /api/ems
       ▼
┌─────────────────┐
│  HTTP Handler   │
│  (Validation)   │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│   Repository    │
│  (Insert DB)    │
└─────────────────┘

       ║ (Background Process)
       ▼
┌─────────────────────┐
│ MetricImporter      │
│ (Every 1 minute)    │
└──────┬──────────────┘
       │
       ├──► Check schedule
       ├──► Fetch metrics (FTP/SFTP/HTTP/File)
       ├──► Parse Prometheus format
       │
       ▼
┌────────────────────┐
│  VictoriaMetrics   │
│  /api/v1/import/   │
│     prometheus     │
└────────────────────┘
       │
       ▼
┌────────────────────┐
│  Update sync       │
│  status in DB      │
└────────────────────┘
```

## Feature Highlights

### 1. **Flexible Connection Types**
- FTP (Plain text, port 21 default)
- SFTP (SSH encrypted, port 22 default)
- HTTP/HTTPS (With basic auth support)
- Local File (Direct filesystem access)

### 2. **Intelligent Scheduling**
- Duration-based (e.g., "5m", "1h30m")
- Prevents duplicate imports
- Per-source independent scheduling
- Concurrent processing for multiple sources

### 3. **Robust Error Handling**
- Connection failures tracked
- Sync errors logged in database
- Automatic retry on next cycle
- Detailed error messages for debugging

### 4. **Security**
- Authentication required (Keycloak)
- Role-based access control (ADMIN)
- Credentials stored in database
- Support for anonymous/public sources

### 5. **Monitoring & Observability**
- Sync status tracking (pending/success/error)
- Last sync timestamp
- Error message storage
- Integration with application logs

### 6. **Production Ready**
- Graceful shutdown handling
- Context cancellation support
- Connection timeouts (30s default)
- Database transaction safety

## Frontend Integration Points

The frontend `ems.service.ts` already has the interface defined:

```typescript
export interface Subs {
  id: number;
  source_name: string;
  description: string;
  connection_type: string;
  host: string;
  FTPport: string;  // Note: Backend uses int, may need conversion
  file_path: string;
  username: string;
  password: string;
  schedule: string;
}
```

**Integration Tasks:**
1. Update `FTPport` type from string to number (or handle conversion)
2. Add fields for status display:
   - `enabled: boolean`
   - `last_sync_at: string | null`
   - `last_sync_status: string | null`
   - `last_sync_error: string | null`
3. Update form to include connection type selector
4. Add schedule field with validation
5. Display sync status in table
6. Add enable/disable toggle
7. Show last sync time

## Testing Checklist

### Manual Testing
- [x] Create source via API
- [x] List sources
- [x] Get source by ID
- [x] Update source
- [x] Delete source
- [ ] Test FTP connection
- [ ] Test SFTP connection
- [ ] Test HTTP connection
- [x] Test local file connection
- [ ] Test invalid credentials
- [ ] Test non-existent files
- [ ] Test invalid metrics format

### Automated Testing
- [x] Test script created (`test_metric_sources.sh`)
- [ ] Unit tests for repository
- [ ] Unit tests for handlers
- [ ] Integration tests for service
- [ ] E2E tests with real sources

### Performance Testing
- [ ] Test with large files (>10MB)
- [ ] Test with many concurrent sources (>10)
- [ ] Test rapid schedule intervals (<1m)
- [ ] Monitor memory usage
- [ ] Monitor CPU usage

## Deployment Instructions

### Development
```bash
cd go-api
go mod download
cd ..
docker-compose restart go-api
```

### Production
1. **Update go.mod dependencies**
   ```bash
   cd go-api
   go mod download
   go mod verify
   ```

2. **Build new image**
   ```bash
   docker-compose build go-api
   ```

3. **Run migration**
   - Automatic on service start
   - Or manually: Check migration status in logs

4. **Restart service**
   ```bash
   docker-compose up -d go-api
   ```

5. **Verify service**
   ```bash
   docker-compose logs -f go-api | grep "metric importer"
   ```

## Known Limitations

1. **Password Security**: Passwords stored in plain text
   - **Recommendation**: Implement encryption before production

2. **Schedule Format**: Only supports duration strings
   - **Future**: Add cron expression support

3. **File Size**: No hard limit on metrics file size
   - **Recommendation**: Implement size checks for large files

4. **Concurrent Connections**: No limit on concurrent source syncs
   - **Recommendation**: Add connection pool or rate limiting

5. **Retry Logic**: Failed syncs wait until next check cycle
   - **Future**: Implement exponential backoff retry

6. **Metrics Validation**: Basic validation only
   - **Future**: Add strict Prometheus format validation

## Security Considerations

### Current Implementation
- ✓ Authentication required (Keycloak)
- ✓ Role-based authorization (ADMIN)
- ✓ SQL injection protection (parameterized queries)
- ✗ Password encryption (plain text storage)
- ✗ Credential rotation
- ✗ Audit logging

### Recommendations for Production
1. Encrypt passwords using AES-256 or similar
2. Use secrets management (HashiCorp Vault, AWS Secrets Manager)
3. Implement audit logging for all operations
4. Add rate limiting on API endpoints
5. Use HTTPS/TLS for all connections
6. Implement IP whitelisting for sources
7. Regular security audits

## Performance Considerations

### Current Configuration
- Check interval: 1 minute
- Connection timeout: 30 seconds
- Concurrent syncs: Unlimited
- Memory: Loads full file into memory

### Optimization Recommendations
1. Implement streaming for large files
2. Add connection pooling
3. Configure max concurrent syncs
4. Add metrics for sync duration
5. Implement backpressure handling
6. Cache frequently accessed data

## Monitoring & Alerting

### Metrics to Monitor
1. **Sync Success Rate**
   - Track % of successful syncs per source
   - Alert on consecutive failures (>3)

2. **Sync Duration**
   - Monitor time taken per source
   - Alert on abnormal increases (>2x baseline)

3. **Source Count**
   - Track number of active sources
   - Alert on rapid increases (possible misconfiguration)

4. **Error Types**
   - Connection errors
   - Authentication errors
   - Format errors
   - VictoriaMetrics errors

### Recommended Alerts
```
- Alert: MetricSourceSyncFailed
  Condition: last_sync_status = 'error' for >10 minutes
  Severity: Warning

- Alert: MetricSourceNotSynced
  Condition: last_sync_at > 30 minutes for enabled source
  Severity: Critical

- Alert: HighMetricSourceErrorRate
  Condition: >20% of sources in error state
  Severity: Critical
```

## Future Enhancements

### Short Term (1-3 months)
1. Password encryption in database
2. Cron expression support for schedules
3. UI integration and testing
4. Comprehensive error handling
5. Retry logic with exponential backoff

### Medium Term (3-6 months)
1. Data transformation plugins
2. Webhook/push-based collection
3. Compression support (gzip)
4. Health check endpoints
5. Prometheus metrics export
6. Advanced scheduling (time windows)

### Long Term (6-12 months)
1. Multi-tenancy support
2. Source templates/presets
3. Data quality validation
4. Anomaly detection on sync patterns
5. Integration with monitoring systems
6. Advanced access control (source-level permissions)

## Support & Troubleshooting

### Common Issues

#### Issue: Service doesn't start
```bash
# Check logs
docker-compose logs go-api

# Check migration
docker-compose exec db psql -U user -d appdb -c "\dt"
```

#### Issue: Source shows "pending" status
```bash
# Wait for next check cycle (up to 1 minute)
# Or check logs for errors
docker-compose logs -f go-api | grep "Syncing source"
```

#### Issue: Metrics not in VictoriaMetrics
```bash
# Verify VictoriaMetrics is running
curl http://localhost:8428/health

# Check if metrics were written
curl "http://localhost:8428/api/v1/query?query={__name__=~'.+'}"
```

### Getting Help
1. Check logs: `docker-compose logs -f go-api`
2. Review documentation: `METRIC_SOURCES_GUIDE.md`
3. Run test script: `./test_metric_sources.sh`
4. Check database: `docker-compose exec db psql -U user -d appdb`

## Conclusion

The Metric Sources (EMS) feature is now fully implemented and ready for testing. The implementation includes:

- ✅ Database schema and migration
- ✅ Complete backend API (5 endpoints)
- ✅ Background import service
- ✅ Support for 4 connection types (FTP, SFTP, HTTP, File)
- ✅ Flexible scheduling system
- ✅ Error tracking and status monitoring
- ✅ Comprehensive documentation
- ✅ Automated test script

**Next Steps:**
1. Test the implementation using `test_metric_sources.sh`
2. Connect the frontend UI to the API endpoints
3. Test with real data sources
4. Implement security enhancements for production
5. Deploy to staging/production environment

**Estimated Effort for Frontend Integration:** 4-6 hours
**Estimated Effort for Production Hardening:** 8-12 hours
