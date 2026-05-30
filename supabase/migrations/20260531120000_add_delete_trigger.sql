-- =============================================================
-- Add DELETE trigger for transactions
-- When a transaction is deleted, sync deletion to Google Sheet
-- =============================================================

CREATE OR REPLACE FUNCTION notify_sheet_delete()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://fkwqoljqftmcoddvochh.supabase.co/functions/v1/sync-to-sheets',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := jsonb_build_object(
      'type', 'DELETE',
      'table', TG_TABLE_NAME,
      'record', to_jsonb(OLD)
    )
  );
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_transaction_delete_to_sheets ON transactions;

CREATE TRIGGER trg_sync_transaction_delete_to_sheets
  AFTER DELETE ON transactions
  FOR EACH ROW
  WHEN (OLD.is_sync_sheet = TRUE)
  EXECUTE FUNCTION notify_sheet_delete();
