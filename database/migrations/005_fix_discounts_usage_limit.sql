-- Add the usage limit column to databases created before migration 004.
SET @usage_limit_column_exists = (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'discounts'
    AND column_name = 'usage_limit'
);

SET @add_usage_limit_sql = IF(
  @usage_limit_column_exists = 0,
  'ALTER TABLE discounts ADD COLUMN usage_limit INT NULL AFTER end_date',
  'SELECT 1'
);

PREPARE add_usage_limit_statement FROM @add_usage_limit_sql;
EXECUTE add_usage_limit_statement;
DEALLOCATE PREPARE add_usage_limit_statement;
