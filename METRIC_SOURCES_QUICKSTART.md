# Metric Sources (EMS) - Quick Start Guide

## Quick Setup (5 minutes)

### 1. Install Dependencies
```bash
cd go-api
go mod download
```

### 2. Restart the Service
```bash
cd ..
docker-compose restart go-api
```

The migration will run automatically and create the `metric_sources` table.

### 3. Verify Service is Running
```bash
docker-compose logs -f go-api | grep "metric importer"
```

You should see:
```
Starting metric importer service
```

## Quick Test

### Step 1: Create Test Metrics File
```bash
cat > /tmp/test_metrics.txt << 'EOF'
# TYPE test_counter counter
test_counter{source="ems_test",environment="dev"} 100

# TYPE test_gauge gauge
test_gauge{source="ems_test",environment="dev"} 42.5

# TYPE http_requests_total counter
http_requests_total{method="GET",status="200",source="ems"} 1234
http_requests_total{method="POST",status="201",source="ems"} 567
EOF
```

### Step 2: Get Authentication Token

First, login via the frontend or use this test endpoint:
```bash
# Get token from Keycloak (replace with your credentials)
TOKEN=$(curl -X POST "http://localhost:8080/realms/myrealm/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin" \
  -d "password=admin" \
  -d "grant_type=password" \
  -d "client_id=spa-client" \
  -d "client_secret=jym5bshxscBAQJqBsfo45hphL0oRdhx3" \
  | jq -r '.access_token')

echo "Token: $TOKEN"
```

### Step 3: Create Metric Source
```bash
curl -X POST http://localhost:8081/api/ems \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "source_name": "Test Local Metrics",
    "description": "Test source for development",
    "connection_type": "file",
    "host": "localhost",
    "FTPport": 0,
    "file_path": "/tmp/test_metrics.txt",
    "schedule": "1m",
    "enabled": true
  }' | jq
```

**Expected Response:**
```json
{
  "id": 1,
  "source_name": "Test Local Metrics",
  "description": "Test source for development",
  "connection_type": "file",
  "host": "localhost",
  "FTPport": 0,
  "file_path": "/tmp/test_metrics.txt",
  "schedule": "1m",
  "enabled": true,
  "created_at": "2026-02-02T12:00:00Z",
  "updated_at": "2026-02-02T12:00:00Z"
}
```

### Step 4: Wait and Check Logs
Wait up to 1 minute and check logs:
```bash
docker-compose logs -f go-api | grep -E "(Syncing source|Successfully synced)"
```

You should see:
```
Syncing source: Test Local Metrics (ID: 1)
Successfully synced metrics from source Test Local Metrics
```

### Step 5: Verify Metrics in VictoriaMetrics
```bash
# Check if metrics were imported
curl "http://localhost:8428/api/v1/query?query=test_counter" | jq

# Expected output:
{
  "status": "success",
  "data": {
    "resultType": "vector",
    "result": [
      {
        "metric": {
          "__name__": "test_counter",
          "source": "ems_test",
          "environment": "dev"
        },
        "value": [1675349200, "100"]
      }
    ]
  }
}
```

### Step 6: Check Source Status
```bash
curl http://localhost:8081/api/ems/1 \
  -H "Authorization: Bearer $TOKEN" | jq
```

Check these fields:
- `last_sync_status`: Should be `"success"`
- `last_sync_at`: Should have a recent timestamp
- `last_sync_error`: Should be `null`

## Testing Different Connection Types

### FTP Example (if you have FTP server)
```bash
curl -X POST http://localhost:8081/api/ems \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "source_name": "FTP Metrics Server",
    "connection_type": "ftp",
    "host": "ftp.example.com",
    "FTPport": 21,
    "file_path": "/metrics/data.txt",
    "username": "ftpuser",
    "password": "ftppass",
    "schedule": "5m",
    "enabled": true
  }' | jq
```

