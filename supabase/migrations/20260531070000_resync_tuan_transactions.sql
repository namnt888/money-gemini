-- =============================================================
-- Re-insert Tuan's real transactions (trigger now has is_sync_sheet check)
-- =============================================================

-- Delete old Tuan transactions (if any)
DELETE FROM transactions
WHERE person_id = (SELECT id FROM people WHERE name = 'Tuan')
AND occurred_at BETWEEN '2026-05-01' AND '2026-05-31';

-- Re-insert with is_sync_sheet = TRUE (trigger will fire)
INSERT INTO transactions (amount, type, account_id, person_id, occurred_at, notes, status, is_sync_sheet, is_test, shop_source, persisted_cycle_tag)
VALUES
  (175456, 'expense', (SELECT id FROM accounts WHERE name = 'Vcb Digi' LIMIT 1), (SELECT id FROM people WHERE name = 'Tuan'), '2026-05-01T00:00:00Z', 'Youtube 2026-05', 'posted', TRUE, FALSE, 'Youtube', '2026-05'),
  (2303921, 'expense', (SELECT id FROM accounts WHERE name = 'Uob Power' LIMIT 1), (SELECT id FROM people WHERE name = 'Tuan'), '2026-05-06T00:00:00Z', 'Điện T4', 'posted', TRUE, FALSE, NULL, '2026-05'),
  (141087, 'expense', (SELECT id FROM accounts WHERE name = 'Uob Power' LIMIT 1), (SELECT id FROM people WHERE name = 'Tuan'), '2026-05-13T00:00:00Z', 'Nước T4', 'posted', TRUE, FALSE, NULL, '2026-05'),
  (22270000, 'expense', (SELECT id FROM accounts WHERE name = 'Bidv Cashback Shopee' LIMIT 1), (SELECT id FROM people WHERE name = 'Tuan'), '2026-05-18T00:00:00Z', '17 256 tím Góp 9 Bidv', 'posted', TRUE, FALSE, NULL, '2026-05');
