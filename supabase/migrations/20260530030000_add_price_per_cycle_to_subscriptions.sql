-- =============================================================
-- Add price_per_cycle to subscriptions
-- Stores total service price per cycle (e.g., YouTube = 170,000)
-- amount = price_per_cycle / total_slots (per-slot cost)
-- =============================================================

ALTER TABLE subscriptions
  ADD COLUMN price_per_cycle BIGINT NOT NULL DEFAULT 0;
