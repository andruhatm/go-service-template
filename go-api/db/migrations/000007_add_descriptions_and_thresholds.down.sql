-- Remove threshold and description columns from metrics_configuration table
ALTER TABLE metrics_configuration DROP COLUMN IF EXISTS description_ru;
ALTER TABLE metrics_configuration DROP COLUMN IF EXISTS threshold_critical;
ALTER TABLE metrics_configuration DROP COLUMN IF EXISTS threshold_warning;


