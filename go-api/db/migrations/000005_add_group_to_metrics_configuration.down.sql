-- Drop index for the group column
DROP INDEX IF EXISTS idx_metrics_configuration_group;

-- Remove group column from metrics_configuration table
ALTER TABLE metrics_configuration DROP COLUMN IF EXISTS "group";

