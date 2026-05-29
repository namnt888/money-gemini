-- 1. Create shops table
CREATE TABLE shops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add shop_id and shop_source to transactions
ALTER TABLE transactions
  ADD COLUMN shop_id UUID REFERENCES shops(id),
  ADD COLUMN shop_source VARCHAR(100);
