-- =============================================================
-- Fix account names + set Tuan's webhook + re-create Tuan's real data
-- =============================================================

-- Set Tuan's sheet_webhook_url (Apps Script deployment URL)
UPDATE people
SET sheet_webhook_url = 'https://script.google.com/macros/s/AKfycbzRfRSJct2o9TnvJ50AYPY7WlW23hmhtG1mLnCbBNYW-p_5AApi61Lr-a-mgPRlDLmceQ/exec'
WHERE name = 'Tuan';

-- Fix account names
UPDATE accounts SET name = 'Bidv Cashback' WHERE name = 'Bidv Cashback Shopee';
UPDATE accounts SET name = 'Uob Power' WHERE name = 'Uob Power';

-- Ensure accounts exist
INSERT INTO accounts (name, type, is_active)
VALUES ('Bidv Cashback', 'credit_card', TRUE)
ON CONFLICT DO NOTHING;

-- Clean ALL transactions
DELETE FROM transactions;

-- Re-create Tuan's real transactions with correct shop_source
INSERT INTO transactions (amount, type, account_id, person_id, occurred_at, notes, status, is_sync_sheet, is_test, shop_source, persisted_cycle_tag)
VALUES
  -- Youtube 2026-05 (subscription)
  (175456, 'expense',
   (SELECT id FROM accounts WHERE name = 'Vcb Digi' LIMIT 1),
   (SELECT id FROM people WHERE name = 'Tuan'),
   '2026-05-01T00:00:00Z',
   'Youtube 2026-05',
   'posted', TRUE, FALSE, 'Youtube', '2026-05'),

  -- Điện T4 → Account: Uob Power, Shop: Power
  (2303921, 'expense',
   (SELECT id FROM accounts WHERE name = 'Uob Power' LIMIT 1),
   (SELECT id FROM people WHERE name = 'Tuan'),
   '2026-05-06T00:00:00Z',
   'Điện T4',
   'posted', TRUE, FALSE, 'Power', '2026-05'),

  -- Nước T4 → Account: Uob Power, Shop: Water
  (141087, 'expense',
   (SELECT id FROM accounts WHERE name = 'Uob Power' LIMIT 1),
   (SELECT id FROM people WHERE name = 'Tuan'),
   '2026-05-13T00:00:00Z',
   'Nước T4',
   'posted', TRUE, FALSE, 'Water', '2026-05'),

  -- 17 256 tím Góp 9 Bidv → Account: Bidv Cashback, Shop: Shopee
  (22270000, 'expense',
   (SELECT id FROM accounts WHERE name = 'Bidv Cashback' LIMIT 1),
   (SELECT id FROM people WHERE name = 'Tuan'),
   '2026-05-18T00:00:00Z',
   '17 256 tím Góp 9 Bidv',
   'posted', TRUE, FALSE, 'Shopee', '2026-05');