### HTTP Example
```bash
# First, start a simple HTTP server with metrics
cat > /tmp/http_metrics.txt << 'EOF'
http_test_metric{label="value"} 123
EOF

cd /tmp && python3 -m http.server 8888 &

# Create HTTP source
curl -X POST http://localhost:8081/api/ems \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "source_name": "HTTP Metrics Server",
    "connection_type": "http",
    "host": "localhost",
    "FTPport": 8888,
    "file_path": "/http_metrics.txt",
    "schedule": "1m",
    "enabled": true
  }' | jq
```

## Common Operations

### List All Sources
```bash
curl http://localhost:8081/api/ems \
  -H "Authorization: Bearer $TOKEN" | jq
```

### Update Source Schedule
```bash
curl -X PUT http://localhost:8081/api/ems/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "schedule": "10m"
  }' | jq
```

### Disable Source
```bash
curl -X PUT http://localhost:8081/api/ems/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "enabled": false
  }' | jq
```

### Delete Source
```bash
curl -X DELETE http://localhost:8081/api/ems/1 \
  -H "Authorization: Bearer $TOKEN"
```

## Troubleshooting

### Issue: "metric source not found" after creation
**Solution:** Source was created. Use GET to retrieve it:
```bash
curl http://localhost:8081/api/ems \
  -H "Authorization: Bearer $TOKEN" | jq
```

### Issue: "Forbidden: ROLE_ADMIN required"
**Solution:** Ensure your user has ROLE_ADMIN role in Keycloak:
1. Open Keycloak admin console: http://localhost:8080
2. Go to Users → Your user → Role Mappings
3. Add `ROLE_ADMIN` from realm roles

### Issue: Sync status shows "error"
**Solution:** Check the error message:
```bash
curl http://localhost:8081/api/ems/1 \
  -H "Authorization: Bearer $TOKEN" | jq '.last_sync_error'
```

Common errors:
- `"failed to open file"` → Check file path exists
- `"failed to connect"` → Check host/port/credentials
- `"no valid metrics found"` → Check file format

### Issue: Metrics not appearing in VictoriaMetrics
**Solution:**
1. Check source status is "success"
2. Check VictoriaMetrics is running:
   ```bash
   curl http://localhost:8428/health
   ```
3. Check backend logs for errors:
   ```bash
   docker-compose logs go-api | grep -i error
   ```

## Next Steps

1. **Frontend Integration**: Connect the UI to these endpoints
2. **Production Setup**: 
   - Encrypt passwords in database
   - Use secure connections (SFTP, HTTPS)
   - Set up monitoring alerts
3. **Advanced Configuration**:
   - Add more sources
   - Experiment with different schedules
   - Monitor performance

## Testing with UI

Once the frontend is connected, you can test via the UI:

1. Navigate to the EMS/Events page
2. Look for "Текущие подписки" (Current Subscriptions) section
3. Click "Add Source" or similar button
4. Fill in the form:
   - **Source Name**: "Test Source"
   - **Connection Type**: "file"
   - **Host**: "localhost"
   - **Port**: 0
   - **File Path**: "/tmp/test_metrics.txt"
   - **Schedule**: "1m"
5. Save and wait 1 minute
6. Check the status updates in the table

## Production Checklist

Before deploying to production:

- [ ] Install FTP/SFTP dependencies: `go mod download`
- [ ] Run migration to create table
- [ ] Configure secure credentials storage
- [ ] Set up monitoring for sync failures
- [ ] Test with real data sources
- [ ] Configure appropriate schedules (not too frequent)
- [ ] Set up backup of metric_sources table
- [ ] Document your metric sources
- [ ] Test failure scenarios (network issues, wrong credentials)
- [ ] Configure alerting for sync errors

## Support

For issues or questions:
1. Check logs: `docker-compose logs -f go-api`
2. Check database: `docker-compose exec db psql -U user -d appdb -c "SELECT * FROM metric_sources;"`
3. Verify VictoriaMetrics: `curl http://localhost:8428/health`
4. Review full documentation: `METRIC_SOURCES_GUIDE.md`
