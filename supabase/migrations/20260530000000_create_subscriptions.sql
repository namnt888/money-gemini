-- =============================================================
-- Create subscriptions table + seed data
-- Idempotent: DROP IF EXISTS then recreate
-- =============================================================

DROP TABLE IF EXISTS subscriptions;

CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    person_id UUID NOT NULL REFERENCES people(id),
    account_id UUID NOT NULL REFERENCES accounts(id),
    category_id UUID REFERENCES categories(id),
    name VARCHAR(200) NOT NULL,
    amount BIGINT NOT NULL CHECK (amount > 0),        -- per-slot amount
    price_per_cycle BIGINT NOT NULL DEFAULT 0,          -- total service price per cycle
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

-- Fast lookup for cron: find all active subscriptions due today or earlier
CREATE INDEX idx_subscriptions_next_due ON subscriptions(next_due) WHERE is_active = TRUE;

-- Lookup by person
CREATE INDEX idx_subscriptions_person ON subscriptions(person_id);

-- =============================================================
-- SEED: Tuấn YouTube 2 slots
-- Giá tổng service = 170,000/tháng, 6 slots
-- Per slot = 170,000 / 6 = 28,333
-- Tuấn có 2 slot → 2 rows
-- =============================================================

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
  2,
  6
);
