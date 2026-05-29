-- Add financial columns to support Google Sheets sync (columns A-K)
ALTER TABLE transactions
  ADD COLUMN persisted_cycle_tag VARCHAR(10),
  ADD COLUMN debt_cycle_tag VARCHAR(10),
  ADD COLUMN cashback_share_percent DECIMAL DEFAULT 0,
  ADD COLUMN cashback_share_fixed BIGINT DEFAULT 0,
  ADD COLUMN final_price BIGINT;
