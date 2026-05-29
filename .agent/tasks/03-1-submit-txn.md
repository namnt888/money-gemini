TASK 3.1: Hoàn thiện Endpoint Submit Transaction (Tự động Map ID & Insert DB)

ROLE

You are an Expert Supabase and Next.js (App Router) Developer.

Hướng dẫn Context

Hãy đọc .agent/knowledge/schema.md để nắm cấu trúc DB.
Đặc biệt lưu ý bảng transactions yêu cầu account_id là NOT NULL. person_id và category_id là nullable nhưng nên cố gắng map.

Yêu cầu Nghiệp vụ

Tạo một API endpoint mới tại src/app/api/transactions/quick-add/route.ts. Endpoint này sẽ:

Nhận text từ body request.

Tái sử dụng hàm AI Parser ở Task 2 để lấy JSON parsed (gồm amount, type, person_name, category_hint, cycle_tag, notes, v.v.).

Khởi tạo Supabase Server Client (sử dụng @supabase/ssr hoặc @supabase/supabase-js với Service Role key để thao tác DB trong nội bộ server).

Thực hiện Mapping ID:

Account (Bắt buộc): Query bảng accounts lấy tài khoản đầu tiên có is_active = true (làm tài khoản mặc định). Lấy id của nó.

Person: Nếu JSON có person_name, query bảng people (ilike name). Nếu tìm thấy, lấy id. Nếu CHƯA có, thực hiện INSERT INTO people (name) và lấy id mới.

Category: Nếu JSON có category_hint, query bảng categories (ilike name hoặc code). Nếu không thấy, query category có code = 'uncategorized'. Lấy id.

Insert Transaction: Tạo object transaction với các id (UUID) vừa map được, kết hợp với amount, type, notes, raw_input (lấy từ text gốc), persisted_cycle_tag (từ cycle_tag), và status = 'posted'. Thực hiện INSERT vào bảng transactions.

Trả về kết quả JSON báo thành công kèm object transaction vừa insert.

Vui lòng viết code TypeScript thật clean, handle lỗi (try/catch) rõ ràng. Hoàn thành và báo cáo.