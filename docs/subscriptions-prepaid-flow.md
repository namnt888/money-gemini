# Subscriptions & Prepaid Flow

## Overview

Hệ thống quản lý subscriptions (Youtube, iCloud) cho nhiều người share slots.

## Data Model

### People
- `name`: không dấu (query key)
- `label`: có dấu (display)

### Subscriptions
- `amount`: giá per-slot
- `price_per_cycle`: giá tổng service
- `slot_number`: slot thứ mấy
- `total_slots`: tổng số người share
- `next_due`: ngày tạo txn tiếp theo
- `prepaid_until`: ngày hết hạn prepaid (NULL = không prepaid)

## Monthly Flow

```
pg_cron (every 6h)
  → Edge Function sync-subscriptions
    → Query: is_active=true, next_due<=today, prepaid_until IS NULL OR prepaid_until < today
    → For each: INSERT transaction, UPDATE next_due += 1 month
    → Trigger sync-to-sheets → Apps Script → Google Sheets
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
WHERE person_id = PERSON_ID AND name = 'Youtube';
```

### When prepaid expires

Cron automatically resumes creating expense txns. User needs to pay again or extend prepaid.

### Extend prepaid

```sql
UPDATE subscriptions
SET prepaid_until = '2028-06-01', next_due = '2028-06-01'
WHERE person_id = PERSON_ID AND name = 'Youtube';
```

### Cancel prepaid (refund)

```sql
UPDATE subscriptions
SET prepaid_until = NULL, next_due = CURRENT_DATE
WHERE person_id = PERSON_ID AND name = 'Youtube';
```

## Current Slots (2026-06)

| Service | Slots | People |
|---------|-------|--------|
| Youtube | 6 | Lâm(2), Tuấn(1), Me(1), Nam(1), Hương(1) |
| iCloud | 6 | Lâm(2), Me(1), Ngọc(1), Thảo(1), My(1) |

## Pricing

| Service | Per slot | Total (6 slots) |
|---------|----------|-----------------|
| Youtube | 175,456 | 1,052,736 |
| iCloud | 258,900 | 1,553,400 |

## API Endpoints

- `POST /api/transactions/lump-sum` - Create lump sum from manual Sheet rows
- `POST /api/transactions/quick-add` - AI parse + create transaction
- Edge Function `sync-subscriptions` - Cron-triggered subscription sync
- Edge Function `sync-to-sheets` - Transaction → Sheet sync

## RPC Functions

- `reset_test_subscriptions()` - Reset all subscriptions for testing
