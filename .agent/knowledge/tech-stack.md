Tech Stack - Money Flow v2

Framework: Next.js 14+ (App Router), React, TypeScript.

Styling: Tailwind CSS, shadcn/ui, Lucide Icons.

Backend & Database: Supabase (PostgreSQL).

Backend Logic (Background jobs/Webhooks): Supabase Edge Functions (Deno).

AI Engine: Local LLM (Hermes/Clawbot) thông qua 9router API (chuyên xử lý parse text thành JSON).

Integrations:

Đầu vào: Obsidian (nhập text thô).

Đầu ra/Backup: Google Sheets (Đồng bộ một chiều từ Supabase lên Sheet thông qua Edge Functions).