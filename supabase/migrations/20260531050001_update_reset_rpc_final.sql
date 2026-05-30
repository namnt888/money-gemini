-- =============================================================
-- Update reset_test_subscriptions RPC (final version)
-- =============================================================

CREATE OR REPLACE FUNCTION reset_test_subscriptions()
RETURNS void
SECURITY DEFINER
AS $$
DECLARE
  vcb_id UUID;
  yt_id UUID;
  ic_id UUID;
BEGIN
  SELECT id INTO vcb_id FROM accounts WHERE name = 'Vcb Digi' LIMIT 1;
  SELECT id INTO yt_id FROM services WHERE code = 'yt';
  SELECT id INTO ic_id FROM services WHERE code = 'ic';

  DELETE FROM subscriptions WHERE 1=1;

  -- Lâm: 2 iCloud + 2 Youtube
  INSERT INTO subscriptions (person_id, account_id, service_id, name, type, frequency, next_due, slot_number, total_slots) VALUES
    ((SELECT id FROM people WHERE name = 'Lam'), vcb_id, ic_id, 'iCloud', 'expense', 'monthly', CURRENT_DATE, 1, 6),
    ((SELECT id FROM people WHERE name = 'Lam'), vcb_id, ic_id, 'iCloud', 'expense', 'monthly', CURRENT_DATE, 2, 6),
    ((SELECT id FROM people WHERE name = 'Lam'), vcb_id, yt_id, 'Youtube', 'expense', 'monthly', CURRENT_DATE, 1, 6),
    ((SELECT id FROM people WHERE name = 'Lam'), vcb_id, yt_id, 'Youtube', 'expense', 'monthly', CURRENT_DATE, 2, 6);

  -- Tuấn: 1 Youtube
  INSERT INTO subscriptions (person_id, account_id, service_id, name, type, frequency, next_due, slot_number, total_slots) VALUES
    ((SELECT id FROM people WHERE name = 'Tuan'), vcb_id, yt_id, 'Youtube', 'expense', 'monthly', CURRENT_DATE, 3, 6);

  -- Me: 1 iCloud + 1 Youtube
  INSERT INTO subscriptions (person_id, account_id, service_id, name, type, frequency, next_due, slot_number, total_slots) VALUES
    ((SELECT id FROM people WHERE name = 'Rei'), vcb_id, ic_id, 'iCloud', 'expense', 'monthly', CURRENT_DATE, 3, 6),
    ((SELECT id FROM people WHERE name = 'Rei'), vcb_id, yt_id, 'Youtube', 'expense', 'monthly', CURRENT_DATE, 4, 6);

  -- Kannie: 1 iCloud
  INSERT INTO subscriptions (person_id, account_id, service_id, name, type, frequency, next_due, slot_number, total_slots) VALUES
    ((SELECT id FROM people WHERE name = 'Ngoc'), vcb_id, ic_id, 'iCloud', 'expense', 'monthly', CURRENT_DATE, 4, 6);

  -- Thảo: 1 iCloud
  INSERT INTO subscriptions (person_id, account_id, service_id, name, type, frequency, next_due, slot_number, total_slots) VALUES
    ((SELECT id FROM people WHERE name = 'Thao'), vcb_id, ic_id, 'iCloud', 'expense', 'monthly', CURRENT_DATE, 5, 6);

  -- Riddle: 1 Youtube
  INSERT INTO subscriptions (person_id, account_id, service_id, name, type, frequency, next_due, slot_number, total_slots) VALUES
    ((SELECT id FROM people WHERE name = 'Nam'), vcb_id, yt_id, 'Youtube', 'expense', 'monthly', CURRENT_DATE, 5, 6);

  -- Zoe: 1 Youtube
  INSERT INTO subscriptions (person_id, account_id, service_id, name, type, frequency, next_due, slot_number, total_slots) VALUES
    ((SELECT id FROM people WHERE name = 'Huong'), vcb_id, yt_id, 'Youtube', 'expense', 'monthly', CURRENT_DATE, 6, 6);

  -- My: 1 iCloud
  INSERT INTO subscriptions (person_id, account_id, service_id, name, type, frequency, next_due, slot_number, total_slots) VALUES
    ((SELECT id FROM people WHERE name = 'My'), vcb_id, ic_id, 'iCloud', 'expense', 'monthly', CURRENT_DATE, 6, 6);
END;
$$ LANGUAGE plpgsql;
