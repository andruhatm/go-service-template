# Metric Sources (EMS) - Complete Documentation Index

## What is This?

The **Metric Sources (EMS)** feature enables automated import of Prometheus-formatted metrics from external sources into VictoriaMetrics. Users can configure sources via the UI, and the system automatically fetches and imports metrics at specified intervals.

## Quick Links

| Document | Purpose | Audience |
|----------|---------|----------|
| [Quick Start Guide](METRIC_SOURCES_QUICKSTART.md) | Get up and running in 5 minutes | Developers, QA |
| [Complete Guide](METRIC_SOURCES_GUIDE.md) | Comprehensive documentation | All users |
| [Implementation Summary](METRIC_SOURCES_IMPLEMENTATION_SUMMARY.md) | Technical details and architecture | Developers, DevOps |

## Getting Started

### For Developers
1. **Start here**: [METRIC_SOURCES_QUICKSTART.md](METRIC_SOURCES_QUICKSTART.md)
2. Run test script: `./test_metric_sources.sh`
3. Check implementation: [METRIC_SOURCES_IMPLEMENTATION_SUMMARY.md](METRIC_SOURCES_IMPLEMENTATION_SUMMARY.md)

### For Frontend Developers
1. Review API endpoints in [METRIC_SOURCES_GUIDE.md](METRIC_SOURCES_GUIDE.md#api-endpoints)
2. Check existing service: `frontend/src/app/routed/events/pages/ems.service.ts`
3. Implement UI integration (see [Frontend Integration](#frontend-integration) below)

### For DevOps/Operations
1. Review deployment instructions: [METRIC_SOURCES_GUIDE.md](METRIC_SOURCES_GUIDE.md#installation)
2. Set up monitoring: [METRIC_SOURCES_IMPLEMENTATION_SUMMARY.md](METRIC_SOURCES_IMPLEMENTATION_SUMMARY.md#monitoring--alerting)
3. Review security: [METRIC_SOURCES_GUIDE.md](METRIC_SOURCES_GUIDE.md#security-considerations)

### For QA/Testing
1. Run automated tests: `./test_metric_sources.sh`
2. Manual testing checklist: [METRIC_SOURCES_IMPLEMENTATION_SUMMARY.md](METRIC_SOURCES_IMPLEMENTATION_SUMMARY.md#testing-checklist)
3. Database queries: `check_metric_sources.sql`

## File Structure

```
go-service-template/
├── go-api/
│   ├── db/
│   │   └── migrations/
│   │       ├── 000011_create_metric_sources_table.up.sql
│   │       └── 000011_create_metric_sources_table.down.sql
│   ├── models/
│   │   └── metric_source.go
│   ├── repository/
│   │   └── metric_source_repository.go
│   ├── handlers/
│   │   └── metric_source_handler.go
│   ├── services/
│   │   └── metric_importer.go
│   ├── router/
│   │   └── router.go (updated)
│   ├── main.go (updated)
│   └── go.mod (updated)
├── frontend/
│   └── src/app/routed/events/pages/
│       └── ems.service.ts (existing)
├── METRIC_SOURCES_README.md (this file)
├── METRIC_SOURCES_QUICKSTART.md
├── METRIC_SOURCES_GUIDE.md
├── METRIC_SOURCES_IMPLEMENTATION_SUMMARY.md
├── test_metric_sources.sh
└── check_metric_sources.sql
```

## API Overview

**Base URL**: `http://localhost:8081/api/ems`

**Authentication**: Required (Keycloak Bearer token)

**Authorization**: ROLE_ADMIN required for create/update/delete

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/ems` | List all sources |
| GET | `/api/ems/{id}` | Get specific source |
| POST | `/api/ems` | Create new source (ADMIN) |
| PUT | `/api/ems/{id}` | Update source (ADMIN) |
| DELETE | `/api/ems/{id}` | Delete source (ADMIN) |

## Supported Connection Types

- **FTP** - File Transfer Protocol (plain text)
- **SFTP** - SSH File Transfer Protocol (encrypted)
- **HTTP** - HTTP/HTTPS endpoints
- **File** - Local file system

## Quick Test

```bash
# 1. Install dependencies
cd go-api && go mod download && cd ..

# 2. Restart service
docker-compose restart go-api

# 3. Run test
./test_metric_sources.sh

# 4. Check results
curl "http://localhost:8428/api/v1/query?query=ems_test_counter"
```

## Frontend Integration

### Current State
The frontend service (`ems.service.ts`) already exists with the interface:

```typescript
export interface Subs {
  id: number;
  source_name: string;
  description: string;
  connection_type: string;
  host: string;
  FTPport: string;
  file_path: string;
  username: string;
  password: string;
  schedule: string;
}
```

### Required Changes

1. **Update Interface** - Add status fields:
```typescript
export interface Subs {
  id: number;
  source_name: string;
  description: string;
  connection_type: string;
  host: string;
  FTPport: number; // Changed from string
  file_path: string;
  username: string;
  password: string;
  schedule: string;
  enabled: boolean;
  last_sync_at?: string;
  last_sync_status?: 'pending' | 'success' | 'error';
  last_sync_error?: string;
  created_at: string;
  updated_at: string;
}
```

2. **Update Service Methods** - Already implemented:
   - ✓ `getAll()`
   - ✓ `getById(id)`
   - ✓ `create(payload)`
   - ✓ `update(id, payload)`
   - ✓ `delete(id)`

3. **UI Components Needed**:
   - Connection type selector (dropdown)
   - Schedule input with validation
   - Status indicator (badge/icon)
   - Last sync timestamp display
   - Error message display
   - Enable/disable toggle

### Example UI Implementation

```typescript
// In your component
connectionTypes = [
  { value: 'ftp', label: 'FTP' },
  { value: 'sftp', label: 'SFTP (Secure)' },
  { value: 'http', label: 'HTTP/HTTPS' },
  { value: 'file', label: 'Local File' }
];

scheduleExamples = [
  { value: '1m', label: 'Every minute' },
  { value: '5m', label: 'Every 5 minutes' },
  { value: '15m', label: 'Every 15 minutes' },
  { value: '1h', label: 'Every hour' }
];

getStatusIcon(status: string): string {
  switch(status) {
    case 'success': return '✓';
    case 'error': return '✗';
    case 'pending': return '⏳';
    default: return '?';
  }
}

getStatusColor(status: string): string {
  switch(status) {
    case 'success': return 'green';
    case 'error': return 'red';
    case 'pending': return 'orange';
    default: return 'gray';
  }
}
```

## Database Queries

Use the provided SQL file to check the system:

```bash
# Run all checks
docker-compose exec db psql -U user -d appdb -f /path/to/check_metric_sources.sql

# Or run specific queries
docker-compose exec db psql -U user -d appdb -c "SELECT * FROM metric_sources;"
```

Common queries in `check_metric_sources.sql`:
- Check if table exists
- Show table structure
- List all sources
- Show sources with errors
- Show sync success rate
- Show sources needing attention

## Monitoring

### Check Service Status
```bash
# View logs
docker-compose logs -f go-api | grep "metric importer"

# Check if service is running
docker-compose ps go-api
```

### Check Sync Status
```bash
# Get token
TOKEN="your_jwt_token_here"

# List all sources with status
curl -H "Authorization: Bearer $TOKEN" http://localhost:8081/api/ems | jq

# Check specific source
curl -H "Authorization: Bearer $TOKEN" http://localhost:8081/api/ems/1 | jq
```

### Check VictoriaMetrics
```bash
# Health check
curl http://localhost:8428/health

# Query imported metrics
curl "http://localhost:8428/api/v1/query?query={__name__=~'.*ems.*'}"
```

## Troubleshooting

### Service won't start
```bash
docker-compose logs go-api | tail -50
```

**Common causes**:
- Migration failed (check database)
- Missing dependencies (run `go mod download`)
- Port conflict (check port 8081)

### Source shows "error" status
```bash
# Check error message
curl -H "Authorization: Bearer $TOKEN" http://localhost:8081/api/ems/1 | jq '.last_sync_error'
```

**Common causes**:
- Wrong credentials
- Incorrect file path
- Network connectivity
- File format issues

### Metrics not imported
```bash
# Verify source is enabled
curl -H "Authorization: Bearer $TOKEN" http://localhost:8081/api/ems/1 | jq '.enabled'

# Check VictoriaMetrics is accessible
curl http://localhost:8428/health

# Review logs
docker-compose logs go-api | grep -A5 "Successfully synced"
```

## Security Notes

⚠️ **Important**: Current implementation stores passwords in plain text.

**Before production deployment**:
1. Implement password encryption
2. Use secrets management service
3. Enable HTTPS/TLS
4. Set up audit logging
5. Configure network security
6. Review [Security section](METRIC_SOURCES_GUIDE.md#security-considerations)

## Performance

**Current Limits**:
- Check interval: 1 minute
- Connection timeout: 30 seconds
- No file size limit
- Unlimited concurrent syncs

**Recommendations**:
- Keep files under 10MB
- Use intervals ≥ 1 minute
- Monitor VictoriaMetrics performance
- See [Performance section](METRIC_SOURCES_IMPLEMENTATION_SUMMARY.md#performance-considerations)

## Development Workflow

### Adding a New Connection Type

1. Add enum to `models/metric_source.go`:
```go
const (
    ConnectionTypeS3 ConnectionType = "s3"
)
```

2. Implement fetcher in `services/metric_importer.go`:
```go
func (s *MetricImporterService) fetchFromS3(source *models.MetricSource) (string, error) {
    // Implementation
}
```

3. Add to dispatcher:
```go
case models.ConnectionTypeS3:
    return s.fetchFromS3(source)
```

4. Update documentation
5. Add tests

### Debugging Tips

```bash
# Enable debug logging
docker-compose exec go-api env SLOG_LEVEL=debug

# Watch specific source
watch -n 5 'curl -s -H "Authorization: Bearer $TOKEN" http://localhost:8081/api/ems/1 | jq'

# Monitor database
watch -n 5 'docker-compose exec db psql -U user -d appdb -c "SELECT id, source_name, last_sync_status, last_sync_at FROM metric_sources;"'
```

## Resources

### External Documentation
- [Prometheus Exposition Format](https://prometheus.io/docs/instrumenting/exposition_formats/)
- [VictoriaMetrics Import API](https://docs.victoriametrics.com/#how-to-import-data-in-prometheus-exposition-format)
- [Go FTP Library](https://github.com/jlaffaye/ftp)
- [Go SFTP Library](https://github.com/pkg/sftp)

### Internal Documentation
- [METRIC_SOURCES_GUIDE.md](METRIC_SOURCES_GUIDE.md) - Complete guide
- [METRIC_SOURCES_QUICKSTART.md](METRIC_SOURCES_QUICKSTART.md) - Quick start
- [METRIC_SOURCES_IMPLEMENTATION_SUMMARY.md](METRIC_SOURCES_IMPLEMENTATION_SUMMARY.md) - Implementation details

### Tools
- [test_metric_sources.sh](test_metric_sources.sh) - Automated test script
- [check_metric_sources.sql](check_metric_sources.sql) - Database queries

## FAQ

**Q: Can I use this with Prometheus instead of VictoriaMetrics?**
A: Yes, but you'll need to modify the service to use Prometheus Remote Write API.

**Q: How do I test without a real FTP server?**
A: Use the "file" connection type with a local file for testing.

**Q: Can I import metrics retroactively?**
A: No, the system only imports current metrics. Consider using VictoriaMetrics import tools for historical data.

**Q: What happens if VictoriaMetrics is down?**
A: The sync will fail and be marked as "error". It will retry on the next cycle.

**Q: How do I backup my sources?**
A: Use `pg_dump` to backup the `metric_sources` table.

**Q: Can I have different schedules for different sources?**
A: Yes, each source has its own schedule configuration.

## Next Steps

1. ✅ Review this README
2. ✅ Follow [Quick Start Guide](METRIC_SOURCES_QUICKSTART.md)
3. ⬜ Run `test_metric_sources.sh`
4. ⬜ Integrate with frontend
5. ⬜ Test with real data sources
6. ⬜ Implement security enhancements
7. ⬜ Deploy to staging
8. ⬜ Production deployment

## Support

For questions or issues:
1. Check this README
2. Review documentation links above
3. Check logs: `docker-compose logs -f go-api`
4. Run database queries: `check_metric_sources.sql`
5. Create an issue with:
   - Error message
   - Source configuration (without credentials)
   - Relevant logs
   - Steps to reproduce

---

**Last Updated**: February 2, 2026
**Version**: 1.0.0
**Status**: ✅ Ready for testing
