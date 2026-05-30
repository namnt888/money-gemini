-- =============================================================
-- Fix account names + shop_source for Tuan's transactions
-- =============================================================

-- Fix account names
UPDATE accounts SET name = 'Uob' WHERE name = 'Uob Power';
UPDATE accounts SET name = 'Bidv Cashback' WHERE name = 'Bidv Cashback Shopee';

-- Delete old Tuan transactions
DELETE FROM transactions
WHERE person_id = (SELECT id FROM people WHERE name = 'Tuan')
AND occurred_at BETWEEN '2026-05-01' AND '2026-05-31';

-- Re-insert with correct shop_source
INSERT INTO transactions (amount, type, account_id, person_id, occurred_at, notes, status, is_sync_sheet, is_test, shop_source, persisted_cycle_tag)
VALUES
  (175456, 'expense', (SELECT id FROM accounts WHERE name = 'Vcb Digi'), (SELECT id FROM people WHERE name = 'Tuan'), '2026-05-01T00:00:00Z', 'Youtube 2026-05', 'posted', TRUE, FALSE, 'Youtube', '2026-05'),
  (2303921, 'expense', (SELECT id FROM accounts WHERE name = 'Uob'), (SELECT id FROM people WHERE name = 'Tuan'), '2026-05-06T00:00:00Z', 'Điện T4', 'posted', TRUE, FALSE, 'Power', '2026-05'),
  (141087, 'expense', (SELECT id FROM accounts WHERE name = 'Uob'), (SELECT id FROM people WHERE name = 'Tuan'), '2026-05-13T00:00:00Z', 'Nước T4', 'posted', TRUE, FALSE, 'Water', '2026-05'),
  (22270000, 'expense', (SELECT id FROM accounts WHERE name = 'Bidv Cashback'), (SELECT id FROM people WHERE name = 'Tuan'), '2026-05-18T00:00:00Z', '17 256 tím Góp 9 Bidv', 'posted', TRUE, FALSE, 'Shopee', '2026-05');

-- Update Tuan's sheet_webhook_url if missing
UPDATE people
SET sheet_webhook_url = COALESCE(sheet_webhook_url, '')
WHERE name = 'Tuan' AND sheet_webhook_url IS NULL;
