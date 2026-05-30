TASK 5.2.1: BONUS - Lump Sum Sync & AI People Parser

BƯỚC 0: TẢI NGỮ CẢNH (MANDATORY)

Bạn (Agent) BẮT BUỘC PHẢI đọc nội dung của các file sau:

.agent/knowledge/rules.md

.agent/knowledge/tech-stack.md

VẤN ĐỀ CẦN GIẢI QUYẾT

Bổ sung Schema: Bảng people cần đảm bảo có đủ 2 cột clasp_script_id và clasp_deploy_id để chuẩn bị cho automation script. Cập nhật luôn Deploy ID hiện tại của Tuấn.

AI People Parser: Cho phép user gõ text tự do (VD: "Lâm: iCloud 2, Youtube 2. Chị Ánh, label Ashley") để hệ thống tự động tạo Person, tạo Label không dấu, và map vào bảng service_members.

Lump Sum Sync (Sheet -> DB): Cho phép Google Sheets quét các dòng nhập tay (cột ID trống) ở Tab hiện tại, tính tổng gộp (Lump Sum), lấy Cycle từ tên Tab, và gọi API đưa về DB. Giao dịch này phải lưu với is_sync_sheet = false.

QUY TRÌNH THỰC HIỆN

BƯỚC 1: GIT WORKFLOW

Tạo nhánh mới: git checkout -b feat/sync-bonus-and-people-parser

BƯỚC 2: DATABASE MIGRATION

Tạo file migration mới: npx supabase migration new add_clasp_deploy_id_and_update_tuan

Viết SQL:

Sử dụng khối DO $$BEGIN ... END$$; để kiểm tra an toàn. Nếu cột clasp_deploy_id và clasp_script_id chưa có trong bảng people thì ALTER TABLE thêm vào (kiểu VARCHAR).

Viết lệnh UPDATE data:
UPDATE people SET clasp_deploy_id = 'AKfycbzRfRSJct2o9TnvJ50AYPY7WlW23hmhtG1mLnCbBNYW-p_5AApi61Lr-a-mgPRlDLmceQ' WHERE label = 'Tuấn';

Lưu ý: Không tự chạy db push, để user tự chạy.

BƯỚC 3: AI PEOPLE PARSER (src/lib/ai/people-parser.ts & API)

Viết file src/lib/ai/people-parser.ts. Thiết kế System Prompt dạy LLM phân tích câu lệnh khởi tạo người dùng (VD: "Lâm: iCloud 2, Youtube 2. Chị Ánh, label Ashley").

Output format JSON mong muốn:
[{ "name": "Lâm", "label": "Lâm", "subscriptions": [{ "name": "iCloud", "slots": 2 }, { "name": "Youtube", "slots": 2 }] }]

Lưu ý rule: AI phải tự nhận biết các dịch vụ dựa trên text.

Tạo API endpoint src/app/api/people/quick-add/route.ts. Hàm POST này sẽ nhận JSON từ AI, sau đó:

UPSERT vào bảng people (tạo ID mới nếu name/label chưa có).

Lấy ID của Person. Dựa vào mảng subscriptions, tìm id trong bảng subscriptions (theo tên).

UPSERT vào bảng service_members (kết nối person_id, subscription_id và slots).

BƯỚC 4: API LUMP SUM TỪ SHEET (src/app/api/transactions/lump-sum/route.ts)

Tạo API nhận request POST chứa mảng các giao dịch tổng.
Payload mẫu: { cycle: '2026-06', amount: 4000, type: 'income', notes: 'Gộp tay trên Sheet 2026-06' }

Logic: INSERT vào bảng transactions kèm cờ is_sync_sheet = false (để Trigger Postgres bỏ qua không đẩy ngược lên sheet) và persisted_cycle_tag = payload.cycle.

Trả về status 200.

BƯỚC 5: CẬP NHẬT GOOGLE APPS SCRIPT (Mẫu Code)

Mở file .agent/knowledge/google-apps-script.js (hoặc sửa trực tiếp file Code.js nếu bạn đang track nó).

Thêm một hàm để tạo Nút UI Menu:

function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('🚀 Money Flow')
    .addItem('Push Manual Rows to DB', 'pushManualToDB')
    .addToUi();
}


Viết hàm pushManualToDB():

Đọc tên Tab hiện tại bằng SpreadsheetApp.getActiveSheet().getName() và trích xuất ra YYYY-MM để làm cycle_tag.

Lặp qua vùng dữ liệu (từ A2 xuống), gom các dòng có cột A (ID) = rỗng.

Tính tổng Amount (cột F) theo Type (cột B).

Đổi giá trị cột A của các dòng đó thành synced-lump-sum để đánh dấu không sync lại lần sau.

Gọi UrlFetchApp.fetch POST về endpoint ở Bước 4. Xử lý UI Browser.msgBox để báo thành công.

BƯỚC 6: COMMIT GIAO VIỆC

Chạy: git add . && git commit -m "feat(ai): add people parser, lump sum api and sheet menu"