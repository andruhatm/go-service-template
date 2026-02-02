-- Add file tracking fields to prevent duplicate imports
ALTER TABLE metric_sources 
ADD COLUMN IF NOT EXISTS last_file_hash VARCHAR(64),
ADD COLUMN IF NOT EXISTS last_file_mod_time TIMESTAMP;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_metric_sources_last_file_hash ON metric_sources(last_file_hash);

COMMENT ON COLUMN metric_sources.last_file_hash IS 'SHA256 hash of last imported file content to detect changes';
COMMENT ON COLUMN metric_sources.last_file_mod_time IS 'Last modification time of the imported file';
