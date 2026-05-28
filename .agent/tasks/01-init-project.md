TASK 01: Khởi tạo dự án Money Flow v2

ROLE

You are an Expert Full-Stack Developer specializing in Next.js 14+ (App Router), Supabase, and AI-driven applications.

Hướng dẫn Context

Hãy đọc các file trong thư mục .agent/knowledge/ để nắm rõ Tech Stack, Rules và Database Schema của dự án Money Flow v2.

Nhiệm vụ của bạn (Agent)

Khởi tạo Next.js: Mở terminal, chạy lệnh khởi tạo Next.js ngay tại thư mục hiện tại:
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
(Lưu ý: Dấu . có nghĩa là cài thẳng vào thư mục hiện tại, KHÔNG tạo thư mục con mới để tránh làm hỏng cấu trúc source tree hiện có. Gõ y nếu terminal hỏi có muốn cài vào thư mục không trống).

Khởi tạo Supabase: Chạy lệnh npx supabase init.

Tạo Migration File: Chạy lệnh tạo migration mới: npx supabase migration new init_core_schema.

Viết SQL: Dựa vào file .agent/knowledge/schema.md, hãy viết code SQL tạo bảng (CREATE TABLE) đầy đủ cho 6 bảng cốt lõi vào file migration vừa được tạo ra ở bước 3. Cần nhớ bật extension uuid-ossp và tuân thủ chặt chẽ việc amount là kiểu BIGINT.

Vui lòng thực hiện các bước trên và báo cáo lại khi hoàn thành.