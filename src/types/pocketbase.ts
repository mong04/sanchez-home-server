// src/types/pocketbase.ts — Finance Module PocketBase Schema Types

export const Collections = {
    Users: "users",
    Accounts: "accounts",
    Transactions: "transactions",
    Categories: "categories",
    BudgetMonths: "budget_months",
    RecurringTransactions: "recurring_transactions",
} as const;

export interface BaseRecord {
    id: string;
    created: string;
    updated: string;
    collectionId: string;
    collectionName: string;
}

export interface AccountRecord extends BaseRecord {
    name: string;
    owner: string; // User ID
    type: "checking" | "savings" | "credit_card" | "loan" | "investment" | "other";
    initialBalance: number;
    initialBalanceDate: string;
    currency: string;
    icon?: string;
    notes?: string;
}

export interface TransactionRecord extends BaseRecord {
    date: string;
    amount: number; // + = money IN to account, - = money OUT
    payee: string;
    category: string; // relation ID to categories
    account: string; // relation ID to accounts
    notes?: string;
    tags?: string[];
    receipt?: string;
    cleared: boolean;
    type: "normal" | "transfer" | "adjustment" | "starting_balance";
    transferGroupId?: string;
    splitGroupId?: string;
    isIncome?: boolean;
    needsReview?: boolean;
    reviewNote?: string;
    createdBy: string;
    // Expanded relations (populated when using expand param)
    expand?: {
        account?: AccountRecord;
        category?: CategoryRecord;
    };
}

export interface CategoryRecord extends BaseRecord {
    name: string;
    owner: string; // User ID
    parent?: string;
    type: "income" | "expense";
    color: string;
    icon?: string;
    isSystem: boolean;
    // --- Recurring Fields (Phase 1) ---
    isRecurring?: boolean;
    amount?: number; // Target goal amount
    frequency?: "monthly" | "quarterly" | "yearly";
    dueDay?: number; // 1-31
    startDate?: string;
    notes?: string;
}

export interface BudgetMonthRecord extends BaseRecord {
    month: string; // "2026-03"
    owner: string; // User ID
    allocations: Record<string, number>; // categoryId -> budgeted amount
    income: number;
    rollover: number;
    notes?: string;
}

export interface RecurringTransactionRecord extends BaseRecord {
    owner: string; // User ID
    templateTransactionId: string; // Relation to transactions
    frequency: "weekly" | "biweekly" | "monthly" | "yearly";
    nextDate: string; // ISO date format expected
    autoApply: boolean;
    notes?: string;
    expand?: {
        templateTransactionId?: TransactionRecord;
    };
}
