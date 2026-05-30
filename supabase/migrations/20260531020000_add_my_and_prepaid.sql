-- =============================================================
-- Add My to iCloud + prepaid support
-- =============================================================

-- Add prepaid_until column
ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS prepaid_until DATE;

-- Add My person
INSERT INTO people (name, label) VALUES ('My', 'My')
  ON CONFLICT DO NOTHING;

-- Add My's iCloud subscription (slot 6)
INSERT INTO subscriptions (person_id, account_id, name, amount, price_per_cycle, type, frequency, next_due, slot_number, total_slots)
VALUES (
  (SELECT id FROM people WHERE name = 'My'),
  (SELECT id FROM accounts LIMIT 1),
  'iCloud',
  258900,
  258900,
  'expense',
  'monthly',
  CURRENT_DATE,
  6,
  6
);
