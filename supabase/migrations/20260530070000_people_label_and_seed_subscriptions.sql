-- =============================================================
-- 1. Add label column to people (name = no diacritics, label = display)
-- 2. Seed test subscriptions for Tuấn
-- =============================================================

-- === PEOPLE: add label + migrate name ===

ALTER TABLE people ADD COLUMN label VARCHAR(100);

UPDATE people SET label = name;

-- Convert name to non-diacritics (Vietnamese)
UPDATE people SET name =
  REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
  REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
  REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
  REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
  REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
  REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
  REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
  REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
    name,
    'ạ','a'), 'ả','a'), 'ã','a'), 'á','a'), 'à','a'),
    'ă','a'), 'ắ','a'), 'ằ','a'), 'ặ','a'), 'ẳ','a'),
    'â','a'), 'ấ','a'), 'ầ','a'), 'ẩ','a'), 'ậ','a'),
    'đ','d'),
    'è','e'), 'é','e'), 'ẻ','e'), 'ẽ','e'), 'ẹ','e'),
    'ê','e'), 'ề','e'), 'ế','e'), 'ể','e'), 'ệ','e'),
    'ì','i'), 'í','i'), 'ỉ','i'), 'ĩ','i'), 'ị','i'),
    'ò','o'), 'ó','o'), 'ỏ','o'), 'õ','o'), 'ọ','o'),
    'ô','o'), 'ồ','o'), 'ố','o'), 'ổ','o'), 'ỗ','o'),
    'ơ','o'), 'ờ','o'), 'ớ','o'), 'ở','o'), 'ỡ','o'),
    'ù','u'), 'ú','u'), 'ủ','u'), 'ũ','u'), 'ụ','u'),
    'ư','u'), 'ừ','u'), 'ứ','u'), 'ử','u'), 'ữ','u'),
    'ỳ','y'), 'ý','y'), 'ỷ','y'), 'ỹ','y'), 'ỵ','y');

ALTER TABLE people ALTER COLUMN label SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_people_name ON people(name);

-- === SUBSCRIPTIONS: clean + seed ===

DELETE FROM subscriptions;

-- tcs 1: short notes (default)
INSERT INTO subscriptions (person_id, account_id, name, amount, price_per_cycle, type, frequency, next_due, slot_number, total_slots)
VALUES (
  (SELECT id FROM people WHERE name = 'Tuan' LIMIT 1),
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

-- tcs 2: long notes
INSERT INTO subscriptions (person_id, account_id, name, amount, price_per_cycle, type, frequency, next_due, slot_number, total_slots, notes)
VALUES (
  (SELECT id FROM people WHERE name = 'Tuan' LIMIT 1),
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
