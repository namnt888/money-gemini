-- =============================================================
-- Reset test subscriptions next_due to today for re-testing
-- =============================================================

UPDATE subscriptions
SET next_due = CURRENT_DATE,
    last_synced_at = NULL;
