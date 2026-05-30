-- =============================================================
-- Create subscriptions table + seed data
-- Idempotent: DROP IF EXISTS then recreate
-- =============================================================

CREATE OR REPLACE FUNCTION remove_diacritics(input text)
RETURNS text AS $$
DECLARE
  result text := input;
BEGIN
  result := replace(result, 'ạ', 'a');
  result := replace(result, 'ả', 'a');
  result := replace(result, 'ã', 'a');
  result := replace(result, 'á', 'a');
  result := replace(result, 'à', 'a');
  result := replace(result, 'ă', 'a');
  result := replace(result, 'ắ', 'a');
  result := replace(result, 'ằ', 'a');
  result := replace(result, 'ặ', 'a');
  result := replace(result, 'ẳ', 'a');
  result := replace(result, 'â', 'a');
  result := replace(result, 'ấ', 'a');
  result := replace(result, 'ầ', 'a');
  result := replace(result, 'ẩ', 'a');
  result := replace(result, 'ậ', 'a');
  result := replace(result, 'đ', 'd');
  result := replace(result, 'è', 'e');
  result := replace(result, 'é', 'e');
  result := replace(result, 'ẻ', 'e');
  result := replace(result, 'ẽ', 'e');
  result := replace(result, 'ẹ', 'e');
  result := replace(result, 'ê', 'e');
  result := replace(result, 'ề', 'e');
  result := replace(result, 'ế', 'e');
  result := replace(result, 'ể', 'e');
  result := replace(result, 'ệ', 'e');
  result := replace(result, 'ì', 'i');
  result := replace(result, 'í', 'i');
  result := replace(result, 'ỉ', 'i');
  result := replace(result, 'ĩ', 'i');
  result := replace(result, 'ị', 'i');
  result := replace(result, 'ò', 'o');
  result := replace(result, 'ó', 'o');
  result := replace(result, 'ỏ', 'o');
  result := replace(result, 'õ', 'o');
  result := replace(result, 'ọ', 'o');
  result := replace(result, 'ô', 'o');
  result := replace(result, 'ồ', 'o');
  result := replace(result, 'ố', 'o');
  result := replace(result, 'ổ', 'o');
  result := replace(result, 'ỗ', 'o');
  result := replace(result, 'ơ', 'o');
  result := replace(result, 'ờ', 'o');
  result := replace(result, 'ớ', 'o');
  result := replace(result, 'ở', 'o');
  result := replace(result, 'ỡ', 'o');
  result := replace(result, 'ù', 'u');
  result := replace(result, 'ú', 'u');
  result := replace(result, 'ủ', 'u');
  result := replace(result, 'ũ', 'u');
  result := replace(result, 'ụ', 'u');
  result := replace(result, 'ư', 'u');
  result := replace(result, 'ừ', 'u');
  result := replace(result, 'ứ', 'u');
  result := replace(result, 'ử', 'u');
  result := replace(result, 'ữ', 'u');
  result := replace(result, 'ỳ', 'y');
  result := replace(result, 'ý', 'y');
  result := replace(result, 'ỷ', 'y');
  result := replace(result, 'ỹ', 'y');
  result := replace(result, 'ỵ', 'y');
  RETURN result;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- === PEOPLE: add label + migrate name ===

ALTER TABLE people ADD COLUMN IF NOT EXISTS label VARCHAR(100);
UPDATE people SET label = name WHERE label IS NULL;
UPDATE people SET name = remove_diacritics(name);
ALTER TABLE people ALTER COLUMN label SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_people_name ON people(name);

-- === SUBSCRIPTIONS TABLE ===

DROP TABLE IF EXISTS subscriptions;

CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    person_id UUID NOT NULL REFERENCES people(id),
    account_id UUID NOT NULL REFERENCES accounts(id),
    category_id UUID REFERENCES categories(id),
    name VARCHAR(200) NOT NULL,
    amount BIGINT NOT NULL CHECK (amount > 0),
    price_per_cycle BIGINT NOT NULL DEFAULT 0,
    type VARCHAR(20) NOT NULL DEFAULT 'expense' CHECK (type IN ('income', 'expense')),
    frequency VARCHAR(20) NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
    day_of_month INT CHECK (day_of_month BETWEEN 1 AND 31),
    day_of_week INT CHECK (day_of_week BETWEEN 0 AND 6),
    slot_number INT DEFAULT 1,
    total_slots INT DEFAULT 1,
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    next_due DATE NOT NULL,
    last_synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_next_due ON subscriptions(next_due) WHERE is_active = TRUE;
CREATE INDEX idx_subscriptions_person ON subscriptions(person_id);

-- === SEED: Tuấn YouTube 2 slots ===

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
