CREATE TABLE IF NOT EXISTS metrics_configuration (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    unit VARCHAR(100),
    degradation VARCHAR(100),
    "group" VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for the unique name column for better query performance
CREATE INDEX IF NOT EXISTS idx_metrics_configuration_name ON metrics_configuration(name);

-- Create index for the group column for better query performance
CREATE INDEX IF NOT EXISTS idx_metrics_configuration_group ON metrics_configuration("group");


