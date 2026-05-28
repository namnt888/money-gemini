Coding Rules cho Money Flow v2

1. Triết lý chung

AI-First: Ứng dụng ưu tiên nhập liệu bằng text/CLI (qua Obsidian hoặc Chat), form UI chỉ dùng khi cần chỉnh sửa hoặc fallback.

Single Source of Truth: Bảng transactions là gốc. Không bao giờ lưu cứng current_balance trong bảng accounts, phải tính toán động (compute) từ lịch sử giao dịch.

Minimalism: Code UI đơn giản, sạch sẽ, tập trung vào tốc độ và luồng dữ liệu.

2. Quy ước Database (Supabase)

Sử dụng UUID cho tất cả các Primary Key (id).

Mọi số tiền (amount, balance) đều lưu ở định dạng số nguyên BIGINT (VND, không có số thập phân) và LUÔN DƯƠNG. Chiều dòng tiền (vào/ra) được quyết định bởi trường type của giao dịch.

Tránh lạm dụng JSONB cho dữ liệu có tính quan hệ, ngoại trừ các config phức tạp như cashback_policy.

3. Quy ước Frontend (Next.js)

Sử dụng Next.js App Router mặc định với thư mục src.

Server Components (RSC) mặc định. Chỉ dùng "use client" khi thực sự cần state (useState) hoặc tương tác UI (onClick).

Styling bằng Tailwind CSS và shadcn/ui.