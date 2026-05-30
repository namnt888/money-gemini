-- =============================================================
-- Fix reset_test_subscriptions RPC + add is_test column
-- =============================================================

-- Add is_test flag to transactions for tracking test data
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS is_test BOOLEAN DEFAULT FALSE;

-- Fix RPC: use SECURITY DEFINER to bypass RLS
CREATE OR REPLACE FUNCTION reset_test_subscriptions()
RETURNS void
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM subscriptions WHERE 1=1;

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
END;
$$ LANGUAGE plpgsql;

-- Seed 2 In transactions on Sheet for Tuan (is_sync_sheet=true so they appear on Sheet)
INSERT INTO transactions (amount, type, account_id, person_id, occurred_at, notes, status, is_sync_sheet, is_test, persisted_cycle_tag)
VALUES (
  200000,
  'income',
  (SELECT id FROM accounts WHERE name ILIKE '%vpbank%' LIMIT 1),
  (SELECT id FROM people WHERE name = 'Tuan' LIMIT 1),
  '2026-06-17T00:00:00Z',
  'Vpbank +N Final Jan',
  'posted',
  TRUE,
  TRUE,
  '2026-06'
);

INSERT INTO transactions (amount, type, account_id, person_id, occurred_at, notes, status, is_sync_sheet, is_test, persisted_cycle_tag)
VALUES (
  200000,
  'income',
  (SELECT id FROM accounts WHERE name ILIKE '%vpbank%' LIMIT 1),
  (SELECT id FROM people WHERE name = 'Tuan' LIMIT 1),
  '2026-06-30T00:00:00Z',
  'Vpbank +N Final Jan',
  'posted',
  TRUE,
  TRUE,
  '2026-06'
);
