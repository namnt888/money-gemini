-- =============================================================
-- Seed test subscriptions (clean test data)
-- Tuấn YouTube 2 slots, 170k total, 6 slots, 28,333/slot
-- tcs 1: short notes
-- tcs 2: long notes
-- =============================================================

-- Clean old test data
DELETE FROM subscriptions;

-- tcs 1: notes mặc định
INSERT INTO subscriptions (person_id, account_id, name, amount, price_per_cycle, type, frequency, next_due, slot_number, total_slots)
VALUES (
  (SELECT id FROM people WHERE name ILIKE '%tuấn%' LIMIT 1),
  (SELECT id FROM accounts LIMIT 1),
  'Youtube',
  28333,
  170000,
  'expense',
  'monthly',
  CURRENT_DATE,
  1,
  6
);

-- tcs 2: notes dài
INSERT INTO subscriptions (person_id, account_id, name, amount, price_per_cycle, type, frequency, next_due, slot_number, total_slots, notes)
VALUES (
  (SELECT id FROM people WHERE name ILIKE '%tuấn%' LIMIT 1),
  (SELECT id FROM accounts LIMIT 1),
  'Youtube',
  28333,
  170000,
  'expense',
  'monthly',
  CURRENT_DATE,
  2,
  6,
  'for Tuan 2026 only'
);
