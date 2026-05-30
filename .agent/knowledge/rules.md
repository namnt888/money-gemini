Coding Rules & Workflow cho Money Flow v2

1. Triết lý chung

AI-First: Ưu tiên nhập liệu bằng text/CLI.

Single Source of Truth: Bảng transactions là gốc.

Minimalism: Code UI đơn giản.

2. Quy ước Database (Supabase)

UUID cho Primary Key.

amount là BIGINT, luôn dương.

Tránh lạm dụng JSONB cho quan hệ.

3. Quy ước Frontend (Next.js)

App Router (src/app).

Server Components mặc định.

Tailwind CSS & shadcn/ui.

4. Git Workflow & Convention (BẮT BUỘC)

Branch Naming: feat/ten-chuc-nang (tính năng mới), fix/ten-loi (sửa lỗi), chore/ten-viec (cấu hình/linh tinh).

Commit Message: Dùng Conventional Commits: feat(scope): message, fix(scope): message.

Trước khi code bất cứ task nào, phải tạo nhánh mới: git checkout -b <branch-name>.

Code xong phải add và commit: git add . && git commit -m "...".