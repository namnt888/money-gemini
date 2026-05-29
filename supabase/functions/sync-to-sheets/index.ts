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

    // 5. Need a person_id to route to the right sheet
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

    // 9. Map transaction type → In / Out
    const direction = record.type === "income" ? "In" : "Out";

    // 10. Build payload matching Code.js handleSingleTransaction format
    const row = {
      action: "create",
      id: record.id,
      type: direction,
      date: record.occurred_at ?? occurredAt.toISOString(),
      shop: record.notes ?? "",
      notes: record.raw_input ?? "",
      amount: record.amount,
      percent_back: record.cashback_share_percent ?? 0,
      fixed_back: record.cashback_share_fixed ?? 0,
      person_id: record.person_id,
      cycle_tag: cycleTag,
    };

    // 11. POST to Google Apps Script webhook
    const sheetRes = await fetch(person.sheet_webhook_url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(row),
    });

    if (!sheetRes.ok) {
      const body = await sheetRes.text();
      throw new Error(`Sheets webhook failed (${sheetRes.status}): ${body}`);
    }

    return corsResponse({ success: true, cycle_tag: cycleTag });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[sync-to-sheets] Error:", message);
    return corsResponse({ error: message }, 500);
  }
});