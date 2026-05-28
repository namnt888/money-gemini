import { NextRequest, NextResponse } from "next/server";
import { parseTransactionText } from "@/lib/ai/parser";

export async function POST(req: NextRequest) {
  try {
    const { text } = (await req.json()) as { text?: string };

    if (!text?.trim()) {
      return NextResponse.json(
        { error: "Missing 'text' in request body" },
        { status: 400 },
      );
    }

    const parsed = await parseTransactionText(text);
    return NextResponse.json(parsed);
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error("[/api/parse] error:", error.message);
    console.error("[/api/parse] stack:", error.stack);
    return NextResponse.json(
      { error: error.message, stack: error.stack },
      { status: 500 },
    );
  }
}
