/**
 * sync-all-people.mjs
 *
 * Automation script: Pull people list from Supabase, then push
 * Apps Script code (Code.js) to each person's Google Apps Script project
 * via clasp.
 *
 * Usage:
 *   pnpm sync:sheets
 *
 * Prerequisites:
 *   - .env.local with SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *   - clasp installed globally or via npx
 *
 * TODO (Task 5+): Implement full logic
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { fileURLToPath } from "url";
import { resolve, dirname } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../../.env.local") });

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("Fetching people from Supabase...");

  const { data: people, error } = await supabase
    .from("people")
    .select("id, name, clasp_script_id")
    .not("clasp_script_id", "is", null);

  if (error) {
    console.error("Failed to fetch people:", error.message);
    process.exit(1);
  }

  if (!people?.length) {
    console.log("No people with clasp_script_id found.");
    return;
  }

  console.log(`Found ${people.length} person(s) with clasp_script_id:`);
  for (const p of people) {
    console.log(`  - ${p.name} (${p.id}) → ${p.clasp_script_id}`);
  }

  // TODO (Task 5+): For each person, use clasp to push Code.js
  // to their Apps Script project.
  //
  // Example flow:
  //   1. Write a temp .clasp.json withscriptId = person.clasp_script_id
  //   2. Run: npx clasp push -f
  //   3. Clean up temp file
  //
  // For now, just print what would happen.
  console.log("\n[TODO] Clasp push logic not yet implemented.");
  console.log("Run `pnpm gs:push` for single-person push in the meantime.");
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
