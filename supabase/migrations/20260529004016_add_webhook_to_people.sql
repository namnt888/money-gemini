-- Add Google Sheets webhook URL and clasp script ID to people
ALTER TABLE people
  ADD COLUMN sheet_webhook_url TEXT,
  ADD COLUMN clasp_script_id TEXT;
