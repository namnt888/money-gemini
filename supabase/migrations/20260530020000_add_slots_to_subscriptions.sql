-- =============================================================
-- Add slot_number and total_slots to subscriptions
-- Supports multiple slots per service (e.g., 2 YouTube slots)
-- =============================================================

ALTER TABLE subscriptions
  ADD COLUMN slot_number INT DEFAULT 1,
  ADD COLUMN total_slots INT DEFAULT 1;
