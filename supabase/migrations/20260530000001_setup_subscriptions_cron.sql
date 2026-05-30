-- =============================================================
-- Setup pg_cron to trigger sync-subscriptions Edge Function
-- every 6 hours (00:00, 06:00, 12:00, 18:00 UTC)
-- =============================================================

-- Enable pg_cron extension (requires superuser)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the sync-subscriptions Edge Function
-- Runs every 6 hours at minute 0
SELECT cron.schedule(
  'sync-subscriptions-every-6h',
  '0 */6 * * *',
  $$
  SELECT net.http_post(
    url := 'https://fkwqoljqftmcoddvochh.supabase.co/functions/v1/sync-subscriptions',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
