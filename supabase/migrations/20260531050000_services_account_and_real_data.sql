-- =============================================================
-- Services: add account_id for cron account linking
-- Clean test data + create real transactions for Tuan 05-2026
-- =============================================================

-- Add account_id to services (which account to charge from)
ALTER TABLE services
  ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES accounts(id);

-- Make amount/price_per_cycle nullable (pricing now in services table)
ALTER TABLE subscriptions
  ALTER COLUMN amount DROP NOT NULL,
  ALTER COLUMN price_per_cycle DROP NOT NULL;

-- Ensure Vcb Digi account exists
INSERT INTO accounts (name, type, is_active)
VALUES ('Vcb Digi', 'bank', TRUE)
ON CONFLICT DO NOTHING;

-- Link services to Vcb Digi
UPDATE services SET account_id = (SELECT id FROM accounts WHERE name = 'Vcb Digi' LIMIT 1);

-- Clean test data
DELETE FROM transactions WHERE is_test = TRUE;
DELETE FROM subscriptions WHERE 1=1;
DELETE FROM services WHERE 1=1;

-- Re-seed services with account_id
INSERT INTO services (name, code, price_per_cycle, total_slots, account_id) VALUES
  ('Youtube', 'yt', 175456, 6, (SELECT id FROM accounts WHERE name = 'Vcb Digi' LIMIT 1)),
  ('iCloud', 'ic', 258900, 6, (SELECT id FROM accounts WHERE name = 'Vcb Digi' LIMIT 1));

-- Re-seed subscriptions (amount/price_per_cycle from services)
INSERT INTO subscriptions (person_id, account_id, service_id, name, type, frequency, next_due, slot_number, total_slots)
VALUES
  ((SELECT id FROM people WHERE name = 'Lam'), (SELECT id FROM accounts WHERE name = 'Vcb Digi' LIMIT 1), (SELECT id FROM services WHERE code = 'ic'), 'iCloud', 'expense', 'monthly', '2026-06-01', 1, 6),
  ((SELECT id FROM people WHERE name = 'Lam'), (SELECT id FROM accounts WHERE name = 'Vcb Digi' LIMIT 1), (SELECT id FROM services WHERE code = 'ic'), 'iCloud', 'expense', 'monthly', '2026-06-01', 2, 6),
  ((SELECT id FROM people WHERE name = 'Lam'), (SELECT id FROM accounts WHERE name = 'Vcb Digi' LIMIT 1), (SELECT id FROM services WHERE code = 'yt'), 'Youtube', 'expense', 'monthly', '2026-06-01', 1, 6),
  ((SELECT id FROM people WHERE name = 'Lam'), (SELECT id FROM accounts WHERE name = 'Vcb Digi' LIMIT 1), (SELECT id FROM services WHERE code = 'yt'), 'Youtube', 'expense', 'monthly', '2026-06-01', 2, 6),
  ((SELECT id FROM people WHERE name = 'Tuan'), (SELECT id FROM accounts WHERE name = 'Vcb Digi' LIMIT 1), (SELECT id FROM services WHERE code = 'yt'), 'Youtube', 'expense', 'monthly', '2026-06-01', 3, 6),
  ((SELECT id FROM people WHERE name = 'Rei'), (SELECT id FROM accounts WHERE name = 'Vcb Digi' LIMIT 1), (SELECT id FROM services WHERE code = 'ic'), 'iCloud', 'expense', 'monthly', '2026-06-01', 3, 6),
  ((SELECT id FROM people WHERE name = 'Rei'), (SELECT id FROM accounts WHERE name = 'Vcb Digi' LIMIT 1), (SELECT id FROM services WHERE code = 'yt'), 'Youtube', 'expense', 'monthly', '2026-06-01', 4, 6),
  ((SELECT id FROM people WHERE name = 'Ngoc'), (SELECT id FROM accounts WHERE name = 'Vcb Digi' LIMIT 1), (SELECT id FROM services WHERE code = 'ic'), 'iCloud', 'expense', 'monthly', '2026-06-01', 4, 6),
  ((SELECT id FROM people WHERE name = 'Thao'), (SELECT id FROM accounts WHERE name = 'Vcb Digi' LIMIT 1), (SELECT id FROM services WHERE code = 'ic'), 'iCloud', 'expense', 'monthly', '2026-06-01', 5, 6),
  ((SELECT id FROM people WHERE name = 'Nam'), (SELECT id FROM accounts WHERE name = 'Vcb Digi' LIMIT 1), (SELECT id FROM services WHERE code = 'yt'), 'Youtube', 'expense', 'monthly', '2026-06-01', 5, 6),
  ((SELECT id FROM people WHERE name = 'Huong'), (SELECT id FROM accounts WHERE name = 'Vcb Digi' LIMIT 1), (SELECT id FROM services WHERE code = 'yt'), 'Youtube', 'expense', 'monthly', '2026-06-01', 6, 6),
  ((SELECT id FROM people WHERE name = 'My'), (SELECT id FROM accounts WHERE name = 'Vcb Digi' LIMIT 1), (SELECT id FROM services WHERE code = 'ic'), 'iCloud', 'expense', 'monthly', '2026-06-01', 6, 6);

-- =============================================================
-- Real transactions for Tuan 05-2026 (is_test = FALSE)
-- =============================================================

INSERT INTO accounts (name, type, is_active)
VALUES ('Uob Power', 'bank', TRUE), ('Bidv Cashback Shopee', 'credit_card', TRUE)
ON CONFLICT DO NOTHING;

INSERT INTO transactions (amount, type, account_id, person_id, occurred_at, notes, status, is_sync_sheet, is_test, shop_source)
VALUES
  (0, 'expense', (SELECT id FROM accounts WHERE name = 'Vcb Digi' LIMIT 1), (SELECT id FROM people WHERE name = 'Tuan'), '2026-05-01T00:00:00Z', 'Youtube 2026-05', 'posted', TRUE, FALSE, 'Youtube'),
  (2303921, 'expense', (SELECT id FROM accounts WHERE name = 'Uob Power' LIMIT 1), (SELECT id FROM people WHERE name = 'Tuan'), '2026-05-06T00:00:00Z', 'Điện T4', 'posted', TRUE, FALSE, NULL),
  (141087, 'expense', (SELECT id FROM accounts WHERE name = 'Uob Power' LIMIT 1), (SELECT id FROM people WHERE name = 'Tuan'), '2026-05-13T00:00:00Z', 'Nước T4', 'posted', TRUE, FALSE, NULL),
  (22270000, 'expense', (SELECT id FROM accounts WHERE name = 'Bidv Cashback Shopee' LIMIT 1), (SELECT id FROM people WHERE name = 'Tuan'), '2026-05-18T00:00:00Z', '17 256 tím Góp 9 Bidv', 'posted', TRUE, FALSE, NULL);
