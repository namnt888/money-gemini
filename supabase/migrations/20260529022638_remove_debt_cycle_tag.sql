-- Remove redundant debt_cycle_tag (only income/expense now)
ALTER TABLE transactions
  DROP COLUMN IF EXISTS debt_cycle_tag;
