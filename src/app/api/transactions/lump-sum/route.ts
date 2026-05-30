import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/server";

/**
 * POST /api/transactions/lump-sum
 *
 * Create a lump-sum transaction from manual rows on Google Sheet.
 * This transaction is marked with is_sync_sheet = false so it
 * won't be pushed back to the sheet (preventing duplicates).
 *
 * Payload:
 *   { cycle: "2026-06", amount: 4000, type: "income", notes: "..." }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { cycle, amount, type, notes, account_id, person_id } = body;

    if (!cycle || !amount || !type) {
      return NextResponse.json(
        { error: "Missing required fields: cycle, amount, type" },
        { status: 400 },
      );
    }

    if (!["income", "expense"].includes(type)) {
      return NextResponse.json(
        { error: "type must be 'income' or 'expense'" },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from("transactions")
      .insert({
        amount,
        type,
        account_id: account_id || null,
        person_id: person_id || null,
        notes: notes || `Lump sum from Sheet ${cycle}`,
        occurred_at: new Date().toISOString(),
        status: "posted",
        is_sync_sheet: false,
        persisted_cycle_tag: cycle,
      })
      .select("id")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, {  500 });
    }

    return NextResponse.json({
      success: true,
      transaction_id: data.id,
      message: `Lump sum created: ${type} ${amount} for ${cycle} (is_sync_sheet=false)`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
