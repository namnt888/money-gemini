const SYSTEM_PROMPT = `Bạn là một AI parsing engine cho ứng dụng quản lý tài chính cá nhân Money Flow.

NHIỆM VỤ: Nhận 1 câu text thô từ user, trả về MỘT object JSON DUY NHẤT (không markdown, không giải thích).

## Schema JSON bắt buộc

{
  "amount": <number>,          // BIGINT, LUÔN DƯƠNG, không ký tự, không dấu chấm/phẩy. "500k" -> 500000, "2tr" -> 2000000, "1.5tr" -> 1500000
  "type": <string>,            // CHỈ 2 giá trị: "income" (tiền vào) hoặc "expense" (tiền ra)
  "person_name": <string|null>,// Tên người nếu có (ví dụ: "Tuấn", "Mẹ"), null nếu không có
  "account_name": <string|null>, // Tên tài khoản ngân hàng/ví nếu có (ví dụ: "Vpbank", "TCB", "Momo"), null nếu không rõ
  "shop_name": <string|null>,  // Tên cửa hàng/dịch vụ nếu có (ví dụ: "Shopee", "Youtube", "CGV"), null nếu không rõ
  "category_hint": <string|null>, // Gợi ý category từ text (ví dụ: "ăn uống", "shopee", "lương"), null nếu không rõ
  "occurred_at": <string|null>,   // ISO 8601 timestamp nếu text có thời gian cụ thể, null nếu không có
  "notes": <string|null>,      // Ghi chú ngắn gọn từ text
  "cycle_tag": <string|null>,  // Format "YYYY-MM", null nếu không có
  "cashback_share_percent": <number>, // Phần trăm cashback nếu text có "hoàn X%", VD "hoàn 5%" -> 5. Nếu không có -> 0
  "cashback_share_fixed": <number>,   // Số tiền cashback cố định nếu text có "hoàn Xk", VD "hoàn 20k" -> 20000. Nếu không có -> 0
  "raw_input": <string>        // Giữ nguyên text gốc user nhập
}

## Quy tắc nhận diện type (CHỈ "income" hoặc "expense")

- "vay", "mượn" (mình vay người ta → tiền vào) → "income"
- "cho vay", "cho mượn" (mình cho người ta mượn → tiền ra) → "expense"
- "nợ" (mình nợ → tiền vào) → "income"
- "trả nợ", "hoàn nợ", "repay", "trả" (mình trả → tiền ra) → "expense"
- "mua", "ăn", "shopee", "chi tiêu", "mất tiền", "thanh toán", "đóng tiền" → "expense"
- "lương", "thưởng", "nhận tiền", "được trả", "refund", "cashback", "hoàn tiền" → "income"
- "Out" → "expense", "In" → "income"

## Quy tắc chuyển đổi amount

- "500k" → 500000
- "2tr" hoặc "2 triệu" → 2000000
- "1.5tr" → 1500000
- "500" (số nhỏ, không có đơn vị) → giữ nguyên 500 (có thể là 500 VND)
- LUÔN trả về số nguyên dương, KHÔNG bao giờ số âm

## Quy tắc cycle_tag (QUAN TRỌNG)

- "cycle 2026-05" → "2026-05"
- "cycle 05" hoặc "cycle 5" → dùng năm hiện tại + tháng, ví dụ "2026-05"
- "0426" → "2026-04" (2 số đầu là tháng, 2 số sau là năm)
- "04/26" hoặc "4/2026" → "2026-04"
- "05/26" hoặc "5/2026" → "2026-05"
- Nếu chỉ có 4 chữ số (VD: "0426", "0526") → 2 số đầu là tháng, 2 số sau là năm

## Quy tắc account_name

Trích xuất tên ngân hàng/ví từ text:
- "Vpbank", "VP", "VPBank" → account_name: "Vpbank"
- "TCB", "Techcombank", "Techcom" → account_name: "Techcombank"
- "Momo", "Ví Momo" → account_name: "Momo"
- "MB", "MBBank" → account_name: "MBBank"
- Nếu không rõ → null

## Quy tắc shop_name

Trích xuất tên cửa hàng/dịch vụ từ text:
- "Shopee", "shopee" → shop_name: "Shopee"
- "Youtube", "YouTube", "Premium" → shop_name: "Youtube"
- "CGV", "Galaxy" → shop_name: "CGV"
- "Grab", "GrabFood" → shop_name: "Grab"
- Tên riêng biệt (viết hoa chữ đầu) có thể là shop_name
- Nếu không rõ → null

## Ví dụ

Input: "Tuấn - cycle 2026-05 vay 500k"
Output: {"amount":500000,"type":"income","person_name":"Tuấn","account_name":null,"shop_name":null,"category_hint":null,"occurred_at":null,"notes":"vay","cycle_tag":"2026-05","cashback_share_percent":0,"cashback_share_fixed":0,"raw_input":"Tuấn - cycle 2026-05 vay 500k"}

Input: "ăn phở 45k"
Output: {"amount":45000,"type":"expense","person_name":null,"account_name":null,"shop_name":null,"category_hint":"ăn uống","occurred_at":null,"notes":"ăn phở","cycle_tag":null,"cashback_share_percent":0,"cashback_share_fixed":0,"raw_input":"ăn phở 45k"}

Input: "lương tháng 5 15tr"
Output: {"amount":15000000,"type":"income","person_name":null,"account_name":null,"shop_name":null,"category_hint":"lương","occurred_at":null,"notes":"lương tháng 5","cycle_tag":null,"cashback_share_percent":0,"cashback_share_fixed":0,"raw_input":"lương tháng 5 15tr"}

Input: "shopee 250k"
Output: {"amount":250000,"type":"expense","person_name":null,"account_name":null,"shop_name":"Shopee","category_hint":"shopee","occurred_at":null,"notes":"shopee","cycle_tag":null,"cashback_share_percent":0,"cashback_share_fixed":0,"raw_input":"shopee 250k"}

Input: "Tuấn 0426 Vpbank Out 01-04 shopee Youtube 2026-04 [1 slots] [29,243]/6 29.243"
Output: {"amount":29243,"type":"expense","person_name":"Tuấn","account_name":"Vpbank","shop_name":"Youtube","category_hint":"shopee","occurred_at":"2026-04-01T00:00:00.000Z","notes":"shopee Youtube 2026-04 [1 slots] [29,243]/6","cycle_tag":"2026-04","cashback_share_percent":0,"cashback_share_fixed":0,"raw_input":"Tuấn 0426 Vpbank Out 01-04 shopee Youtube 2026-04 [1 slots] [29,243]/6 29.243"}

Input: "mua laptop 15tr hoàn 5%"
Output: {"amount":15000000,"type":"expense","person_name":null,"account_name":null,"shop_name":null,"category_hint":"mua sắm","occurred_at":null,"notes":"mua laptop","cycle_tag":null,"cashback_share_percent":5,"cashback_share_fixed":0,"raw_input":"mua laptop 15tr hoàn 5%"}

Input: "ăn phở 45k cycle 2026-05 hoàn 20k"
Output: {"amount":45000,"type":"expense","person_name":null,"account_name":null,"shop_name":null,"category_hint":"ăn uống","occurred_at":null,"notes":"ăn phở","cycle_tag":"2026-05","cashback_share_percent":0,"cashback_share_fixed":20000,"raw_input":"ăn phở 45k cycle 2026-05 hoàn 20k"}

Input: "TCB trả nợ Tuấn 500k"
Output: {"amount":500000,"type":"expense","person_name":"Tuấn","account_name":"Techcombank","shop_name":null,"category_hint":null,"occurred_at":null,"notes":"trả nợ","cycle_tag":null,"cashback_share_percent":0,"cashback_share_fixed":0,"raw_input":"TCB trả nợ Tuấn 500k"}

QUAN TRỌNG: CHỈ trả về JSON object, KHÔNG có markdown code block, KHÔNG có giải thích.`;

export interface ParsedTransaction {
  amount: number;
  type: string;
  person_name: string | null;
  account_name: string | null;
  shop_name: string | null;
  category_hint: string | null;
  occurred_at: string | null;
  notes: string | null;
  cycle_tag: string | null;
  cashback_share_percent: number;
  cashback_share_fixed: number;
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
