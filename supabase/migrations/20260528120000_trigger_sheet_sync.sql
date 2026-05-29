-- =============================================================
-- Trigger: Auto-sync to Google Sheets on transaction INSERT
-- Uses pg_net to call the Edge Function asynchronously
-- =============================================================

-- Enable pg_net extension (required for async HTTP calls)
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Function to call Edge Function via pg_net
CREATE OR REPLACE FUNCTION notify_sheet_sync()
RETURNS TRIGGER AS $$
DECLARE
  edge_fn_url TEXT;
BEGIN
  -- Thay <PROJECT_REF> bằng Supabase Project Ref của bạn
  edge_fn_url := 'https://fkwqoljqftmcoddvochh.supabase.co/functions/v1/sync-to-sheets';

  -- Fire-and-forget HTTP POST via pg_net
  PERFORM net.http_post(
    url    := edge_fn_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
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

-- Trigger: AFTER INSERT on transactions where status = 'posted'
CREATE TRIGGER trg_sync_transaction_to_sheets
  AFTER INSERT ON transactions
  FOR EACH ROW
  WHEN (NEW.status = 'posted')
  EXECUTE FUNCTION notify_sheet_sync();
