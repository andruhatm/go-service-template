-- SQL queries for checking Metric Sources (EMS) implementation
-- Usage: docker-compose exec db psql -U user -d appdb -f /path/to/check_metric_sources.sql

-- 1. Check if table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'metric_sources'
) AS table_exists;

-- 2. Show table structure
\d metric_sources

-- 3. List all indexes on metric_sources table
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'metric_sources'
ORDER BY indexname;

-- 4. Count total sources
SELECT COUNT(*) AS total_sources FROM metric_sources;

-- 5. Count enabled vs disabled sources
SELECT 
    enabled,
    COUNT(*) AS count
FROM metric_sources
GROUP BY enabled;

-- 6. List all sources with basic info
SELECT 
    id,
    source_name,
    connection_type,
    host,
    port,
    schedule,
    enabled,
    last_sync_status,
    last_sync_at
FROM metric_sources
ORDER BY created_at DESC;

-- 7. Show sources by connection type
SELECT 
    connection_type,
    COUNT(*) AS count,
    COUNT(CASE WHEN enabled THEN 1 END) AS enabled_count
FROM metric_sources
GROUP BY connection_type
ORDER BY count DESC;

-- 8. Show recent sync activity (last 24 hours)
SELECT 
    id,
    source_name,
    last_sync_at,
    last_sync_status,
    last_sync_error,
    EXTRACT(EPOCH FROM (NOW() - last_sync_at))/60 AS minutes_since_sync
FROM metric_sources
WHERE last_sync_at > NOW() - INTERVAL '24 hours'
ORDER BY last_sync_at DESC;

-- 9. Show sources with errors
SELECT 
    id,
    source_name,
    connection_type,
    last_sync_status,
    last_sync_error,
    last_sync_at
FROM metric_sources
WHERE last_sync_status = 'error'
ORDER BY last_sync_at DESC;

-- 10. Show sources that haven't synced recently (>1 hour)
SELECT 
    id,
    source_name,
    enabled,
    schedule,
    last_sync_at,
    EXTRACT(EPOCH FROM (NOW() - last_sync_at))/60 AS minutes_since_sync
FROM metric_sources
WHERE enabled = true 
  AND (last_sync_at IS NULL OR last_sync_at < NOW() - INTERVAL '1 hour')
ORDER BY last_sync_at ASC NULLS FIRST;

-- 11. Show sync success rate per source
SELECT 
    id,
    source_name,
    last_sync_status,
    CASE 
        WHEN last_sync_status = 'success' THEN '✓ Success'
        WHEN last_sync_status = 'error' THEN '✗ Error'
        WHEN last_sync_status = 'pending' THEN '⏳ Pending'
        ELSE '? Unknown'
    END AS status_indicator,
    last_sync_at,
    COALESCE(last_sync_error, 'No error') AS error_message
FROM metric_sources
ORDER BY 
    CASE last_sync_status
        WHEN 'error' THEN 1
        WHEN 'pending' THEN 2
        WHEN 'success' THEN 3
        ELSE 4
    END,
    last_sync_at DESC NULLS LAST;

-- 12. Show detailed info for a specific source (change ID as needed)
-- SELECT * FROM metric_sources WHERE id = 1;

-- 13. Show sources created by each user
SELECT 
    COALESCE(created_by, 'System') AS creator,
    COUNT(*) AS sources_created,
    COUNT(CASE WHEN enabled THEN 1 END) AS enabled_sources
FROM metric_sources
GROUP BY created_by
ORDER BY sources_created DESC;

-- 14. Show average sync time by connection type (if you track this)
SELECT 
    connection_type,
    COUNT(*) AS total_sources,
    COUNT(CASE WHEN last_sync_status = 'success' THEN 1 END) AS successful_syncs,
    COUNT(CASE WHEN last_sync_status = 'error' THEN 1 END) AS failed_syncs,
    ROUND(
        COUNT(CASE WHEN last_sync_status = 'success' THEN 1 END)::NUMERIC / 
        NULLIF(COUNT(*), 0) * 100, 
        2
    ) AS success_rate_percent
FROM metric_sources
GROUP BY connection_type
ORDER BY total_sources DESC;

-- 15. Show sources that need attention
SELECT 
    id,
    source_name,
    CASE 
        WHEN NOT enabled THEN '⚠ Disabled'
        WHEN last_sync_status = 'error' THEN '✗ Error: ' || COALESCE(SUBSTRING(last_sync_error, 1, 50), 'Unknown')
        WHEN last_sync_at IS NULL THEN '⏳ Never synced'
        WHEN last_sync_at < NOW() - INTERVAL '1 hour' AND enabled THEN '⏰ Stale (>1hr)'
        ELSE '✓ OK'
    END AS status,
    last_sync_at
FROM metric_sources
WHERE 
    NOT enabled 
    OR last_sync_status = 'error'
    OR last_sync_at IS NULL
    OR (last_sync_at < NOW() - INTERVAL '1 hour' AND enabled)
ORDER BY 
    CASE 
        WHEN last_sync_status = 'error' THEN 1
        WHEN last_sync_at IS NULL THEN 2
        WHEN NOT enabled THEN 3
        ELSE 4
    END;

-- 16. Show table size and row count
SELECT 
    pg_size_pretty(pg_total_relation_size('metric_sources')) AS total_size,
    pg_size_pretty(pg_relation_size('metric_sources')) AS table_size,
    pg_size_pretty(pg_total_relation_size('metric_sources') - pg_relation_size('metric_sources')) AS indexes_size,
    (SELECT COUNT(*) FROM metric_sources) AS row_count;

-- 17. Show recent changes (last 10)
SELECT 
    id,
    source_name,
    created_at,
    updated_at,
    EXTRACT(EPOCH FROM (updated_at - created_at))/3600 AS hours_between_create_and_update
FROM metric_sources
ORDER BY updated_at DESC
LIMIT 10;

-- Quick commands reference:
-- \x                    -- Toggle expanded display (useful for wide rows)
-- \q                    -- Quit psql
-- \dt                   -- List all tables
-- \d metric_sources     -- Show table structure
