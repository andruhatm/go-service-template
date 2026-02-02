-- Remove file tracking fields
DROP INDEX IF EXISTS idx_metric_sources_last_file_hash;

ALTER TABLE metric_sources 
DROP COLUMN IF EXISTS last_file_mod_time,
DROP COLUMN IF EXISTS last_file_hash;
