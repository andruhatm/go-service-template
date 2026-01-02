CREATE TABLE IF NOT EXISTS mon_objects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100),
    parent_id UUID,
    child_id UUID,
    technology VARCHAR(100),
    platform VARCHAR(100),
    network VARCHAR(100),
    manufacturer VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for foreign key columns and frequently queried fields
CREATE INDEX IF NOT EXISTS idx_mon_objects_parent_id ON mon_objects(parent_id);
CREATE INDEX IF NOT EXISTS idx_mon_objects_child_id ON mon_objects(child_id);
CREATE INDEX IF NOT EXISTS idx_mon_objects_type ON mon_objects(type);
CREATE INDEX IF NOT EXISTS idx_mon_objects_name ON mon_objects(name);

