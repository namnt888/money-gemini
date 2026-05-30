TASK 5.1: Quản lý Subscriptions & Vercel Cron Job

BƯỚC 0: TẢI NGỮ CẢNH (MANDATORY)

Trước khi làm bất cứ điều gì, bạn (Agent) BẮT BUỘC PHẢI đọc nội dung của 2 file sau để nắm rõ quy luật code của dự án:

.agent/knowledge/rules.md

.agent/knowledge/tech-stack.md

NGỮ CẢNH & YÊU CẦU

Chúng ta cần xây dựng hệ thống tự động sinh giao dịch cho các dịch vụ định kỳ (Subscriptions) như Youtube Premium, iCloud.
Hệ thống này sẽ được kích hoạt bởi Vercel Cron Job vào ngày mùng 1 hàng tháng. Nó tự động chia tiền, tạo giao dịch chi tiêu (expense) cho "chủ xị" và giao dịch nợ (debt) cho các thành viên.

QUY TRÌNH THỰC HIỆN (AGENT PHẢI LÀM THEO ĐÚNG THỨ TỰ)

BƯỚC 1: GIT WORKFLOW

Dựa vào rules.md, hãy tạo nhánh mới cho task này: git checkout -b feat/subscription-cron-job

BƯỚC 2: DATABASE MIGRATION
Chúng ta sử dụng mô hình Relational: subscriptions (1) --- (N) service_members

Tạo file migration mới: npx supabase migration new add_subscriptions_tables

Viết SQL tạo 2 bảng (Sử dụng gen_random_uuid() cho PK):

subscriptions: id (UUID PK), name (VARCHAR), price (BIGINT), total_slots (INT), account_id (UUID FK tới accounts), is_active (BOOLEAN DEFAULT TRUE).

service_members: id (UUID PK), subscription_id (UUID FK), person_id (UUID FK tới people), slots (INT).

Lưu ý: BẠN KHÔNG CẦN CHẠY LỆNH db push, hãy để user tự chạy sau.

BƯỚC 3: API CRON JOB (src/app/api/cron/subscriptions/route.ts)

Endpoint này xử lý GET request.

Bảo mật: Lấy Bearer token trong headers và so sánh với process.env.CRON_SECRET. Trả 401 Unauthorized nếu sai hoặc không có.

Logic:

Khởi tạo Supabase Client bằng @supabase/supabase-js với SUPABASE_SERVICE_ROLE_KEY (để bỏ qua RLS khi chạy background).

Query tất cả subscriptions đang active, join lấy list service_members.

Loop qua từng subscription. Xác định cycle_tag là YYYY-MM hiện tại (vd: 2026-05).

Tính slotPrice = Math.round(sub.price / sub.total_slots).

Tạo mảng dữ liệu (để bulk insert):

Tạo 1 record Expense (cho chủ xị): amount = sub.price, type = 'expense', account_id = sub.account_id, persisted_cycle_tag = cycle_tag, notes = "{sub.name} {cycle_tag} [{slotPrice}]/{sub.total_slots} {slotPrice}". metadata lưu {"is_auto_generated": true, "subscription_id": sub.id}.

Loop qua service_members, tạo các record Debt (cho người khác): amount = member.slots * slotPrice, type = 'debt', account_id = sub.account_id, person_id = member.person_id, persisted_cycle_tag = cycle_tag. Notes và metadata tương tự như trên.

Dùng Supabase client vừa tạo để bulk insert mảng dữ liệu này vào bảng transactions.

BƯỚC 4: VERCEL CRON CONFIG

Tạo hoặc cập nhật file vercel.json ở root folder của dự án:

{
  "crons": [
    {
      "path": "/api/cron/subscriptions",
      "schedule": "5 0 1 * *"
    }
  ]
}


BƯỚC 5: COMMIT GIAO VIỆC

Hoàn thành xong, hãy chạy:
git add .
git commit -m "feat(cron): add subscriptions tables and cron api"

Báo cáo lại cho user khi hoàn tất các bước.