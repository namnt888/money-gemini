-- Simplify transaction types to only income/expense
-- First, update any existing records with old types
UPDATE transactions SET type = 'income' WHERE type IN ('transfer_in', 'cashback', 'repayment');
UPDATE transactions SET type = 'expense' WHERE type IN ('debt', 'transfer_out');

-- Then, update the CHECK constraint
ALTER TABLE transactions
  DROP CONSTRAINT IF EXISTS transactions_type_check;

ALTER TABLE transactions
  ADD CONSTRAINT transactions_type_check
  CHECK (type IN ('income', 'expense'));
