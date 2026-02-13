/**
* This file was @generated using pocketbase-typegen
*/

export const Collections = {
    Users: "users",
    Accounts: "accounts",
    Envelopes: "envelopes",
    Transactions: "transactions",
} as const;
export type Collections = typeof Collections[keyof typeof Collections];

// Universal records
export interface BaseRecord {
    id: string;
    created: string;
    updated: string;
    collectionId: string;
    collectionName: string;
}

// User Record
export const UserRoleOptions = {
    admin: "admin",
    partner: "partner",
    child: "child",
} as const;
export type UserRoleOptions = typeof UserRoleOptions[keyof typeof UserRoleOptions];

export interface UserRecord extends BaseRecord {
    name?: string;
    avatar?: string;
    role: UserRoleOptions;
}

// Account Record
export const AccountTypeOptions = {
    checking: "checking",
    savings: "savings",
    credit: "credit",
    cash: "cash",
} as const;
export type AccountTypeOptions = typeof AccountTypeOptions[keyof typeof AccountTypeOptions];

export interface AccountRecord extends BaseRecord {
    name: string;
    type: AccountTypeOptions;
    balance?: number;
    owner: string; // Relation to users
    is_joint?: boolean;
}

// Envelope Record
export const EnvelopeVisibilityOptions = {
    public: "public",
    private: "private",
    hidden: "hidden",
} as const;
export type EnvelopeVisibilityOptions = typeof EnvelopeVisibilityOptions[keyof typeof EnvelopeVisibilityOptions];

export interface EnvelopeRecord extends BaseRecord {
    name: string;
    budget_limit?: number;
    current_balance?: number;
    owner: string; // Relation to users
    visibility: EnvelopeVisibilityOptions;
    icon?: string;
}

// Transaction Record
export const TransactionStatusOptions = {
    cleared: "cleared",
    pending: "pending",
} as const;
export type TransactionStatusOptions = typeof TransactionStatusOptions[keyof typeof TransactionStatusOptions];

export interface TransactionRecord extends BaseRecord {
    payee: string;
    amount: number;
    date: string;
    envelope: string; // Relation to envelopes
    account: string; // Relation to accounts
    notes?: string;
    status: TransactionStatusOptions;
}

// Response Types (for use in API calls)
export type UsersResponse = UserRecord
export type AccountsResponse = AccountRecord
export type EnvelopesResponse = EnvelopeRecord
export type TransactionsResponse = TransactionRecord
