-- =============================================================
-- Add UPDATE trigger for transactions
-- When a transaction is updated, sync to Google Sheet
-- =============================================================

CREATE OR REPLACE FUNCTION notify_sheet_update()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://fkwqoljqftmcoddvochh.supabase.co/functions/v1/sync-to-sheets',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := jsonb_build_object(
      'type', 'UPDATE',
      'table', TG_TABLE_NAME,
      'record', to_jsonb(NEW)
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_transaction_update_to_sheets ON transactions;

CREATE TRIGGER trg_sync_transaction_update_to_sheets
  AFTER UPDATE ON transactions
  FOR EACH ROW
  WHEN (NEW.is_sync_sheet = TRUE)
  EXECUTE FUNCTION notify_sheet_update();
