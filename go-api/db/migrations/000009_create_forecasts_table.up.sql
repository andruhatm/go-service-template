CREATE TABLE IF NOT EXISTS forecasts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL,
    mon_object_name VARCHAR(255) NOT NULL,
    metric_name VARCHAR(255) NOT NULL,
    from_timestamp BIGINT NOT NULL,
    forecast_periods INTEGER NOT NULL,
    freq VARCHAR(10) NOT NULL DEFAULT 'H',
    step VARCHAR(20) DEFAULT '1h',
    seasonality_mode VARCHAR(20) DEFAULT 'additive',
    changepoint_prior_scale DECIMAL(5,4) DEFAULT 0.05,
    status VARCHAR(50) DEFAULT 'pending',
    forecast_start_date TIMESTAMP,
    forecast_end_date TIMESTAMP,
    forecast_points INTEGER,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_forecasts_user_id ON forecasts(user_id);
CREATE INDEX IF NOT EXISTS idx_forecasts_mon_object_name ON forecasts(mon_object_name);
CREATE INDEX IF NOT EXISTS idx_forecasts_metric_name ON forecasts(metric_name);
CREATE INDEX IF NOT EXISTS idx_forecasts_status ON forecasts(status);
CREATE INDEX IF NOT EXISTS idx_forecasts_created_at ON forecasts(created_at DESC);

-- Create a composite index for user queries
CREATE INDEX IF NOT EXISTS idx_forecasts_user_created ON forecasts(user_id, created_at DESC);

COMMENT ON TABLE forecasts IS 'Stores forecast requests and their results';
COMMENT ON COLUMN forecasts.user_id IS 'Keycloak user ID who created the forecast';
COMMENT ON COLUMN forecasts.mon_object_name IS 'Name of the monitoring object (validated by application)';
COMMENT ON COLUMN forecasts.metric_name IS 'Name of the metric (validated by application)';
COMMENT ON COLUMN forecasts.from_timestamp IS 'Unix timestamp from which to use existing data';
COMMENT ON COLUMN forecasts.forecast_periods IS 'Number of periods to forecast';
COMMENT ON COLUMN forecasts.freq IS 'Frequency: H (hourly), D (daily), W (weekly), M (monthly)';
COMMENT ON COLUMN forecasts.step IS 'Step size for VictoriaMetrics query (e.g., 1h, 5m, 1d)';
COMMENT ON COLUMN forecasts.seasonality_mode IS 'Prophet seasonality mode: additive or multiplicative';
COMMENT ON COLUMN forecasts.changepoint_prior_scale IS 'Prophet trend flexibility parameter (0.001-1.0)';
COMMENT ON COLUMN forecasts.status IS 'Forecast status: pending, processing, completed, failed';
COMMENT ON COLUMN forecasts.forecast_start_date IS 'Start date of the forecast period';
COMMENT ON COLUMN forecasts.forecast_end_date IS 'End date of the forecast period';
COMMENT ON COLUMN forecasts.forecast_points IS 'Number of forecasted data points generated';
COMMENT ON COLUMN forecasts.error_message IS 'Error message if forecast failed';

