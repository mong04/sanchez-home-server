-- Sanchez Family OS - Supabase Schema Migration
-- Mirrors the PocketBase schema exactly (types, fields, and behavior)

-- ==========================================
-- 1. ENUMS
-- ==========================================
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'partner', 'child');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE account_type AS ENUM ('checking', 'savings', 'credit_card', 'loan', 'investment', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE category_type AS ENUM ('income', 'expense');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE frequency_type AS ENUM ('monthly', 'quarterly', 'yearly');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE transaction_type AS ENUM ('normal', 'transfer', 'adjustment', 'starting_balance');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ==========================================
-- 2. TABLES
-- ==========================================

-- users (maps to PocketBase _pb_users_auth_)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    emailVisibility BOOLEAN DEFAULT FALSE,
    verified BOOLEAN DEFAULT FALSE,
    name TEXT,
    avatar TEXT,
    role user_role NOT NULL DEFAULT 'partner',
    partykit_id TEXT,
    created TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- accounts
CREATE TABLE IF NOT EXISTS accounts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    owner TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type account_type NOT NULL,
    initialBalance NUMERIC,
    initialBalanceDate DATE,
    currency TEXT,
    icon TEXT,
    notes TEXT,
    created TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- budget_months
CREATE TABLE IF NOT EXISTS budget_months (
    id TEXT PRIMARY KEY,
    month TEXT NOT NULL, -- Format: YYYY-MM
    owner TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    allocations JSONB,
    income NUMERIC DEFAULT 0,
    rollover NUMERIC DEFAULT 0,
    notes TEXT,
    created TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- categories
CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    owner TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent TEXT REFERENCES categories(id) ON DELETE SET NULL,
    type category_type NOT NULL,
    color TEXT NOT NULL,
    icon TEXT,
    isSystem BOOLEAN DEFAULT FALSE,
    isRecurring BOOLEAN DEFAULT FALSE,
    frequency frequency_type,
    dueDay INTEGER,
    startDate DATE,
    notes TEXT,
    amount NUMERIC,
    created TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- push_subscriptions
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id TEXT PRIMARY KEY,
    endpoint TEXT NOT NULL,
    expirationTime NUMERIC,
    keys JSONB NOT NULL,
    userId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- transactions
CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    date DATE NOT NULL,
    amount NUMERIC NOT NULL,
    payee TEXT NOT NULL,
    category TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    account TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    notes TEXT,
    tags JSONB,
    receipt TEXT,
    cleared BOOLEAN DEFAULT FALSE,
    type transaction_type NOT NULL DEFAULT 'normal',
    transferGroupId TEXT,
    createdBy TEXT REFERENCES users(id) ON DELETE SET NULL,
    splitGroupId TEXT,
    isIncome BOOLEAN DEFAULT FALSE,
    created TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 3. RLS POLICIES (Privacy First)
-- ==========================================
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_months ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- users policies
DROP POLICY IF EXISTS "Users can view users" ON users;
CREATE POLICY "Users can view users" ON users FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can manage themselves" ON users;
CREATE POLICY "Users can manage themselves" ON users FOR ALL USING (auth.uid()::text = id);

-- accounts policies
DROP POLICY IF EXISTS "Users can view all accounts" ON accounts;
CREATE POLICY "Users can view all accounts" ON accounts FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can manage all accounts" ON accounts;
CREATE POLICY "Users can manage all accounts" ON accounts FOR ALL USING (true);

-- budget_months policies
DROP POLICY IF EXISTS "Users can view all budget_months" ON budget_months;
CREATE POLICY "Users can view all budget_months" ON budget_months FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can manage all budget_months" ON budget_months;
CREATE POLICY "Users can manage all budget_months" ON budget_months FOR ALL USING (true);

-- categories policies
DROP POLICY IF EXISTS "Users can view all categories" ON categories;
CREATE POLICY "Users can view all categories" ON categories FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can manage all categories" ON categories;
CREATE POLICY "Users can manage all categories" ON categories FOR ALL USING (true);

-- push_subscriptions policies
DROP POLICY IF EXISTS "Users can view all push_subscriptions" ON push_subscriptions;
CREATE POLICY "Users can view all push_subscriptions" ON push_subscriptions FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can manage all push_subscriptions" ON push_subscriptions;
CREATE POLICY "Users can manage all push_subscriptions" ON push_subscriptions FOR ALL USING (true);

-- transactions policies
DROP POLICY IF EXISTS "Users can view all transactions" ON transactions;
CREATE POLICY "Users can view all transactions" ON transactions FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can manage all transactions" ON transactions;
CREATE POLICY "Users can manage all transactions" ON transactions FOR ALL USING (true);

-- Note: The policies above assume a shared family workspace where family members 
-- have access to viewing and managing shared resources, mirroring PocketBase auth rules `id != ""` 

-- recurring_transactions
CREATE TABLE IF NOT EXISTS recurring_transactions (
    id TEXT PRIMARY KEY,
    owner TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    templateTransactionId TEXT NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    frequency TEXT NOT NULL CHECK (frequency IN ('weekly', 'biweekly', 'monthly', 'yearly')),
    nextDate DATE NOT NULL,
    autoApply BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE recurring_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view all recurring_transactions" ON recurring_transactions;
CREATE POLICY "Users can view all recurring_transactions" ON recurring_transactions FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can manage all recurring_transactions" ON recurring_transactions;
CREATE POLICY "Users can manage all recurring_transactions" ON recurring_transactions FOR ALL USING (true);


-- ==========================================
-- 4. AUTH TRIGGER (Sync auth.users to public.users)
-- ==========================================
-- Create a function to handle new user signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role)
  VALUES (
    NEW.id::text,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'partner'::user_role)
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    role = EXCLUDED.role;
  RETURN NEW;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- ==========================================
-- 5. SEED DATA
-- ==========================================

-- Insert the admin test user (ID matching our test suite expectations if needed)
-- We use unique text IDs for compatibility. In a real environment, Supabase handles auth.uid().
INSERT INTO users (id, email, name, role) 
VALUES ('system_admin_01', 'system@sanchezfamily.os', 'System', 'admin')
ON CONFLICT (id) DO NOTHING;

-- Insert System Income Category
INSERT INTO categories (id, name, owner, type, color, icon, isSystem)
VALUES ('cat_system_income', 'Income', 'system_admin_01', 'income', '#10b981', 'money', true)
ON CONFLICT (id) DO NOTHING;

-- Also adding common expense category seed for immediate usability
INSERT INTO categories (id, name, owner, type, color, icon, isSystem)
VALUES ('cat_groceries', 'Groceries', 'system_admin_01', 'expense', '#f59e0b', 'shopping-cart', false)
ON CONFLICT (id) DO NOTHING;
