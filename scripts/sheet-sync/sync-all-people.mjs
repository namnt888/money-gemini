/**
 * sync-all-people.mjs
 *
 * Bulk push Code.js to all people's Google Apps Script projects via clasp.
 * Reads clasp_script_id + clasp_deploy_id from Supabase `people` table.
 *
 * Usage:
 *   pnpm sync:sheets
 *
 * Prerequisites:
 *   - .env.local with SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *   - clasp installed (npx clasp)
 *   - .clasprc.json in home directory (clasp auth)
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { fileURLToPath } from "url";
import { resolve, dirname, join } from "path";
import { readFileSync, writeFileSync } from "fs";
import { execSync } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "../..");
config({ path: resolve(repoRoot, ".env.local") });

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

const CLASP_JSON_PATH = join(__dirname, ".clasp.json");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function runClasp(args) {
  const cmd = `npx clasp ${args}`;
  try {
    const output = execSync(cmd, {
      cwd: __dirname,
      stdio: "pipe",
      encoding: "utf-8",
      timeout: 60000,
    });
    return { ok: true, output: output.trim() };
  } catch (err) {
    return { ok: false, error: err.stderr || err.message };
  }
}

function setClaspScriptId(scriptId) {
  const claspConfig = JSON.parse(readFileSync(CLASP_JSON_PATH, "utf-8"));
  claspConfig.scriptId = scriptId;
  writeFileSync(CLASP_JSON_PATH, JSON.stringify(claspConfig, null, 2) + "\n");
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("Fetching people from Supabase...\n");

  const { data: people, error } = await supabase
    .from("people")
    .select("id, name, label, clasp_script_id, clasp_deploy_id")
    .eq("is_active", true)
    .not("clasp_script_id", "is", null)
    .neq("clasp_script_id", "");

  if (error) {
    console.error("Failed to fetch people:", error.message);
    process.exit(1);
  }

  if (!people?.length) {
    console.log("No people with clasp_script_id found.");
    return;
  }

  console.log(`Found ${people.length} person(s):\n`);

  const results = [];

  for (const person of people) {
    const displayName = person.label || person.name;
    process.stdout.write(`[${displayName}] Pushing... `);

    // 1. Set scriptId in .clasp.json
    setClaspScriptId(person.clasp_script_id);

    // 2. clasp push
    const pushResult = runClasp("push -f");
    if (!pushResult.ok) {
      console.log(`FAIL\n  ${pushResult.error}`);
      results.push({ name: displayName, push: false, deploy: null });
      continue;
    }
    console.log("OK");

    // 3. clasp deploy (if deploy_id exists)
    let deployResult = null;
    if (person.clasp_deploy_id) {
      process.stdout.write(`[${displayName}] Deploying... `);
      deployResult = runClasp(
        `deploy --deploymentId ${person.clasp_deploy_id} --description "Auto Update ${new Date().toISOString().split("T")[0]}"`
      );
      if (!deployResult.ok) {
        console.log(`FAIL\n  ${deployResult.error}`);
        results.push({ name: displayName, push: true, deploy: false });
        continue;
      }
      console.log("OK");
    }

    results.push({ name: displayName, push: true, deploy: deployResult ? true : null });
  }

  // Summary
  console.log("\n--- Summary ---");
  for (const r of results) {
    const push = r.push ? "OK" : "FAIL";
    const deploy = r.deploy === null ? "skip" : r.deploy ? "OK" : "FAIL";
    console.log(`  ${r.name}: push=${push}, deploy=${deploy}`);
  }

  const failed = results.filter((r) => !r.push || r.deploy === false);
  if (failed.length) {
    console.log(`\n${failed.length} person(s) had errors.`);
    process.exit(1);
  }

  console.log("\nAll done!");
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
