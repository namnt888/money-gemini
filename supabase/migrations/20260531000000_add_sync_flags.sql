-- =============================================================
-- Add sync flags for lump-sum control + bulk deploy support
-- =============================================================

-- transactions: flag to control sheet sync
ALTER TABLE transactions
  ADD COLUMN is_sync_sheet BOOLEAN DEFAULT TRUE;

-- people: add clasp_deploy_id (clasp_script_id already exists)
ALTER TABLE people
  ADD COLUMN clasp_deploy_id TEXT;
