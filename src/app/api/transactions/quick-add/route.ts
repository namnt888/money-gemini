import { NextRequest, NextResponse } from "next/server";
import { parseTransactionText } from "@/lib/ai/parser";
import { supabase } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const { text } = (await req.json()) as { text?: string };

    if (!text?.trim()) {
      return NextResponse.json(
        { error: "Missing 'text' in request body" },
        { status: 400 },
      );
    }

    // 1. Parse text via AI
    const parsed = await parseTransactionText(text);

    // 2. Auto-create Account (required)
    const accountId = await findOrCreateAccount(parsed.account_name);

    // 3. Auto-create Person (optional)
    let personId: string | null = null;
    if (parsed.person_name) {
      personId = await findOrCreatePerson(parsed.person_name);
    }

    // 4. Auto-create Shop (optional)
    let shopId: string | null = null;
    if (parsed.shop_name) {
      shopId = await findOrCreateShop(parsed.shop_name);
    }

    // 5. Map Category (optional)
    let categoryId: string | null = null;
    if (parsed.category_hint) {
      categoryId = await findCategory(parsed.category_hint);
    } else {
      categoryId = await findCategoryByCode("uncategorized");
    }

    // 6. Compute final_price
    const cashbackPercent = parsed.cashback_share_percent ?? 0;
    const cashbackFixed = parsed.cashback_share_fixed ?? 0;
    let finalPrice: number;
    if (parsed.type === "expense") {
      finalPrice = Math.round(
        parsed.amount - (parsed.amount * cashbackPercent / 100) - cashbackFixed,
      );
    } else {
      finalPrice = parsed.amount;
    }

    // 7. Insert transaction
    const transaction = {
      amount: parsed.amount,
      type: parsed.type,
      account_id: accountId,
      category_id: categoryId,
      person_id: personId,
      shop_id: shopId,
      shop_source: parsed.shop_name ?? null,
      occurred_at: parsed.occurred_at ?? new Date().toISOString(),
      notes: parsed.notes,
      raw_input: parsed.raw_input,
      persisted_cycle_tag: parsed.cycle_tag ?? null,
      cashback_share_percent: cashbackPercent,
      cashback_share_fixed: cashbackFixed,
      final_price: finalPrice,
      status: "posted",
    };

    const { data: inserted, error: insertErr } = await supabase
      .from("transactions")
      .insert(transaction)
      .select()
      .single();

    if (insertErr) throw new Error(`Insert failed: ${insertErr.message}`);

    return NextResponse.json({ success: true, transaction: inserted });
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error("[/api/transactions/quick-add] error:", error.message);
    return NextResponse.json(
      { error: error.message },
      { status: 500 },
    );
  }
}

async function findOrCreateAccount(name: string | null): Promise<string> {
  // If name provided, try to find by name
  if (name) {
    const { data: existing, error: findErr } = await supabase
      .from("accounts")
      .select("id")
      .ilike("name", name)
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();

    if (findErr) throw new Error(`Account query failed: ${findErr.message}`);
    if (existing) return existing.id;

    // Create new account
    const { data: created, error: insertErr } = await supabase
      .from("accounts")
      .insert({ name, type: "bank", initial_balance: 0 })
      .select("id")
      .single();

    if (insertErr) throw new Error(`Account insert failed: ${insertErr.message}`);
    return created.id;
  }

  // No name provided — use first active account
  const { data: accounts, error: accountErr } = await supabase
    .from("accounts")
    .select("id")
    .eq("is_active", true)
    .limit(1)
    .order("created_at", { ascending: true });

  if (accountErr) throw new Error(`Account query failed: ${accountErr.message}`);
  if (!accounts?.length) {
    throw new Error("No active account found and no account_name provided.");
  }
  return accounts[0].id;
}

async function findOrCreatePerson(name: string): Promise<string> {
  const { data: existing, error: findErr } = await supabase
    .from("people")
    .select("id")
    .ilike("name", name)
    .limit(1)
    .maybeSingle();

  if (findErr) throw new Error(`Person query failed: ${findErr.message}`);
  if (existing) return existing.id;

  const { data: created, error: insertErr } = await supabase
    .from("people")
    .insert({ name })
    .select("id")
    .single();

  if (insertErr) throw new Error(`Person insert failed: ${insertErr.message}`);
  return created.id;
}

async function findOrCreateShop(name: string): Promise<string> {
  const { data: existing, error: findErr } = await supabase
    .from("shops")
    .select("id")
    .ilike("name", name)
    .limit(1)
    .maybeSingle();

  if (findErr) throw new Error(`Shop query failed: ${findErr.message}`);
  if (existing) return existing.id;

  const { data: created, error: insertErr } = await supabase
    .from("shops")
    .insert({ name })
    .select("id")
    .single();

  if (insertErr) throw new Error(`Shop insert failed: ${insertErr.message}`);
  return created.id;
}

async function findCategory(hint: string): Promise<string | null> {
  const { data: byName, error: nameErr } = await supabase
    .from("categories")
    .select("id")
    .or(`name.ilike.%${hint}%,code.ilike.%${hint}%`)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (nameErr) throw new Error(`Category query failed: ${nameErr.message}`);
  if (byName) return byName.id;

  return findCategoryByCode("uncategorized");
}

async function findCategoryByCode(code: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("categories")
    .select("id")
    .eq("code", code)
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`Category lookup failed: ${error.message}`);
  return data?.id ?? null;
}
