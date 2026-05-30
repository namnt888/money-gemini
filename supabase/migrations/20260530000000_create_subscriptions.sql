-- =============================================================
-- Create subscriptions table for recurring expenses/income
-- =============================================================

CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    person_id UUID NOT NULL REFERENCES people(id),
    account_id UUID NOT NULL REFERENCES accounts(id),
    category_id UUID REFERENCES categories(id),
    name VARCHAR(200) NOT NULL,
    amount BIGINT NOT NULL CHECK (amount > 0),
    type VARCHAR(20) NOT NULL DEFAULT 'expense' CHECK (type IN ('income', 'expense')),
    frequency VARCHAR(20) NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
    day_of_month INT CHECK (day_of_month BETWEEN 1 AND 31),
    day_of_week INT CHECK (day_of_week BETWEEN 0 AND 6),
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
