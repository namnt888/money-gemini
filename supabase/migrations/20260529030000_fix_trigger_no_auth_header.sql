-- =============================================================
-- Fix: Remove Authorization header from pg_net trigger call
-- The Edge Function is deployed with --no-verify-jwt, so the
-- Authorization header is unnecessary and was causing 401 errors.
-- =============================================================

CREATE OR REPLACE FUNCTION notify_sheet_sync()
RETURNS TRIGGER AS $$
DECLARE
  edge_fn_url TEXT;
BEGIN
  edge_fn_url := 'https://fkwqoljqftmcoddvochh.supabase.co/functions/v1/sync-to-sheets';

  -- Fire-and-forget HTTP POST via pg_net (no Authorization header)
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