-- =============================================================
-- Fix trigger + force sync Tuan's transactions
-- =============================================================

-- Ensure is_sync_sheet column exists
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS is_sync_sheet BOOLEAN DEFAULT TRUE;

-- Recreate trigger with correct condition
DROP TRIGGER IF EXISTS trg_sync_transaction_to_sheets ON transactions;

CREATE OR REPLACE FUNCTION notify_sheet_sync()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://fkwqoljqftmcoddvochh.supabase.co/functions/v1/sync-to-sheets',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := jsonb_build_object(
      'type', TG_OP,
      'table', TG_TABLE_NAME,
      'record', to_jsonb(NEW)
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_transaction_to_sheets
  AFTER INSERT ON transactions
  FOR EACH ROW
  WHEN (NEW.status = 'posted' AND NEW.is_sync_sheet = TRUE)
  EXECUTE FUNCTION notify_sheet_sync();

-- Get IDs into variables to avoid duplicate subquery issues
DO $$
DECLARE
  vcb_id UUID;
  uob_id UUID;
  bidv_id UUID;
  vpbank_id UUID;
  tuan_id UUID;
BEGIN
  SELECT id INTO vcb_id FROM accounts WHERE name = 'Vcb Digi' LIMIT 1;
  SELECT id INTO uob_id FROM accounts WHERE name = 'Uob' LIMIT 1;
  SELECT id INTO bidv_id FROM accounts WHERE name = 'Bidv Cashback' LIMIT 1;
  SELECT id INTO vpbank_id FROM accounts WHERE name = 'Vpbank' LIMIT 1;
  SELECT id INTO tuan_id FROM people WHERE name = 'Tuan' LIMIT 1;

  -- Delete old Tuan transactions
  DELETE FROM transactions WHERE person_id = tuan_id;

  -- Re-insert with trigger firing
  INSERT INTO transactions (amount, type, account_id, person_id, occurred_at, notes, status, is_sync_sheet, is_test, shop_source, persisted_cycle_tag, cashback_share_percent)
  VALUES
    (175456, 'expense', vcb_id, tuan_id, '2026-05-01T00:00:00Z', 'Youtube 2026-05', 'posted', TRUE, FALSE, 'Youtube', '2026-05', 0),
    (2303921, 'expense', uob_id, tuan_id, '2026-05-06T00:00:00Z', 'Điện T4', 'posted', TRUE, FALSE, 'Power', '2026-05', 2.2),
    (141087, 'expense', uob_id, tuan_id, '2026-05-13T00:00:00Z', 'Nước T4', 'posted', TRUE, FALSE, 'Water', '2026-05', 0),
    (22270000, 'expense', bidv_id, tuan_id, '2026-05-18T00:00:00Z', '17 256 tím Góp 9 Bidv', 'posted', TRUE, FALSE, 'Shopee', '2026-05', 0),
    (24232000, 'income', vpbank_id, tuan_id, '2026-05-25T00:00:00Z', 'Bank N Final T5 Vpbank', 'posted', TRUE, FALSE, 'Vpbank', '2026-05', 0);
END $$;
