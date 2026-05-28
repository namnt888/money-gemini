-- Dùng hàm native gen_random_uuid() của Postgres thay vì extension cũ
-- 1. BẢNG DANH MỤC (CATEGORIES)
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) CHECK (type IN ('income', 'expense', 'transfer', 'system')),
    parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. BẢNG NGƯỜI/DANH BẠ (PEOPLE)
CREATE TABLE people (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. BẢNG TÀI KHOẢN (ACCOUNTS)
CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) CHECK (type IN ('bank', 'wallet', 'credit_card', 'cash')),
    initial_balance BIGINT DEFAULT 0,
    cashback_policy JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. BẢNG GIAO DỊCH (TRANSACTIONS)
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    amount BIGINT NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense', 'transfer_in', 'transfer_out', 'debt', 'repayment', 'cashback')),
    account_id UUID NOT NULL REFERENCES accounts(id),
    category_id UUID REFERENCES categories(id),
    person_id UUID REFERENCES people(id),
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notes TEXT,
    raw_input TEXT,
    status VARCHAR(20) DEFAULT 'posted',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. BẢNG CÔNG NỢ (DEBTS)
CREATE TABLE debts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    person_id UUID NOT NULL REFERENCES people(id),
    original_txn_id UUID NOT NULL REFERENCES transactions(id),
    amount BIGINT NOT NULL,
    type VARCHAR(20) CHECK (type IN ('lent', 'borrowed')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'settled', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. BẢNG CHU KỲ HOÀN TIỀN (CASHBACK CYCLES)
CREATE TABLE cashback_cycles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES accounts(id),
    cycle_tag VARCHAR(10) NOT NULL,
    spent_amount BIGINT DEFAULT 0,
    virtual_profit BIGINT DEFAULT 0,
    real_awarded BIGINT DEFAULT 0,
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'closed', 'awarded')),
    UNIQUE(account_id, cycle_tag)
);