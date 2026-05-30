-- =============================================================
-- Seed people + subscriptions
-- YT: 175,456/slot | iCloud: 258,900/slot
-- =============================================================

-- Clean old data
DELETE FROM subscriptions;
DELETE FROM transactions WHERE is_test = TRUE;

-- === PEOPLE ===
-- Tuấn already exists, skip
-- Add new people (name = no diacritics, label = display)

INSERT INTO people (name, label) VALUES ('Lam', 'Lâm')
  ON CONFLICT DO NOTHING;

INSERT INTO people (name, label) VALUES ('Rei', 'Me')
  ON CONFLICT DO NOTHING;

INSERT INTO people (name, label) VALUES ('Ngoc', 'Kannie')
  ON CONFLICT DO NOTHING;

INSERT INTO people (name, label) VALUES ('Thao', 'Thảo')
  ON CONFLICT DO NOTHING;

INSERT INTO people (name, label) VALUES ('Nam', 'Riddle')
  ON CONFLICT DO NOTHING;

INSERT INTO people (name, label) VALUES ('Huong', 'Zoe')
  ON CONFLICT DO NOTHING;

-- === SUBSCRIPTIONS ===

-- Unique constraint: 1 subscription per person per service per slot
ALTER TABLE subscriptions
  ADD CONSTRAINT IF NOT EXISTS uq_subscription_slot UNIQUE (person_id, name, slot_number);

-- Lâm: 2 iCloud + 2 Youtube
INSERT INTO subscriptions (person_id, account_id, name, amount, price_per_cycle, type, frequency, next_due, slot_number, total_slots)
VALUES
  ((SELECT id FROM people WHERE name = 'Lam'), (SELECT id FROM accounts LIMIT 1), 'iCloud', 258900, 258900, 'expense', 'monthly', CURRENT_DATE, 1, 6),
  ((SELECT id FROM people WHERE name = 'Lam'), (SELECT id FROM accounts LIMIT 1), 'iCloud', 258900, 258900, 'expense', 'monthly', CURRENT_DATE, 2, 6),
  ((SELECT id FROM people WHERE name = 'Lam'), (SELECT id FROM accounts LIMIT 1), 'Youtube', 175456, 175456, 'expense', 'monthly', CURRENT_DATE, 1, 6),
  ((SELECT id FROM people WHERE name = 'Lam'), (SELECT id FROM accounts LIMIT 1), 'Youtube', 175456, 175456, 'expense', 'monthly', CURRENT_DATE, 2, 6)
ON CONFLICT (person_id, name, slot_number) DO NOTHING;

-- Tuấn: 1 Youtube (already exists, re-create)
INSERT INTO subscriptions (person_id, account_id, name, amount, price_per_cycle, type, frequency, next_due, slot_number, total_slots)
VALUES
  ((SELECT id FROM people WHERE name = 'Tuan'), (SELECT id FROM accounts LIMIT 1), 'Youtube', 175456, 175456, 'expense', 'monthly', CURRENT_DATE, 3, 6)
ON CONFLICT (person_id, name, slot_number) DO NOTHING;

-- Me (Rei): 1 iCloud + 1 Youtube
INSERT INTO subscriptions (person_id, account_id, name, amount, price_per_cycle, type, frequency, next_due, slot_number, total_slots)
VALUES
  ((SELECT id FROM people WHERE name = 'Rei'), (SELECT id FROM accounts LIMIT 1), 'iCloud', 258900, 258900, 'expense', 'monthly', CURRENT_DATE, 3, 6),
  ((SELECT id FROM people WHERE name = 'Rei'), (SELECT id FROM accounts LIMIT 1), 'Youtube', 175456, 175456, 'expense', 'monthly', CURRENT_DATE, 4, 6)
ON CONFLICT (person_id, name, slot_number) DO NOTHING;

-- Kannie (Ngọc): 1 iCloud
INSERT INTO subscriptions (person_id, account_id, name, amount, price_per_cycle, type, frequency, next_due, slot_number, total_slots)
VALUES
  ((SELECT id FROM people WHERE name = 'Ngoc'), (SELECT id FROM accounts LIMIT 1), 'iCloud', 258900, 258900, 'expense', 'monthly', CURRENT_DATE, 4, 6)
ON CONFLICT (person_id, name, slot_number) DO NOTHING;

-- Thảo: 1 iCloud
INSERT INTO subscriptions (person_id, account_id, name, amount, price_per_cycle, type, frequency, next_due, slot_number, total_slots)
VALUES
  ((SELECT id FROM people WHERE name = 'Thao'), (SELECT id FROM accounts LIMIT 1), 'iCloud', 258900, 258900, 'expense', 'monthly', CURRENT_DATE, 5, 6)
ON CONFLICT (person_id, name, slot_number) DO NOTHING;

-- Riddle (Nam): 1 Youtube
INSERT INTO subscriptions (person_id, account_id, name, amount, price_per_cycle, type, frequency, next_due, slot_number, total_slots)
VALUES
  ((SELECT id FROM people WHERE name = 'Nam'), (SELECT id FROM accounts LIMIT 1), 'Youtube', 175456, 175456, 'expense', 'monthly', CURRENT_DATE, 5, 6)
ON CONFLICT (person_id, name, slot_number) DO NOTHING;

-- Zoe (Hương): 1 Youtube
INSERT INTO subscriptions (person_id, account_id, name, amount, price_per_cycle, type, frequency, next_due, slot_number, total_slots)
VALUES
  ((SELECT id FROM people WHERE name = 'Huong'), (SELECT id FROM accounts LIMIT 1), 'Youtube', 175456, 175456, 'expense', 'monthly', CURRENT_DATE, 6, 6)
ON CONFLICT (person_id, name, slot_number) DO NOTHING;
