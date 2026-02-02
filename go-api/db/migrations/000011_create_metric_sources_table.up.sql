CREATE TABLE IF NOT EXISTS metric_sources (
    id SERIAL PRIMARY KEY,
    source_name VARCHAR(255) NOT NULL,
    description TEXT,
    connection_type VARCHAR(50) NOT NULL DEFAULT 'ftp', -- ftp, sftp, http, file
    host VARCHAR(255) NOT NULL,
    port INTEGER DEFAULT 21,
    file_path VARCHAR(500) NOT NULL,
    username VARCHAR(255),
    password VARCHAR(255),
    schedule VARCHAR(100) NOT NULL, -- cron expression or interval (e.g., "*/5 * * * *" or "5m")
    enabled BOOLEAN DEFAULT true,
    last_sync_at TIMESTAMP,
    last_sync_status VARCHAR(50), -- success, error, pending
    last_sync_error TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_metric_sources_enabled ON metric_sources(enabled);
CREATE INDEX IF NOT EXISTS idx_metric_sources_schedule ON metric_sources(schedule);
CREATE INDEX IF NOT EXISTS idx_metric_sources_last_sync ON metric_sources(last_sync_at DESC);
CREATE INDEX IF NOT EXISTS idx_metric_sources_connection_type ON metric_sources(connection_type);

COMMENT ON TABLE metric_sources IS 'Stores configuration for metric data sources (FTP, SFTP, HTTP, etc.)';
COMMENT ON COLUMN metric_sources.source_name IS 'Human-readable name for the metric source';
COMMENT ON COLUMN metric_sources.description IS 'Description of what metrics this source provides';
COMMENT ON COLUMN metric_sources.connection_type IS 'Type of connection: ftp, sftp, http, file';
COMMENT ON COLUMN metric_sources.host IS 'Hostname or IP address of the source';
COMMENT ON COLUMN metric_sources.port IS 'Port number for the connection';
COMMENT ON COLUMN metric_sources.file_path IS 'Path to the metrics file on the source';
COMMENT ON COLUMN metric_sources.username IS 'Username for authentication (if required)';
COMMENT ON COLUMN metric_sources.password IS 'Password for authentication (encrypted in production)';
COMMENT ON COLUMN metric_sources.schedule IS 'Collection frequency - cron expression or interval (e.g., "*/5 * * * *" or "5m")';
COMMENT ON COLUMN metric_sources.enabled IS 'Whether this source is active for metric collection';
COMMENT ON COLUMN metric_sources.last_sync_at IS 'Timestamp of the last successful sync';
COMMENT ON COLUMN metric_sources.last_sync_status IS 'Status of the last sync attempt';
COMMENT ON COLUMN metric_sources.last_sync_error IS 'Error message from the last failed sync attempt';
COMMENT ON COLUMN metric_sources.created_by IS 'User ID who created this source';
