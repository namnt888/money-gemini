const SYSTEM_PROMPT = `Bạn là một AI parsing engine cho ứng dụng quản lý tài chính cá nhân Money Flow.

NHIỆM VỤ: Nhận 1 câu text thô từ user, trả về MỘT object JSON DUY NHẤT (không markdown, không giải thích).

## Schema JSON bắt buộc

{
  "amount": <number>,          // BIGINT, LUÔN DƯƠNG, không ký tự, không dấu chấm/phẩy. "500k" -> 500000, "2tr" -> 2000000, "1.5tr" -> 1500000
  "type": <string>,            // Một trong: "income", "expense", "transfer_in", "transfer_out", "debt", "repayment", "cashback"
  "person_name": <string|null>,// Tên người nếu có (ví dụ: "Tuấn", "Mẹ"), null nếu không có
  "category_hint": <string|null>, // Gợi ý category từ text (ví dụ: "ăn uống", "shopee", "lương"), null nếu không rõ
  "occurred_at": <string|null>,   // ISO 8601 timestamp nếu text có thời gian cụ thể, null nếu không có
  "notes": <string|null>,      // Ghi chú ngắn gọn từ text
  "cycle_tag": <string|null>,  // Format "YYYY-MM" nếu text có keyword "cycle YYYY-MM", null nếu không có
  "raw_input": <string>        // Giữ nguyên text gốc user nhập
}

## Quy tắc nhận diện type

- "vay", "mượn", "cho vay", "nợ" → "debt"
- "trả nợ", "hoàn nợ", "repay" → "repayment"
- "mua", "ăn", "shopee", "chi tiêu", "mất tiền", "thanh toán", "đóng tiền" → "expense"
- "lương", "thưởng", "nhận tiền", "được trả", "refund" → "income"
- "chuyển khoản", "chuyển vào", "rút tiền" → suy luận "transfer_in" hoặc "transfer_out"
- "cashback", "hoàn tiền" → "cashback"

## Quy tắc chuyển đổi amount

- "500k" → 500000
- "2tr" hoặc "2 triệu" → 2000000
- "1.5tr" → 1500000
- "500" (số nhỏ, không có đơn vị) → giữ nguyên 500 (có thể là 500 VND)
- LUÔN trả về số nguyên dương, KHÔNG bao giờ số âm

## Quy tắc cycle_tag

- Nếu text chứa "cycle 2026-05" → cycle_tag: "2026-05"
- Nếu text chứa "cycle 05" hoặc "cycle 5" → cycle_tag: dùng năm hiện tại + tháng, ví dụ "2026-05"

## Ví dụ

Input: "Tuấn - cycle 2026-05 vay 500k"
Output: {"amount":500000,"type":"debt","person_name":"Tuấn","category_hint":null,"occurred_at":null,"notes":"vay","cycle_tag":"2026-05","raw_input":"Tuấn - cycle 2026-05 vay 500k"}

Input: "ăn phở 45k"
Output: {"amount":45000,"type":"expense","person_name":null,"category_hint":"ăn uống","occurred_at":null,"notes":"ăn phở","cycle_tag":null,"raw_input":"ăn phở 45k"}

Input: "lương tháng 5 15tr"
Output: {"amount":15000000,"type":"income","person_name":null,"category_hint":"lương","occurred_at":null,"notes":"lương tháng 5","cycle_tag":null,"raw_input":"lương tháng 5 15tr"}

Input: "shopee 250k"
Output: {"amount":250000,"type":"expense","person_name":null,"category_hint":"shopee","occurred_at":null,"notes":"shopee","cycle_tag":null,"raw_input":"shopee 250k"}

QUAN TRỌNG: CHỈ trả về JSON object, KHÔNG có markdown code block, KHÔNG có giải thích.`;

export interface ParsedTransaction {
  amount: number;
  type: string;
  person_name: string | null;
  category_hint: string | null;
  occurred_at: string | null;
  notes: string | null;
  cycle_tag: string | null;
  raw_input: string;
}

function extractJson(raw: string): string {
  // 1. Strip markdown code block nếu có
  let cleaned = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  // 2. Tìm vị trí { đầu tiên và } cuối cùng để trích JSON
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");

  if (firstBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  return cleaned;
}

export async function parseTransactionText(
  text: string,
): Promise<ParsedTransaction> {
  const apiUrl =
    process.env.LLM_API_URL ?? "http://localhost:11434/v1/chat/completions";
  const apiKey = process.env.LLM_API_KEY ?? "ollama";
  const model = process.env.LLM_MODEL ?? "qwen2.5:7b";

  console.log("[parser] LLM_API_URL:", apiUrl);
  console.log("[parser] LLM_MODEL:", model);
  console.log("[parser] input text:", text);

  const requestBody = {
    model,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: text },
    ],
    temperature: 0,
  };

  console.log("[parser] request body:", JSON.stringify(requestBody, null, 2));

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(requestBody),
  });

  console.log("[parser] response status:", response.status);

  const rawBody = await response.text();
  console.log("[parser] raw response body (first 2000 chars):", rawBody.substring(0, 2000));

  if (!response.ok) {
    throw new Error(`LLM API error ${response.status}: ${rawBody}`);
  }

  // Try parsing as JSON, handling possible SSE or extra data
  let data: Record<string, unknown>;
  try {
    data = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    // Maybe SSE format: "data: {...}\n\n" — try extracting the JSON line
    const jsonLine = rawBody
      .split("\n")
      .find((line) => line.startsWith("data: ") && line.includes("{"));
    if (jsonLine) {
      const jsonPart = jsonLine.replace(/^data:\s*/, "").trim();
      data = JSON.parse(jsonPart) as Record<string, unknown>;
    } else {
      // Last resort: find first { ... } in the body
      const firstBrace = rawBody.indexOf("{");
      const lastBrace = rawBody.lastIndexOf("}");
      if (firstBrace !== -1 && lastBrace > firstBrace) {
        data = JSON.parse(rawBody.substring(firstBrace, lastBrace + 1)) as Record<string, unknown>;
      } else {
        throw new Error(`Cannot parse LLM response as JSON: ${rawBody.substring(0, 500)}`);
      }
    }
  }

  const content: string =
    (data.choices as Array<{ message?: { content?: string } }>)?.[0]?.message?.content ?? "";

  console.log("[parser] raw LLM content:", content);

  const jsonStr = extractJson(content);

  console.log("[parser] extracted JSON string:", jsonStr);

  const parsed = JSON.parse(jsonStr) as ParsedTransaction;
  parsed.raw_input = text;

  // Enforce amount is positive integer
  parsed.amount = Math.abs(Math.round(parsed.amount));

  return parsed;
}
