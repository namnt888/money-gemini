TASK 4: Fix 401 Edge Function & Prepare Automation Scripts

VẤN ĐỀ CẦN GIẢI QUYẾT

Lỗi 401 Unauthorized khi Trigger gọi Edge Function: Supabase Edge Function sync-to-sheets đang trả về lỗi 401 khi Database Trigger gọi tới (dù đã cấu hình public). Nguyên nhân do Postgres pg_net gửi thiếu Header hoặc Edge Function vẫn còn bật no-verify-jwt chưa đúng cách. Chúng ta cần cập nhật code Edge Function để xử lý chuẩn CORS và Auth.

Dữ liệu Payload gửi qua Sheet: Trong Database, cột debt_cycle_tag đã bị xoá. Thay vào đó ta dùng cột persisted_cycle_tag để nhận dạng Cycle. Edge Function cần đọc giá trị này (hoặc fallback) để chuyển cho Apps Script.

Chuẩn bị Script tự động hoá (Automation Scripts):
Thay vì phải cấu hình tay từng người, ta cần một bộ script dùng Node.js (.mjs) tương tự repo cũ (push-sheet.mjs). Script này sẽ đọc dữ liệu từ Supabase, lấy clasp_script_id của từng Person, và đẩy code Apps Script lên hàng loạt.

NHIỆM VỤ CỦA AGENT

1. Cập nhật Edge Function (supabase/functions/sync-to-sheets/index.ts)

Viết lại toàn bộ file index.ts. Hãy đảm bảo:

Bỏ qua xác thực (Bypass Auth): Mặc định cho phép mọi request lọt qua CORS và không cần kiểm tra JWT lằng nhằng trong code (vì ta đã gọi --no-verify-jwt khi deploy).

Chỉ xử lý JSON có data: Check kỹ req.method === 'POST' và parse payload an toàn.

Sử dụng persisted_cycle_tag: Khi lấy record từ payload, hãy map persisted_cycle_tag (nếu có) thành một biến cycle_tag để chuẩn bị cho Google Apps Script dùng để phân loại Tab.

Tìm Webhook URL động: Query Supabase để lấy sheet_webhook_url từ bảng people dựa vào record.person_id.

Gợi ý: Khởi tạo Supabase Client bằng @supabase/supabase-js trong Edge Function, truyền SUPABASE_URL và SUPABASE_SERVICE_ROLE_KEY (các biến này có sẵn trong Deno env).

2. Cập nhật Trigger SQL (Nếu cần)

Kiểm tra lại supabase/migrations/20260528120000_trigger_sheet_sync.sql.

Hãy đảm bảo URL trong hàm notify_sheet_sync gọi đúng format https://<PROJECT_REF>.supabase.co/functions/v1/sync-to-sheets.

Lưu ý cho user: Nhắc user thay <PROJECT_REF> bằng ID thật và push lại DB.

3. Tạo cấu trúc thư mục cho Automation Scripts

Tạo thư mục scripts/sheet-sync/ nếu chưa có.
Tạo file rỗng scripts/sheet-sync/sync-all-people.mjs. (Chúng ta sẽ implement logic pull từ Supabase và gọi Clasp ở Task sau, hiện tại chỉ cần dựng khung).

4. Cập nhật package.json

Thêm 1 lệnh vào mục scripts trong package.json:
"sync:sheets": "node scripts/sheet-sync/sync-all-people.mjs"

Sau khi code xong, hãy báo cáo lại các file đã sửa.