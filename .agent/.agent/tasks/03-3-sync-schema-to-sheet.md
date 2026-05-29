TASK 3.3: Đồng bộ Schema DB với Cấu trúc Google Sheets (A-K)

ROLE

You are an Expert Database Architect & Next.js Developer.

VẤN ĐỀ HIỆN TẠI (CRITICAL)

Bảng transactions hiện tại quá đơn giản, không đủ dữ liệu để map với file Google Sheets của User (Yêu cầu các cột: % Back, đ Back, Final Price, Cycle).

NHIỆM VỤ CỦA AGENT

1. Database Migration (Thêm cột)

Tạo file migration mới (npx supabase migration new add_financial_columns_to_transactions).
Viết SQL thêm các cột sau vào bảng transactions:

persisted_cycle_tag (VARCHAR 10): VD "2026-05" (Để biết nhét vào Tab nào trên Sheet).

debt_cycle_tag (VARCHAR 10): Dùng riêng cho nợ nếu cần.

cashback_share_percent (DECIMAL DEFAULT 0): Tương ứng "% Back".

cashback_share_fixed (BIGINT DEFAULT 0): Tương ứng "đ Back".

final_price (BIGINT): Tương ứng "Final Price" (Giá trị thực tế sau hoàn tiền).

Chú ý: Không dùng uuid_generate_v4(), hãy dùng gen_random_uuid() nếu có tạo bảng.

2. Cập nhật AI Parser (src/lib/ai/parser.ts)

Mở file System Prompt của AI Parser, dạy thêm cho LLM:

Phải extract được cycle_tag (nếu user gõ "cycle 2026-05").

Phải extract được cashback_share_percent (nếu user gõ "hoàn 5%").

Phải extract được cashback_share_fixed (nếu user gõ "hoàn 20k").
Sửa type interface trả về để chứa các trường này.

3. Cập nhật API Insert DB (src/app/api/transactions/quick-add/route.ts)

Sửa logic Insert để lưu các trường mới (persisted_cycle_tag, cashback_share_percent, cashback_share_fixed) vào DB.
Tính toán final_price ngay tại API trước khi Insert:

NẾU type = 'expense' hoặc 'debt': final_price = amount - (amount * cashback_share_percent / 100) - cashback_share_fixed (chú ý làm tròn).

Hoàn thành và báo cáo.