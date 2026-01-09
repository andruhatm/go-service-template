-- Fix dirty migration state
-- This script resets the migration to a clean state

-- Check current state
SELECT version, dirty FROM schema_migrations;

-- Option 1: If the forecasts table was partially created, drop it and reset
DROP TABLE IF EXISTS forecasts CASCADE;
UPDATE schema_migrations SET version = 8, dirty = false;

-- Option 2: If the forecasts table was fully created, just mark as clean
-- UPDATE schema_migrations SET version = 9, dirty = false;

-- Verify
SELECT version, dirty FROM schema_migrations;

