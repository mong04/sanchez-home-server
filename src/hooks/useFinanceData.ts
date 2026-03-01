// src/hooks/useFinanceData.ts — Finance module data hooks (accounts, transactions, categories)

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useBackend } from '../providers/BackendProvider';
import {
    Collections,
    type AccountRecord,
    type TransactionRecord,
    type CategoryRecord,
    type BudgetMonthRecord,
    type RecurringTransactionRecord,
} from '../types/pocketbase';
import { getOrCreateBudgetMonth } from '../lib/finance/budgetUtils';

// ─── Account Queries ─────────────────────────────────────────────

export interface AccountWithBalance extends AccountRecord {
    currentBalance: number;
    transactionCount: number;
}

export function useAccounts() {
    const { adapter } = useBackend();
    return useQuery({
        queryKey: [Collections.Accounts],
        queryFn: async (): Promise<AccountWithBalance[]> => {
            const [raw, allTxs] = await Promise.all([
                adapter.getFullList<AccountRecord>(Collections.Accounts, { sort: 'name' }),
                adapter.getFullList<{ account: string; amount?: number }>(Collections.Transactions, {}),
            ]);
            const txsByAccount = new Map<string, { amount: number }[]>();
            for (const tx of allTxs) {
                const accId = tx.account;
                if (!txsByAccount.has(accId)) txsByAccount.set(accId, []);
                txsByAccount.get(accId)!.push({ amount: tx.amount ?? 0 });
            }
            return raw.map((acc) => {
                const txs = txsByAccount.get(acc.id) ?? [];
                const initialBal = acc.initialBalance ?? 0;
                const currentBalance = initialBal + txs.reduce((sum, tx) => sum + tx.amount, 0);
                return { ...acc, currentBalance, transactionCount: txs.length };
            });
        },
    });
}

export function useCreateAccount() {
    const queryClient = useQueryClient();
    const { adapter } = useBackend();

    return useMutation({
        mutationFn: async (newAccount: Partial<AccountRecord>) => {
            const user = adapter.getCurrentUser();
            return await adapter.create<AccountRecord>(Collections.Accounts, {
                ...newAccount,
                owner: user?.id,
            });
        },
        onSuccess: async () => {
            await queryClient.refetchQueries({ queryKey: [Collections.Accounts] });
        },
    });
}

export function useUpdateAccount() {
    const queryClient = useQueryClient();
    const { adapter } = useBackend();

    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<AccountRecord> }) => {
            return await adapter.update<AccountRecord>(Collections.Accounts, id, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [Collections.Accounts] });
        },
    });
}

export function useDeleteAccount() {
    const queryClient = useQueryClient();
    const { adapter } = useBackend();

    return useMutation({
        mutationFn: async (id: string) => {
            return await adapter.delete(Collections.Accounts, id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [Collections.Accounts] });
            queryClient.invalidateQueries({ queryKey: [Collections.Transactions] });
        },
    });
}

// ─── Transaction Queries ─────────────────────────────────────────

export function useTransactions(filters?: { accountId?: string; cleared?: boolean }) {
    const { adapter } = useBackend();

    // Normalize filters: if an object is passed but all keys are undefined, treat as undefined
    const normalizedFilters = filters && Object.values(filters).some(v => v !== undefined) ? filters : undefined;

    return useQuery({
        queryKey: [Collections.Transactions, normalizedFilters],
        queryFn: async () => {
            console.log('[useTransactions] DIAG: queryFn running, filters=', JSON.stringify(filters));
            const filterParts: string[] = [];
            if (filters?.accountId) filterParts.push(`account = "${filters.accountId}"`);
            if (filters?.cleared !== undefined) filterParts.push(`cleared = ${filters.cleared}`);

            const result = await adapter.getList<TransactionRecord>(Collections.Transactions, {
                page: 1,
                perPage: 500,
                filter: filterParts.length ? filterParts.join(' && ') : undefined,
                sort: '-date',
                expand: 'account,category',
            });
            console.log('[useTransactions] DIAG: queryFn done, items=', result.items.length);
            return result.items;
        },
    });
}

export function useAddTransaction() {
    const queryClient = useQueryClient();
    const { adapter } = useBackend();

    return useMutation({
        mutationFn: async (newTransaction: Partial<TransactionRecord>) => {
            const user = adapter.getCurrentUser();
            return await adapter.create<TransactionRecord>(Collections.Transactions, {
                ...newTransaction,
                createdBy: user?.id,
            });
        },
        onMutate: async (newTransaction) => {
            await queryClient.cancelQueries({ queryKey: [Collections.Transactions] });
            const previousTransactions = queryClient.getQueryData([Collections.Transactions, undefined]);

            queryClient.setQueryData(
                [Collections.Transactions, undefined],
                (old: TransactionRecord[] | undefined) => {
                    const optimisticTx = {
                        ...newTransaction,
                        id: 'optimistic-' + Math.random(),
                        created: new Date().toISOString(),
                        updated: new Date().toISOString(),
                    } as TransactionRecord;

                    return old ? [optimisticTx, ...old] : [optimisticTx];
                }
            );

            return { previousTransactions };
        },
        onError: (_err, _newTransaction, context) => {
            if (context?.previousTransactions) {
                queryClient.setQueryData([Collections.Transactions, undefined], context.previousTransactions);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: [Collections.Transactions] });
            queryClient.invalidateQueries({ queryKey: [Collections.Accounts] });
        },
    });
}

