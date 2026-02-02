-- Remove auto-refresh fields from forecasts table
DROP INDEX IF EXISTS idx_forecasts_auto_refresh;

ALTER TABLE forecasts 
DROP COLUMN IF EXISTS auto_refresh_enabled,
DROP COLUMN IF EXISTS refresh_interval,
DROP COLUMN IF EXISTS last_refresh_at,
DROP COLUMN IF EXISTS next_refresh_at;
