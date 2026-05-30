-- =============================================================
-- Add sync flags + clasp deploy ID
-- =============================================================

-- transactions: flag to control sheet sync
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS is_sync_sheet BOOLEAN DEFAULT TRUE;

-- people: add clasp_deploy_id (clasp_script_id already exists)
ALTER TABLE people
  ADD COLUMN IF NOT EXISTS clasp_deploy_id TEXT;

-- Update Tuan's deploy ID
UPDATE people
SET clasp_deploy_id = 'AKfycbzRfRSJct2o9TnvJ50AYPY7WlW23hmhtG1mLnCbBNYW-p_5AApi61Lr-a-mgPRlDLmceQ'
WHERE label = 'Tuan' OR name = 'Tuan';