export function useUpdateTransaction() {
    const queryClient = useQueryClient();
    const { adapter } = useBackend();

    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<TransactionRecord> }) => {
            return adapter.update<TransactionRecord>(Collections.Transactions, id, data);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: [Collections.Transactions] });
            queryClient.invalidateQueries({ queryKey: [Collections.Accounts] });
        },
    });
}

export function useDeleteTransaction() {
    const queryClient = useQueryClient();
    const { adapter } = useBackend();

    return useMutation({
        mutationFn: async (id: string) => {
            return await adapter.delete(Collections.Transactions, id);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: [Collections.Transactions] });
            queryClient.invalidateQueries({ queryKey: [Collections.Accounts] });
        },
    });
}

export function useToggleCleared() {
    const queryClient = useQueryClient();
    const { adapter } = useBackend();

    return useMutation({
        mutationFn: async ({ id, cleared }: { id: string; cleared: boolean }) => {
            return adapter.update(Collections.Transactions, id, { cleared });
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: [Collections.Transactions] });
            queryClient.invalidateQueries({ queryKey: [Collections.Accounts] });
        },
    });
}

// ─── Category Queries ────────────────────────────────────────────

export function useCategories(type?: 'income' | 'expense') {
    const { adapter } = useBackend();
    return useQuery({
        queryKey: [Collections.Categories, type],
        queryFn: async () => {
            const filter = type ? `type = "${type}"` : undefined;
            return await adapter.getFullList<CategoryRecord>(Collections.Categories, {
                filter,
                sort: 'name',
            });
        },
    });
}

export function useCreateCategory() {
    const queryClient = useQueryClient();
    const { adapter } = useBackend();

    return useMutation({
        mutationFn: async (newCategory: Partial<CategoryRecord>) => {
            const user = adapter.getCurrentUser();
            return await adapter.create<CategoryRecord>(Collections.Categories, {
                ...newCategory,
                owner: user?.id,
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [Collections.Categories] });
        },
    });
}

export function useUpdateCategory() {
    const queryClient = useQueryClient();
    const { adapter } = useBackend();

    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<CategoryRecord> }) => {
            return await adapter.update<CategoryRecord>(Collections.Categories, id, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [Collections.Categories] });
            queryClient.invalidateQueries({ queryKey: [Collections.BudgetMonths] });
            queryClient.invalidateQueries({ queryKey: [Collections.Transactions] });
        },
    });
}

export function useDeleteCategory() {
    const queryClient = useQueryClient();
    const { adapter } = useBackend();

    return useMutation({
        mutationFn: async (id: string) => {
            return await adapter.delete(Collections.Categories, id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [Collections.Categories] });
            queryClient.invalidateQueries({ queryKey: [Collections.BudgetMonths] });
        },
    });
}

// ─── Budget Month Queries ───────────────────────────────────────

export function useBudgetMonth(month: string) {
    const { adapter } = useBackend();
    return useQuery({
        queryKey: [Collections.BudgetMonths, month],
        queryFn: () => getOrCreateBudgetMonth(month, adapter),
    });
}

// ─── Budget Month Mutations ──────────────────────────────────────

export function useUpdateBudgetMonth() {
    const queryClient = useQueryClient();
    const { adapter } = useBackend();

    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<BudgetMonthRecord> }) => {
            return await adapter.update<BudgetMonthRecord>(Collections.BudgetMonths, id, data);
        },
        onSuccess: (_, _variables) => {
            // Invalidate the specific month being edited
            // Note: queryKey depends on 'month' which isn't in variables. 
            // Invalidation of all BudgetMonths is safer if we don't have the month string here.
            queryClient.invalidateQueries({ queryKey: [Collections.BudgetMonths] });
        },
    });
}

// ─── Recurring Transactions Queries ──────────────────────────────

export function useRecurringTransactions() {
    const { adapter } = useBackend();
    return useQuery({
        queryKey: [Collections.RecurringTransactions],
        queryFn: async () => {
            return await adapter.getFullList<RecurringTransactionRecord>(Collections.RecurringTransactions, {
                sort: 'nextDate',
                expand: 'templateTransactionId,templateTransactionId.account,templateTransactionId.category',
            });
        },
    });
}

export function useCreateRecurringTransaction() {
    const queryClient = useQueryClient();
    const { adapter } = useBackend();

    return useMutation({
        mutationFn: async (newRecurring: Partial<RecurringTransactionRecord>) => {
            const user = adapter.getCurrentUser();
            return await adapter.create<RecurringTransactionRecord>(Collections.RecurringTransactions, {
                ...newRecurring,
                owner: user?.id,
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [Collections.RecurringTransactions] });
        },
    });
}

export function useUpdateRecurringTransaction() {
    const queryClient = useQueryClient();
    const { adapter } = useBackend();

    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<RecurringTransactionRecord> }) => {
            return await adapter.update<RecurringTransactionRecord>(Collections.RecurringTransactions, id, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [Collections.RecurringTransactions] });
        },
    });
}

export function useDeleteRecurringTransaction() {
    const queryClient = useQueryClient();
    const { adapter } = useBackend();

    return useMutation({
        mutationFn: async (id: string) => {
            return await adapter.delete(Collections.RecurringTransactions, id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [Collections.RecurringTransactions] });
        },
    });
}
