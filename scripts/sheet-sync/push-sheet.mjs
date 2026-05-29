/**
 * Push Code.js to all Google Apps Script projects defined in .env.local
 *
 * Usage:
 *   pnpm run sheet:people          # Push to ALL (auto-selects after 5s)
 *   pnpm run sheet:people:1        # Push to profile #1
 *   node scripts/sheet-sync/push-sheet.mjs --profile=tuan
 *
 * Env vars in .env.local:
 *   CLASP_SCRIPT_ID_TUAN=1abc123...
 *   CLASP_DEPLOY_TUAN=AKfycbx...
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import readline from 'node:readline'
import { spawnSync } from 'node:child_process'
import dotenv from 'dotenv'

const __dirname = dirname(fileURLToPath(import.meta.url))
const claspPath = join(__dirname, '.clasp.json')
const repoRoot = join(__dirname, '..', '..')
const homeDir = process.env.HOME || process.env.USERPROFILE
const globalClasprcPath = join(homeDir, '.clasprc.json')

const args = process.argv.slice(2)
const getFlagValue = (flag) => {
  const direct = args.find((arg) => arg.startsWith(`${flag}=`))
  if (direct) return direct.split('=').slice(1).join('=')
  const index = args.indexOf(flag)
  if (index >= 0 && args[index + 1]) return args[index + 1]
  return null
}

const scriptIdArg = getFlagValue('--script-id') || getFlagValue('--id') || args.find((arg) => !arg.startsWith('--'))
const profileArg = getFlagValue('--profile') || getFlagValue('--name')
const indexArg = getFlagValue('--index') || getFlagValue('--pick')
const forceFlag = args.includes('--force') ? true : args.includes('--no-force') ? false : true

const isLikelyScriptId = (value) => /^[a-zA-Z0-9_-]{20,}$/.test(value)
const useShell = process.platform === 'win32'

const loadEnv = () => {
  const envLocalPath = join(repoRoot, '.env.local')
  if (existsSync(envLocalPath)) {
    dotenv.config({ path: envLocalPath, override: true })
  }
}

const buildProfiles = () => {
  const profiles = []
  for (const [key, value] of Object.entries(process.env)) {
    if (!value) continue
    if (!/script/i.test(key)) continue

    const trimmed = value.trim()
    if (!isLikelyScriptId(trimmed)) continue

    const alias = key.toLowerCase()
      .replace(/^clasp_/, '')
      .replace(/^script_id_/, '')
      .replace(/^script_/, '')
      .replace(/_script_id$/, '')
      .replace(/_script$/, '')

    profiles.push({ key, value: trimmed, aliases: [alias] })
  }
  return profiles
}

const resolveProfile = (profiles, name) => {
  if (!name) return null
  const normalized = name.toLowerCase()
  return profiles.find((p) => p.aliases.includes(normalized) || p.key.toLowerCase() === normalized) || null
}

const toIndex = (value) => {
  if (value === null || value === undefined) return null
  const n = Number.parseInt(String(value).trim(), 10)
  return Number.isNaN(n) ? null : n
}

const chooseProfile = async (profiles) => {
  if (!profiles.length) return null

  // Auto-select ALL immediately (no waiting)
  console.log(`\nAuto-selecting ALL ${profiles.length} profiles...`)
  return 'ALL'
}

const pushToProfile = async (profile, indexLabel, claspCmd) => {
  console.log(`\n[${indexLabel}] Pushing to ${profile.key}...`)

  const raw = readFileSync(claspPath, 'utf8')
  const config = JSON.parse(raw)
  config.scriptId = profile.value
  writeFileSync(claspPath, JSON.stringify(config, null, 2) + '\n')

  const pushArgs = ['push']
  if (forceFlag) pushArgs.push('--force')

  const result = spawnSync(claspCmd, pushArgs, {
    cwd: __dirname,
    stdio: 'inherit',
    shell: useShell,
  })

  if (result.status === 0) {
    console.log(`[${indexLabel}] ${profile.key} ✅ PUSHED`)

    // Auto-deploy if deploy ID exists
    const deployEnvKey = profile.key.replace('_SCRIPT_', '_DEPLOY_')
    const deployId = process.env[deployEnvKey]
    if (deployId) {
      console.log(`   🚀 Auto-deploying to ${deployId}...`)
      const deployResult = spawnSync(claspCmd, [
        'deploy', '--deploymentId', deployId,
        '--description', 'Auto-updated_via_script',
      ], { cwd: __dirname, stdio: 'inherit', shell: useShell })

      if (deployResult.status === 0) {
        console.log(`   ✨ [${new Date().toLocaleString()}] Deployed Successfully!`)
      } else {
        console.log(`   ⚠️ Deploy Failed (Exit Code: ${deployResult.status})`)
      }
    } else {
      console.log(`   ℹ️ No deploy ID found (Expected: ${deployEnvKey})`)
    }
    return true
  } else {
    console.log(`[${indexLabel}] ${profile.key} ❌ PUSH FAILED`)
    return false
  }
}

const main = async () => {
  loadEnv()

  const profiles = buildProfiles()
  if (!profiles.length) {
    console.log('No script IDs found in .env.local')
    console.log('Expected format: CLASP_SCRIPT_ID_<NAME>=<scriptId>')
    process.exit(1)
  }

  const claspCmd = process.platform === 'win32' ? 'clasp.cmd' : 'clasp'

  // Resolve selection
  let scriptId = ''
  let selected = null

  if (indexArg) {
    const idx = toIndex(indexArg)
    if (idx && idx >= 1 && idx <= profiles.length) {
      selected = { index: idx, profile: profiles[idx - 1] }
      scriptId = profiles[idx - 1].value
    }
  }

  if (!scriptId && profileArg) {
    const resolved = resolveProfile(profiles, profileArg)
    if (resolved) {
      selected = { index: profiles.findIndex((p) => p.key === resolved.key) + 1, profile: resolved }
      scriptId = resolved.value
    }
  }

  if (!scriptId && scriptIdArg && isLikelyScriptId(scriptIdArg)) {
    scriptId = scriptIdArg
  }

  // Push ALL
  if (!scriptId) {
    const selection = await chooseProfile(profiles)
    if (selection === 'ALL') {
      console.log(`\nPushing to ALL ${profiles.length} profiles...\n`)
      let successCount = 0
      let failCount = 0

      for (let i = 0; i < profiles.length; i++) {
        const ok = await pushToProfile(profiles[i], `${i + 1}/${profiles.length}`, claspCmd)
        if (ok) successCount++
        else failCount++
      }

      console.log(`\n📊 Summary: ${successCount} succeeded, ${failCount} failed`)
      process.exit(failCount > 0 ? 1 : 0)
    }

    if (selection && typeof selection === 'object' && selection.profile) {
      selected = selection
      scriptId = selection.profile.value
    } else if (typeof selection === 'string') {
      scriptId = selection
    }
  }

  if (!scriptId) {
    console.error('Missing script ID. Aborting.')
    process.exit(1)
  }

  // Single push
  const ok = await pushToProfile(
    selected?.profile || { key: 'MANUAL', value: scriptId },
    selected ? `${selected.index})` : '',
    claspCmd,
  )
  process.exit(ok ? 0 : 1)
}

main()
