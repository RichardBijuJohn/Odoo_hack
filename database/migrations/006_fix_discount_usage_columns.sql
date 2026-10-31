-- Apply once to an existing Brightloop database where the discounts table
-- was created before usage tracking was added.

ALTER TABLE discounts
  ADD COLUMN usage_limit INT NULL AFTER end_date,
  ADD COLUMN used_count INT NOT NULL DEFAULT 0 AFTER usage_limit;
