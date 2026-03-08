-- Migration 01: Add server-side tracking columns for extreme performance scaling
-- This migration updates the schema to rely on O(1) lookups instead of summing thousands of transactions on the client.

-- 1. Add balance column to accounts
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS balance NUMERIC DEFAULT 0;

-- 2. Add spent column to categories to track lifetime spending 
ALTER TABLE categories ADD COLUMN IF NOT EXISTS spent NUMERIC DEFAULT 0;

-- 3. Backfill Account Balances from all historical transactions
UPDATE accounts
SET balance = COALESCE((
    SELECT SUM(amount)
    FROM transactions
    WHERE transactions.account = accounts.id
), 0) + COALESCE(initialBalance, 0);

-- 4. Backfill Category Lifetime Spending from all historical transactions
-- We only sum negative transactions (expenses) and store as absolute positive "spent" value, or net negative.
-- Actually, YNAB logic: spent is the algebraic sum of all outflows and inflows.
UPDATE categories
SET spent = COALESCE((
    SELECT SUM(amount)
    FROM transactions
    WHERE transactions.category = categories.id
), 0);
