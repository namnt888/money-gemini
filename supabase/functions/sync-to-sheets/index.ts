// @ts-nocheck — Deno runtime, not Node

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface WebhookPayload {
  type: string;
  table: string;
  record: Record<string, unknown>;
}

Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
  };

  try {
    const payload: WebhookPayload = await req.json();

    if (payload.type !== "INSERT" || payload.table !== "transactions") {
      return new Response(
        JSON.stringify({ skipped: true, reason: "Not a transaction INSERT" }),
        { status: 200, headers: corsHeaders },
      );
    }

    const record = payload.record;

    // Skip if no person_id — nothing to sync
    if (!record.person_id) {
      return new Response(
        JSON.stringify({ skipped: true, reason: "No person_id" }),
        { status: 200, headers: corsHeaders },
      );
    }

    // Init Supabase client (SUPABASE_URL & SUPABASE_SERVICE_ROLE_KEY are built-in)
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Query person to get sheet_webhook_url
    const { data: person, error: personErr } = await supabase
      .from("people")
      .select("sheet_webhook_url")
      .eq("id", record.person_id)
      .single();

    if (personErr) {
      throw new Error(`Person query failed: ${personErr.message}`);
    }

    if (!person?.sheet_webhook_url) {
      return new Response(
        JSON.stringify({ skipped: true, reason: "Person has no sheet_webhook_url" }),
        { status: 200, headers: corsHeaders },
      );
    }

    // Derive cycle_tag from occurred_at (YYYY-MM)
    const occurredAt = record.occurred_at
      ? new Date(record.occurred_at as string)
      : new Date();
    const cycleTag = `${occurredAt.getFullYear()}-${String(occurredAt.getMonth() + 1).padStart(2, "0")}`;

    // Map type to In/Out (simplified: only income/expense)
    const direction = record.type === "income" ? "In" : "Out";

    // Build payload matching Code.js handleSingleTransaction format
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
      cycle_tag: record.persisted_cycle_tag ?? cycleTag,
    };

    // POST to Google Apps Script webhook
    const sheetRes = await fetch(person.sheet_webhook_url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(row),
    });

    if (!sheetRes.ok) {
      const body = await sheetRes.text();
      throw new Error(`Google Sheets webhook failed (${sheetRes.status}): ${body}`);
    }

    return new Response(
      JSON.stringify({ success: true, cycle_tag: cycleTag }),
      { status: 200, headers: corsHeaders },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[sync-to-sheets] Error:", message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: corsHeaders },
    );
  }
});
