TASK 4.1: Fix Supabase Edge Function & Setup Sheets Sync

VẤN ĐỀ HIỆN TẠI (CONTEXT)

Chúng ta đang ở nhánh sprint-4-fix-edge-function-scripts. Agent ở session trước đã sửa file supabase/functions/sync-to-sheets/index.ts nhưng để lại lỗi syntax (thiếu dấu ngoặc }).
Đồng thời, cần giải quyết lỗi "Silent Failure": Google Apps Script (GAS) luôn trả về HTTP 200 dù có lỗi bên trong. Edge Function phải đọc JSON body từ GAS, nếu có error thì phải throw error thay vì báo success.
Cuối cùng, cần đảm bảo payload gửi sang GAS bao gồm cycle_tag (lấy từ record.persisted_cycle_tag của bảng transactions).

NHIỆM VỤ CỦA BẠN (AGENT)

1. Viết lại hoàn chỉnh file supabase/functions/sync-to-sheets/index.ts

Hãy thay thế toàn bộ nội dung file này bằng code Deno TypeScript chuẩn. Yêu cầu:

Fix Syntax Error: Đảm bảo không còn lỗi } expected. Code phải valid.

CORS: Bắt buộc có block xử lý OPTIONS request.

Payload Validation: Nhận payload từ Webhook Database (chỉ xử lý type === "INSERT" và table === "transactions"). Trích xuất đối tượng record.

Lấy Webhook URL: Lấy GOOGLE_SHEET_WEBHOOK_URL từ biến môi trường. (Tạm thời dùng 1 URL chung cho tất cả, chưa query DB).

Gửi Payload sang GAS: Gửi một JSON object chứa: record (toàn bộ data của transaction) VÀ cycle_tag (giá trị là record.persisted_cycle_tag).

Xử lý Silent Failure (QUAN TRỌNG):

const resData = await sheetRes.json();
if (resData.error) {
   throw new Error("GAS Error: " + resData.error);
}


Dùng console.error để log lỗi rõ ràng trước khi trả về Response 500.

Vui lòng viết lại toàn bộ file index.ts sạch sẽ, không thừa thãi.