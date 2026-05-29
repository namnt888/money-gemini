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

import { existsSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { spawnSync } from "node:child_process"
import { createClient } from "@supabase/supabase-js"
import dotenv from "dotenv"

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = join(__dirname, "..", "..")

// Load .env.local
const envLocalPath = join(repoRoot, ".env.local")
if (existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath, override: true })
}

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

const main = async () => {
  // 1. Fetch all people that have a clasp_script_id
  const { data: people, error } = await supabase
    .from("people")
    .select("id, name, clasp_script_id")
    .not("clasp_script_id", "is", null)

  if (error) {
    console.error("Failed to fetch people:", error.message)
    process.exit(1)
  }

  if (!people?.length) {
    console.log("No people with clasp_script_id found.")
    process.exit(0)
  }

  console.log(`Found ${people.length} people with clasp_script_id\n`)

  // 2. For each person, update .clasp.json and push
  const claspPath = join(__dirname, ".clasp.json")
  const claspCmd = process.platform === "win32" ? "clasp.cmd" : "clasp"
  let successCount = 0
  let failCount = 0

  for (const person of people) {
    console.log(`[${person.name}] Pushing to script ${person.clasp_script_id}...`)

    // Update .clasp.json
    const config = { scriptId: person.clasp_script_id }
    writeFileSync(claspPath, JSON.stringify(config, null, 2) + "\n")

    // Push
    const result = spawnSync(claspCmd, ["push", "--force"], {
      cwd: __dirname,
      stdio: "inherit",
      shell: process.platform === "win32",
    })

    if (result.status === 0) {
      console.log(`[${person.name}] ✅ Pushed\n`)
      successCount++
    } else {
      console.error(`[${person.name}] ❌ Push failed\n`)
      failCount++
    }
  }

  console.log(`\n📊 Summary: ${successCount} succeeded, ${failCount} failed out of ${people.length}`)
  process.exit(failCount > 0 ? 1 : 0)
}

main()