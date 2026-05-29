TASK 03: Xây dựng Cơ Chế Đồng Bộ Google Sheets (Supabase Edge Function)

ROLE

You are an Expert Supabase Edge Function (Deno) Developer and PostgreSQL DBA.

Hướng dẫn Context

Chúng ta đang làm việc trực tiếp với Production Supabase (không qua Docker local). Kiến trúc:
Next.js (Insert Transaction) -> Postgres Trigger -> Edge Function -> Google Apps Script Webhook.

Nhiệm vụ của bạn (Agent)

Phần 1: Viết Edge Function (Deno)

Tạo thư mục supabase/functions/sync-to-sheets/ và file index.ts.

Edge Function này sẽ nhận HTTP POST request chứa payload từ Database Webhook. Payload có format: {"type": "INSERT", "table": "transactions", "record": {...}}.

Trích xuất record (chứa amount, type, notes, raw_input, v.v.).

fetch POST dữ liệu này sang biến môi trường GOOGLE_SHEET_WEBHOOK_URL.

Đảm bảo code Deno xử lý CORS và có try/catch để log lỗi rõ ràng (dùng console.error).

Phần 2: Script Google Sheets (Lưu vào thư mục docs)

Tạo file .agent/knowledge/google-apps-script.js.

Viết hàm doPost(e) để nhận JSON từ Edge Function, parse ra và dùng sheet.appendRow() đẩy vào dòng cuối cùng của Active Sheet. (Code này user sẽ tự copy).

Phần 3: Database Trigger (SQL Migration)

Tạo file migration mới: supabase/migrations/20260528_trigger_sheet_sync.sql (hoặc prefix timestamp hiện tại).

TRONG FILE NÀY, viết PostgreSQL Trigger sử dụng extension pg_net để gọi Edge Function.

Quan trọng: Vì user chạy trên Cloud, hãy dùng URL có chứa biến môi trường hoặc hướng dẫn user thay thế <PROJECT_REF>. Thay vì hardcode URL, hãy sử dụng hàm gọi nội bộ webhook (hoặc hướng dẫn user tạo Webhook qua UI Supabase nếu pg_net phức tạp).
Khuyến nghị: Tạo 1 function notify_sheet_sync() trigger AFTER INSERT trên transactions có status = 'posted'. Bên trong function, dùng net.http_post(url:='https://[PROJECT_REF].supabase.co/functions/v1/sync-to-sheets', ...). Để tạm [PROJECT_REF] cho user tự thay.

Vui lòng code sạch, không thừa thãi. Báo cáo lại các bước cho user.