TASK 02: Xây dựng AI Parsing Engine (Local LLM)

ROLE

You are an Expert Full-Stack Developer specializing in TypeScript, Next.js, and LLM Integrations.

Hướng dẫn Context

Hãy đọc kỹ .agent/knowledge/rules.md.

Quan trọng: Hãy đọc file supabase/migrations/ (file .sql mới nhất) để nắm chính xác tên cột và kiểu dữ liệu của bảng transactions. Đây là schema chuẩn.

Yêu Cầu Nghiệp Vụ

Bạn cần viết một AI Parsing Engine bằng TypeScript. Chức năng này nhận đầu vào là một câu text do user gõ thô, và trả về đúng một object JSON chuẩn cấu trúc Insert của bảng transactions (để sau này ném thẳng vào Supabase).

Ví dụ Input: "Tuấn - cycle 2026-05 vay 500k"
Ví dụ Output JSON mong muốn:

{
  "amount": 500000,
  "type": "debt",
  "account_id": null,
  "category_id": null,
  "person_id": null, 
  "occurred_at": "2026-05-28T...Z",
  "notes": "vay",
  "raw_input": "Tuấn - cycle 2026-05 vay 500k",
  "status": "posted"
}


(Lưu ý: account_id, category_id, person_id sẽ được fill UUID thực tế sau khi query DB, ở bước parse này LLM chỉ cần trả về null hoặc extract tên ra một trường tạm tùy bạn thiết kế).

Nhiệm vụ của bạn (Agent)

Tạo thư mục src/lib/ai/ và tạo file src/lib/ai/parser.ts.

Viết System Prompt (hướng dẫn cho LLM) cực kỳ chặt chẽ bên trong file đó. System Prompt phải dặn LLM:

Cách nhận diện type: "vay", "mượn", "nợ" -> debt/repayment; "mua", "ăn", "shopee" -> expense; "lương" -> income.

amount LUÔN LUÔN trả về số nguyên (number trong JSON, tương ứng BIGINT), không có ký tự, KHÔNG lưu số âm. Chuyển đổi "500k" -> 500000.

Bắt các keyword đặc biệt như cycle YYYY-MM để sau này map logic.

Viết hàm parseTransactionText(text: string) sử dụng SDK của LLM (giả lập hoặc dùng fetch gọi API của OpenAI/Groq/Ollama/9router tùy bạn chọn) để gọi System Prompt trên. Hàm trả về Promise<any> (là cái object JSON).

(Tuỳ chọn) Tạo 1 file src/app/api/parse/route.ts (Next.js App Router) để làm endpoint test thử hàm trên.

Vui lòng chỉ tập trung vào logic parse, không cần làm UI. Hoàn thành và báo cáo lại.