// @ts-nocheck — Deno runtime, not Node

/**
 * Edge Function: sync-subscriptions
 *
 * Triggered by Supabase Cron (pg_cron) every 6 hours.
 * Finds active subscriptions where next_due <= today,
 * creates transactions for each, and advances next_due.
 *
 * The created transactions will be synced to Google Sheets
 * automatically via the existing sync-to-sheets trigger.
 *
 * Deploy:
 *   supabase functions deploy sync-subscriptions --no-verify-jwt
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Subscription {
  id: string;
  person_id: string;
  account_id: string;
  category_id: string | null;
  name: string;
  amount: number;
  type: string;
  frequency: string;
  day_of_month: number | null;
  day_of_week: number | null;
  notes: string | null;
  next_due: string;
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
// Date helpers
// ---------------------------------------------------------------------------

function advanceDate(current: Date, frequency: string, dayOfMonth: number | null): Date {
  const next = new Date(current);

  switch (frequency) {
    case "daily":
      next.setDate(next.getDate() + 1);
      break;
    case "weekly":
      next.setDate(next.getDate() + 7);
      break;
    case "monthly":
      next.setMonth(next.getMonth() + 1);
      if (dayOfMonth) {
        next.setDate(Math.min(dayOfMonth, daysInMonth(next.getFullYear(), next.getMonth())));
      }
      break;
    case "quarterly":
      next.setMonth(next.getMonth() + 3);
      if (dayOfMonth) {
        next.setDate(Math.min(dayOfMonth, daysInMonth(next.getFullYear(), next.getMonth())));
      }
      break;
    case "yearly":
      next.setFullYear(next.getFullYear() + 1);
      if (dayOfMonth) {
        next.setDate(Math.min(dayOfMonth, daysInMonth(next.getFullYear(), next.getMonth())));
      }
      break;
  }

  return next;
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function toDateString(d: Date): string {
  return d.toISOString().split("T")[0];
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

Deno.serve(async (req: Request) => {
  // 1. CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // 2. Only accept POST
  if (req.method !== "POST") {
    return corsResponse({ skipped: true, reason: "Method not allowed" }, 405);
  }

  try {
    // 3. Init Supabase with service-role key
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const today = toDateString(new Date());

    // 4. Find active subscriptions due today or earlier
    const { data: subs, error: subErr } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("is_active", true)
      .lte("next_due", today);

    if (subErr) {
      throw new Error(`Subscriptions query failed: ${subErr.message}`);
    }

    if (!subs || subs.length === 0) {
      return corsResponse({
        success: true,
        message: "No subscriptions due",
        created: 0,
      });
    }

    // 5. Process each subscription
    const results: Array<{ id: string; name: string; txn_id: string }> = [];
    const errors: Array<{ id: string; error: string }> = [];

    for (const sub of subs as Subscription[]) {
      try {
        // 5a. Create transaction
        const { data: txn, error: txnErr } = await supabase
          .from("transactions")
          .insert({
            amount: sub.amount,
            type: sub.type,
            account_id: sub.account_id,
            category_id: sub.category_id,
            person_id: sub.person_id,
            occurred_at: sub.next_due + "T00:00:00Z",
            notes: sub.notes || `Auto-generated from subscription: ${sub.name}`,
            raw_input: `[subscription:${sub.id}]`,
            status: "posted",
          })
          .select("id")
          .single();

        if (txnErr) {
          errors.push({ id: sub.id, error: txnErr.message });
          continue;
        }

        // 5b. Compute next_due for next cycle
        const currentDue = new Date(sub.next_due + "T00:00:00Z");
        const nextDue = advanceDate(currentDue, sub.frequency, sub.day_of_month);

        // 5c. Update subscription
        const { error: updErr } = await supabase
          .from("subscriptions")
          .update({
            next_due: toDateString(nextDue),
            last_synced_at: new Date().toISOString(),
          })
          .eq("id", sub.id);

        if (updErr) {
          errors.push({ id: sub.id, error: `Update failed: ${updErr.message}` });
          continue;
        }

        results.push({ id: sub.id, name: sub.name, txn_id: txn.id });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        errors.push({ id: sub.id, error: message });
      }
    }

    // 6. Return summary
    return corsResponse({
      success: true,
      created: results.length,
      failed: errors.length,
      transactions: results,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[sync-subscriptions] Error:", message);
    return corsResponse({ error: message }, 500);
  }
});
