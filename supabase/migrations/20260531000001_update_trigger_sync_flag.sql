-- =============================================================
-- Update trigger: skip sync if is_sync_sheet = false
-- =============================================================

CREATE OR REPLACE FUNCTION notify_sheet_sync()
RETURNS TRIGGER AS $$
DECLARE
  edge_fn_url TEXT;
BEGIN
  edge_fn_url := 'https://fkwqoljqftmcoddvochh.supabase.co/functions/v1/sync-to-sheets';

  PERFORM net.http_post(
    url    := edge_fn_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json'
    ),
    body   := jsonb_build_object(
      'type',   TG_OP,
      'table',  TG_TABLE_NAME,
      'record', to_jsonb(NEW)
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_transaction_to_sheets ON transactions;

CREATE TRIGGER trg_sync_transaction_to_sheets
  AFTER INSERT ON transactions
  FOR EACH ROW
  WHEN (NEW.status = 'posted' AND NEW.is_sync_sheet = TRUE)
  EXECUTE FUNCTION notify_sheet_sync();
