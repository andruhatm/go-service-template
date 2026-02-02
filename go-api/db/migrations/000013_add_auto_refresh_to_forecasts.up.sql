-- Add auto-refresh fields to forecasts table for rolling window functionality
ALTER TABLE forecasts 
ADD COLUMN auto_refresh_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN refresh_interval VARCHAR(20) DEFAULT '1h',
ADD COLUMN last_refresh_at TIMESTAMP,
ADD COLUMN next_refresh_at TIMESTAMP;

-- Create index for efficient scheduling queries
CREATE INDEX IF NOT EXISTS idx_forecasts_auto_refresh 
ON forecasts(auto_refresh_enabled, next_refresh_at) 
WHERE auto_refresh_enabled = TRUE;

-- Add comments for new columns
COMMENT ON COLUMN forecasts.auto_refresh_enabled IS 'Enable automatic rolling window updates for this forecast';
COMMENT ON COLUMN forecasts.refresh_interval IS 'Interval for auto-refresh: 1h, 6h, 12h, 24h, etc.';
COMMENT ON COLUMN forecasts.last_refresh_at IS 'Timestamp of the last automatic refresh';
COMMENT ON COLUMN forecasts.next_refresh_at IS 'Timestamp when the next automatic refresh should occur';
