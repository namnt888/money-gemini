TASK 3.2: Nâng cấp Edge Function Sync Sheet (Dynamic Webhooks & Exact Layout)

ROLE

You are an Expert Supabase Edge Function & Google Apps Script Developer.

YÊU CẦU NGHIỆP VỤ (CRITICAL)

Kiến trúc cũ dùng 1 biến môi trường cho Webhook là sai lầm vì hệ thống có nhiều people (nhiều users), mỗi người có 1 file Sheet riêng.
Chúng ta cần sửa lại luồng: Trigger -> Edge Function -> Query DB lấy Webhook của Person -> Push to Apps Script.

NHIỆM VỤ CỦA AGENT

1. Database Migration

Tạo file migration mới (npx supabase migration new add_webhook_to_people). Viết SQL:

Thêm cột sheet_webhook_url (TEXT) vào bảng people.

Thêm cột clasp_script_id (TEXT) vào bảng people (để dự phòng cho tool CI/CD sau này).

2. Rewrite Edge Function (supabase/functions/sync-to-sheets/index.ts)

Viết lại Edge Function này bằng Deno. Logic mới:

Nhận payload từ Webhook (INSERT trên bảng transactions).

Khởi tạo Supabase Client bên trong Edge Function (sử dụng biến môi trường mặc định SUPABASE_URL và SUPABASE_SERVICE_ROLE_KEY có sẵn của Deno).

Dùng person_id từ record giao dịch để query bảng people.

Lấy ra sheet_webhook_url. Nếu null thì return (bỏ qua, không lỗi).

Dùng fetch POST sang URL đó.

Payload gửi sang Apps Script phải chuẩn bị sẵn data map với các cột A-K (ID, Type (In/Out), Date, Shop, Notes, Amount, % Back, đ Back, Σ Back, Final Price, ShopSource).

3. Write Google Apps Script (.agent/knowledge/google-apps-script.js)

Ghi đè file script này. Yêu cầu CHẶT CHẼ:

Hàm doPost(e) nhận JSON.

Tự động nhận diện tab dựa vào cycle_tag gửi từ Edge Function (VD: "2026-05").

NẾU tab chưa tồn tại: Tạo tab mới, set header từ A2:K2 (ID, Type, Date, Shop, Notes, Amount, % Back, đ Back, Σ Back, Final Price, ShopSource). TUYỆT ĐỐI KHÔNG ghi đè ô A1.

Append dòng dữ liệu mới vào đúng thứ tự cột từ A-K. Chú ý mapping Type = 'In' hoặc 'Out' dựa vào type của transaction.

Trả về JSON {success: true}.

Hoàn thành và báo cáo chi tiết các file đã sửa.