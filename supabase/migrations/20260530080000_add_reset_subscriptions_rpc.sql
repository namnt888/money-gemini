CREATE OR REPLACE FUNCTION reset_test_subscriptions()
RETURNS void AS $$
BEGIN
  DELETE FROM subscriptions;

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
