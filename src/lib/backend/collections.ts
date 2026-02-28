// src/lib/backend/collections.ts
// Standardized list of all collections/tables for migration and auditing.

export const COLLECTIONS = {
    USERS: 'users',
    ACCOUNTS: 'accounts',
    TRANSACTIONS: 'transactions',
    CATEGORIES: 'categories',
    BUDGET_MONTHS: 'budget_months',
    BUDGET_ALLOCATIONS: 'budget_allocations',
    CHORES: 'chores',
    CHORE_ASSIGNMENTS: 'chore_assignments',
    CALENDAR_EVENTS: 'calendar_events',
    SHOPPING_ITEMS: 'shopping_items',
    WELLNESS_LOGS: 'wellness_logs',
    INFINITY_LOG: 'infinity_log',
    MESSAGES: 'messages',
    PUSH_SUBSCRIPTIONS: 'push_subscriptions'
} as const;

export type CollectionName = typeof COLLECTIONS[keyof typeof COLLECTIONS];
