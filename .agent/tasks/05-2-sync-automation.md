TASK 5.2: Sync Automation (Flag Sync & Bulk Push Sheets)

BƯỚC 0: TẢI NGỮ CẢNH (MANDATORY)

Trước khi code, bạn (Agent) BẮT BUỘC PHẢI đọc nội dung các file sau:

.agent/knowledge/rules.md

.agent/knowledge/schema.md

Xem lại code hiện tại của .agent/knowledge/google-apps-script.js và supabase/functions/sync-to-sheets/index.ts.

NGỮ CẢNH & YÊU CẦU

Chúng ta cần giải quyết 2 bài toán lớn trong luồng đồng bộ:

Bài toán "Lump Sum" (Gộp giao dịch): Khi user tạo 3 giao dịch nhỏ trên Google Sheet (manual input), họ muốn tạo 1 giao dịch tổng trong DB để theo dõi balance, nhưng KHÔNG muốn giao dịch tổng này bị push ngược lại lên Sheet (gây trùng lặp). Ta cần cờ is_sync_sheet.

Bài toán "Bulk Deploy": Khi sửa code Apps Script, hiện tại phải mở từng file Sheet của từng person để paste tay rất cực. Cần nâng cấp script push-sheet.mjs để nó lấy danh sách clasp_script_id từ DB và tự động push/deploy cho tất cả mọi người.

QUY TRÌNH THỰC HIỆN

BƯỚC 1: GIT WORKFLOW

Tạo nhánh mới: git checkout -b feat/sync-automation

BƯỚC 2: DATABASE MIGRATION

Tạo file migration mới: npx supabase migration new add_sync_flags_and_clasp_ids

Viết SQL:

Bảng transactions: Thêm cột is_sync_sheet BOOLEAN DEFAULT true.

Bảng people: Thêm cột clasp_script_id TEXT và clasp_deploy_id TEXT.

Lưu ý: Không cần chạy db push, user sẽ tự chạy.

BƯỚC 3: CẬP NHẬT EDGE FUNCTION & TRIGGER

Trigger: Sửa file migration cũ hoặc tạo trigger mới, thêm điều kiện vào WHEN (NEW.status = 'posted' AND NEW.is_sync_sheet = true) để PostgreSQL thậm chí không thèm gọi Edge Function nếu is_sync_sheet là false.

Edge Function (supabase/functions/sync-to-sheets/index.ts):

Cập nhật logic: Nhận payload, nếu record.is_sync_sheet === false thì return Response(200) ngay lập tức (đây là chốt chặn thứ 2).

BƯỚC 4: NÂNG CẤP AUTOMATION SCRIPT (scripts/sheet-sync/sync-all-people.mjs)

Script này dùng để push và deploy code từ .agent/knowledge/google-apps-script.js lên hàng loạt Sheet.

Yêu cầu script:

Đọc biến môi trường Supabase (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY).

Query bảng people để lấy danh sách các người dùng có is_active = true VÀ clasp_script_id IS NOT NULL.

Với mỗi person:

Dùng Node.js fs để sửa file .clasp.json (thay đổi scriptId thành clasp_script_id của person đó).

Dùng child_process.execSync chạy lệnh clasp push -f.

NẾU person đó có clasp_deploy_id, chạy tiếp lệnh: clasp deploy --deploymentId <clasp_deploy_id> --description "Auto Update".

Log ra terminal: [Success] Pushed to {person.name}.

BƯỚC 5: COMMIT

git add .

git commit -m "feat(sync): add is_sync_sheet flag and bulk clasp script"

Báo cáo khi hoàn thành.