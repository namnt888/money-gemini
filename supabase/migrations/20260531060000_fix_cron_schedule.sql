-- =============================================================
-- Fix cron schedule: 00:05 VN = 17:05 UTC
-- =============================================================

-- Unschedule old job
SELECT cron.unschedule('sync-subscriptions-every-6h');

-- Schedule at 17:05 UTC = 00:05 VN daily
SELECT cron.schedule(
  'sync-subscriptions-daily',
  '5 17 * * *',
  $$
  SELECT net.http_post(
    url := 'https://fkwqoljqftmcoddvochh.supabase.co/functions/v1/sync-subscriptions',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
