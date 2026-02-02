#!/bin/bash
# Quick EMS status check

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 EMS Status Check"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check backend
echo "1. Backend status:"
curl -s http://localhost:8081/probes/readiness && echo " ✓" || echo " ✗"
echo ""

# Check database
echo "2. Database - Current sources:"
docker-compose exec -T db psql -U user -d appdb << 'EOSQL'
SELECT 
    id,
    source_name as name,
    CASE 
        WHEN last_sync_status = 'success' THEN '✓'
        WHEN last_sync_status = 'error' THEN '✗'
        ELSE '—'
    END as status,
    to_char(last_sync_at, 'HH24:MI:SS') as time
FROM metric_sources;
EOSQL
echo ""

# Check VictoriaMetrics
echo "3. VictoriaMetrics - EMS metrics count:"
METRICS=$(curl -s "http://localhost:8428/api/v1/label/__name__/values" | jq -r '.data[] | select(startswith("ems"))' | wc -l | xargs)
echo "   Found $METRICS metric types"
echo ""

# Show sample metrics
echo "4. Sample metrics:"
curl -s "http://localhost:8428/api/v1/query?query=ems_test_counter" | \
  jq -r '.data.result[] | "   • \(.metric.node): \(.value[1])"' 2>/dev/null || echo "   (query VictoriaMetrics to see values)"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "💻 Open UI: http://localhost:4200/ems"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
