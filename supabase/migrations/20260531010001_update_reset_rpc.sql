-- =============================================================
-- Update reset_test_subscriptions RPC with all people
-- =============================================================

CREATE OR REPLACE FUNCTION reset_test_subscriptions()
RETURNS void
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM subscriptions WHERE 1=1;

  -- Lâm: 2 iCloud + 2 Youtube
  INSERT INTO subscriptions (person_id, account_id, name, amount, price_per_cycle, type, frequency, next_due, slot_number, total_slots)
  VALUES
    ((SELECT id FROM people WHERE name = 'Lam'), (SELECT id FROM accounts LIMIT 1), 'iCloud', 258900, 258900, 'expense', 'monthly', CURRENT_DATE, 1, 6),
    ((SELECT id FROM people WHERE name = 'Lam'), (SELECT id FROM accounts LIMIT 1), 'iCloud', 258900, 258900, 'expense', 'monthly', CURRENT_DATE, 2, 6),
    ((SELECT id FROM people WHERE name = 'Lam'), (SELECT id FROM accounts LIMIT 1), 'Youtube', 175456, 175456, 'expense', 'monthly', CURRENT_DATE, 1, 6),
    ((SELECT id FROM people WHERE name = 'Lam'), (SELECT id FROM accounts LIMIT 1), 'Youtube', 175456, 175456, 'expense', 'monthly', CURRENT_DATE, 2, 6);

  -- Tuấn: 1 Youtube
  INSERT INTO subscriptions (person_id, account_id, name, amount, price_per_cycle, type, frequency, next_due, slot_number, total_slots)
  VALUES
    ((SELECT id FROM people WHERE name = 'Tuan'), (SELECT id FROM accounts LIMIT 1), 'Youtube', 175456, 175456, 'expense', 'monthly', CURRENT_DATE, 3, 6);

  -- Me (Rei): 1 iCloud + 1 Youtube
  INSERT INTO subscriptions (person_id, account_id, name, amount, price_per_cycle, type, frequency, next_due, slot_number, total_slots)
  VALUES
    ((SELECT id FROM people WHERE name = 'Rei'), (SELECT id FROM accounts LIMIT 1), 'iCloud', 258900, 258900, 'expense', 'monthly', CURRENT_DATE, 3, 6),
    ((SELECT id FROM people WHERE name = 'Rei'), (SELECT id FROM accounts LIMIT 1), 'Youtube', 175456, 175456, 'expense', 'monthly', CURRENT_DATE, 4, 6);

  -- Kannie (Ngọc): 1 iCloud
  INSERT INTO subscriptions (person_id, account_id, name, amount, price_per_cycle, type, frequency, next_due, slot_number, total_slots)
  VALUES
    ((SELECT id FROM people WHERE name = 'Ngoc'), (SELECT id FROM accounts LIMIT 1), 'iCloud', 258900, 258900, 'expense', 'monthly', CURRENT_DATE, 4, 6);

  -- Thảo: 1 iCloud
  INSERT INTO subscriptions (person_id, account_id, name, amount, price_per_cycle, type, frequency, next_due, slot_number, total_slots)
  VALUES
    ((SELECT id FROM people WHERE name = 'Thao'), (SELECT id FROM accounts LIMIT 1), 'iCloud', 258900, 258900, 'expense', 'monthly', CURRENT_DATE, 5, 6);

  -- Riddle (Nam): 1 Youtube
  INSERT INTO subscriptions (person_id, account_id, name, amount, price_per_cycle, type, frequency, next_due, slot_number, total_slots)
  VALUES
    ((SELECT id FROM people WHERE name = 'Nam'), (SELECT id FROM accounts LIMIT 1), 'Youtube', 175456, 175456, 'expense', 'monthly', CURRENT_DATE, 5, 6);

  -- Zoe (Hương): 1 Youtube
  INSERT INTO subscriptions (person_id, account_id, name, amount, price_per_cycle, type, frequency, next_due, slot_number, total_slots)
  VALUES
    ((SELECT id FROM people WHERE name = 'Huong'), (SELECT id FROM accounts LIMIT 1), 'Youtube', 175456, 175456, 'expense', 'monthly', CURRENT_DATE, 6, 6);
END;
$$ LANGUAGE plpgsql;
