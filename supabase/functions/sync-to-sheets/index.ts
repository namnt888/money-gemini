// @ts-nocheck — Deno runtime, not Node

/**
 * Edge Function: sync-to-sheets
 *
 * Called by Postgres pg_net trigger on transaction INSERT.
 * Bypasses auth (--no-verify-jwt at deploy time).
 * Looks up the person's sheet_webhook_url and forwards the row
 * to Google Apps Script.
 *
 * Deploy:
 *   supabase functions deploy sync-to-sheets --no-verify-jwt
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface WebhookPayload {
  type: string;          // INSERT | UPDATE | DELETE
  table: string;         // e.g. transactions
  record: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// CORS helpers
// ---------------------------------------------------------------------------

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey",
};

function corsResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

Deno.serve(async (req: Request) => {
  // 1. CORS preflight — always allow
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // 2. Only accept POST
  if (req.method !== "POST") {
    return corsResponse({ skipped: true, reason: "Method not allowed" }, 405);
  }

  try {
    // 3. Parse body safely
    let payload: WebhookPayload;
    try {
      payload = await req.json();
    } catch {
      return corsResponse({ error: "Invalid JSON body" }, 400);
    }

    // 4. Only handle transaction INSERTs
    if (payload.type !== "INSERT" || payload.table !== "transactions") {
      return corsResponse({
        skipped: true,
        reason: `Ignored: type=${payload.type} table=${payload.table}`,
      });
    }

    const record = payload.record;

    // 5. Second gate: skip if is_sync_sheet is false
    if (record.is_sync_sheet === false) {
      return corsResponse({ skipped: true, reason: "is_sync_sheet = false" });
    }

    // 6. Need a person_id to route to the right sheet
    if (!record.person_id) {
      return corsResponse({ skipped: true, reason: "No person_id on record" });
    }

    // 6. Init Supabase with service-role key (built-in env vars)
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 7. Look up the person's sheet_webhook_url
    const { data: person, error: personErr } = await supabase
      .from("people")
      .select("sheet_webhook_url")
      .eq("id", record.person_id)
      .single();

    if (personErr) {
      throw new Error(`People query failed: ${personErr.message}`);
    }

    if (!person?.sheet_webhook_url) {
      return corsResponse({
        skipped: true,
        reason: `Person ${record.person_id} has no sheet_webhook_url`,
      });
    }

    // 8. Derive cycle_tag
    //    Prefer persisted_cycle_tag column; fall back to YYYY-MM from occurred_at
    const occurredAt = record.occurred_at
      ? new Date(record.occurred_at as string)
      : new Date();

    const fallbackCycle = `${occurredAt.getFullYear()}-${String(occurredAt.getMonth() + 1).padStart(2, "0")}`;
    const cycleTag = (record.persisted_cycle_tag as string) || fallbackCycle;

    // 9. Resolve shop_source:
    //    - If shop_source exists → use it
    //    - If income-type and no shop_source → fall back to account name (bank)
    let shopSource = (record.shop_source as string) || "";

    const incomeTypes = ["income", "repayment", "transfer_in", "cashback"];
    if (!shopSource && incomeTypes.includes(record.type as string) && record.account_id) {
      const { data: account } = await supabase
        .from("accounts")
        .select("name")
        .eq("id", record.account_id)
        .single();
      shopSource = account?.name || "";
    }

    // 10. Build payload matching Code.js expectations
    const gasPayload = {
      type: payload.type,
      table: payload.table,
      record: {
        ...record,
        cycle_tag: cycleTag,
        shop_source: shopSource,
      },
    };

    // 11. POST to Google Apps Script webhook
    const sheetRes = await fetch(person.sheet_webhook_url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(gasPayload),
    });

    // GAS always returns HTTP 200 — check body for error field
    const resData = await sheetRes.json().catch(() => null);

    if (!sheetRes.ok) {
      const rawText = JSON.stringify(resData) ?? "unknown";
      throw new Error(`Sheets webhook HTTP error (${sheetRes.status}): ${rawText}`);
    }

    if (resData?.error) {
      throw new Error(`GAS Error: ${resData.error}`);
    }

    return corsResponse({ success: true, cycle_tag: cycleTag, gas_response: resData });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[sync-to-sheets] Error:", message);
    return corsResponse({ error: message }, 500);
  }
});