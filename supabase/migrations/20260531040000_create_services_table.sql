-- =============================================================
-- Create services table (single source of truth for pricing)
-- =============================================================

CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  code VARCHAR(20) NOT NULL UNIQUE,
  price_per_cycle BIGINT NOT NULL,
  total_slots INT NOT NULL DEFAULT 6,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed services
INSERT INTO services (name, code, price_per_cycle, total_slots) VALUES
  ('Youtube', 'yt', 175456, 6),
  ('iCloud', 'ic', 258900, 6);

-- Add service_id to subscriptions
ALTER TABLE subscriptions
  ADD COLUMN service_id UUID REFERENCES services(id);

-- Link subscriptions to services
UPDATE subscriptions SET service_id = (SELECT id FROM services WHERE code = 'yt')
WHERE name = 'Youtube';

UPDATE subscriptions SET service_id = (SELECT id FROM services WHERE code = 'ic')
WHERE name = 'iCloud';

-- Make service_id NOT NULL after migration
ALTER TABLE subscriptions ALTER COLUMN service_id SET NOT NULL;

-- Index for fast lookup
CREATE INDEX idx_subscriptions_service ON subscriptions(service_id);
