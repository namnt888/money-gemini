-- =============================================================
-- Update cashback + add income txn for Tuan
-- =============================================================

-- Ensure Vpbank account exists
INSERT INTO accounts (name, type, is_active)
VALUES ('Vpbank', 'bank', TRUE)
ON CONFLICT DO NOTHING;

-- Update existing txn to 2.2% cashback
UPDATE transactions
SET cashback_share_percent = 2.2
WHERE id = '89e98a02-e0e5-4e42-a381-eb3bce841866';

-- Add new income transaction: In 25.05 Vpbank
INSERT INTO transactions (amount, type, account_id, person_id, occurred_at, notes, status, is_sync_sheet, is_test, shop_source, persisted_cycle_tag)
VALUES (
  24232000,
  'income',
  (SELECT id FROM accounts WHERE name = 'Vpbank' LIMIT 1),
  (SELECT id FROM people WHERE name = 'Tuan'),
  '2026-05-25T00:00:00Z',
  'Bank N Final T5 Vpbank',
  'posted',
  TRUE,
  FALSE,
  'Vpbank',
  '2026-05'
);
