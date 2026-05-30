# Subscriptions & Prepaid Flow

## Overview

Hệ thống quản lý subscriptions (Youtube, iCloud) cho nhiều người share slots.

## Data Model

### Services (single source of truth for pricing)
- `name`: tên dịch vụ ('Youtube', 'iCloud')
- `code`: mã ('yt', 'ic')
- `price_per_cycle`: giá per slot
- `total_slots`: tổng số người share

### People
- `name`: không dấu (query key)
- `label`: có dấu (display)

### Subscriptions
- `service_id`: FK → services (lấy giá từ đây)
- `slot_number`: slot thứ mấy
- `next_due`: ngày tạo txn tiếp theo
- `prepaid_until`: ngày hết hạn prepaid (NULL = không prepaid)

## Monthly Flow

```
pg_cron (every 6h)
  → Edge Function sync-subscriptions
    → Query: is_active=true, next_due<=today, prepaid_until IS NULL OR prepaid_until < today
    → JOIN services table for current pricing
    → For each: INSERT transaction (amount = services.price_per_cycle), UPDATE next_due += 1 month
    → Trigger sync-to-sheets → Apps Script → Google Sheets
```

## Price Change

```sql
-- Youtube tăng giá: update 1 row, tất cả subscriptions tự động lấy giá mới
UPDATE services SET price_per_cycle = 180000 WHERE code = 'yt';
```

## Prepaid Flow

### When someone pays upfront (e.g., 1 year)

```sql
-- Step 1: Record payment (income txn)
INSERT INTO transactions (amount, type, person_id, account_id, notes, is_sync_sheet, occurred_at)
VALUES (2105472, 'income', PERSON_ID, ACCOUNT_ID, 'Hương prepaid Youtube 06/2026-06/2027', false, NOW());

-- Step 2: Set prepaid_until + skip next_due
UPDATE subscriptions
SET prepaid_until = '2027-06-01', next_due = '2027-06-01'
WHERE person_id = PERSON_ID AND service_id = (SELECT id FROM services WHERE code = 'yt');
```

### When prepaid expires

Cron automatically resumes creating expense txns. User needs to pay again or extend prepaid.

### Extend prepaid

```sql
UPDATE subscriptions
SET prepaid_until = '2028-06-01', next_due = '2028-06-01'
WHERE person_id = PERSON_ID AND service_id = (SELECT id FROM services WHERE code = 'yt');
```

### Cancel prepaid (refund)

```sql
UPDATE subscriptions
SET prepaid_until = NULL, next_due = CURRENT_DATE
WHERE person_id = PERSON_ID AND service_id = (SELECT id FROM services WHERE code = 'yt');
```

## Current Services

| Code | Name | Per slot | Total (6 slots) |
|------|------|----------|-----------------|
| yt | Youtube | 175,456 | 1,052,736 |
| ic | iCloud | 258,900 | 1,553,400 |

## Current Slots (2026-06)

| Service | Slots | People |
|---------|-------|--------|
| Youtube | 6 | Lâm(2), Tuấn(1), Me(1), Nam(1), Hương(1) |
| iCloud | 6 | Lâm(2), Me(1), Ngọc(1), Thảo(1), My(1) |

## API Endpoints

- `POST /api/transactions/lump-sum` - Create lump sum from manual Sheet rows
- `POST /api/transactions/quick-add` - AI parse + create transaction
- Edge Function `sync-subscriptions` - Cron-triggered subscription sync
- Edge Function `sync-to-sheets` - Transaction → Sheet sync

## RPC Functions

- `reset_test_subscriptions()` - Reset all subscriptions for testing (uses service_id)
