// src/hooks/useFinanceData.ts — Finance module data hooks (accounts, transactions, categories)

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pb } from '../lib/pocketbase';
import {
    Collections,
    type AccountRecord,
    type TransactionRecord,
    type CategoryRecord,
    type BudgetMonthRecord,
} from '../types/pocketbase';
import { getOrCreateBudgetMonth } from '../lib/finance/budgetUtils';

// ─── Account Queries ─────────────────────────────────────────────

export interface AccountWithBalance extends AccountRecord {
    currentBalance: number;
    transactionCount: number;
}

export function useAccounts() {
    return useQuery({
        queryKey: [Collections.Accounts],
        queryFn: async (): Promise<AccountWithBalance[]> => {
            const [raw, allTxs] = await Promise.all([
                pb.collection(Collections.Accounts).getFullList<AccountRecord>({ sort: 'name' }),
                pb.collection(Collections.Transactions).getFullList<{ account: string; amount?: number }>({}),
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

    return useMutation({
        mutationFn: async (newAccount: Partial<AccountRecord>) => {
            return await pb.collection(Collections.Accounts).create<AccountRecord>({
                ...newAccount,
                owner: pb.authStore.model?.id,
            });
        },
        onSuccess: async () => {
            await queryClient.refetchQueries({ queryKey: [Collections.Accounts] });
        },
    });
}

export function useUpdateAccount() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<AccountRecord> }) => {
            return await pb.collection(Collections.Accounts).update<AccountRecord>(id, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [Collections.Accounts] });
        },
    });
}

export function useDeleteAccount() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            return await pb.collection(Collections.Accounts).delete(id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [Collections.Accounts] });
            queryClient.invalidateQueries({ queryKey: [Collections.Transactions] });
        },
    });
}

// ─── Transaction Queries ─────────────────────────────────────────

export function useTransactions(filters?: { accountId?: string; cleared?: boolean }) {
    return useQuery({
        queryKey: [Collections.Transactions, filters],
        queryFn: async () => {
            console.log('[useTransactions] DIAG: queryFn running, filters=', JSON.stringify(filters));
            const filterParts: string[] = [];
            if (filters?.accountId) filterParts.push(`account = "${filters.accountId}"`);
            if (filters?.cleared !== undefined) filterParts.push(`cleared = ${filters.cleared}`);

            const result = await pb.collection(Collections.Transactions).getList<TransactionRecord>(1, 500, {
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

    return useMutation({
        mutationFn: async (newTransaction: Partial<TransactionRecord>) => {
            return await pb.collection(Collections.Transactions).create<TransactionRecord>({
                ...newTransaction,
                createdBy: pb.authStore.model?.id,
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
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [Collections.Transactions] });
            queryClient.invalidateQueries({ queryKey: [Collections.Accounts] });
        },
    });
}

export function useUpdateTransaction() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<TransactionRecord> }) => {
            return pb.collection(Collections.Transactions).update<TransactionRecord>(id, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [Collections.Transactions] });
            queryClient.invalidateQueries({ queryKey: [Collections.Accounts] });
        },
    });
}

export function useDeleteTransaction() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            return await pb.collection(Collections.Transactions).delete(id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [Collections.Transactions] });
            queryClient.invalidateQueries({ queryKey: [Collections.Accounts] });
        },
    });
}

export function useToggleCleared() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, cleared }: { id: string; cleared: boolean }) => {
            return pb.collection(Collections.Transactions).update(id, { cleared });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [Collections.Transactions] });
        },
    });
}

// ─── Category Queries ────────────────────────────────────────────

export function useCategories(type?: 'income' | 'expense') {
    return useQuery({
        queryKey: [Collections.Categories, type],
        queryFn: async () => {
            const filter = type ? `type = "${type}"` : undefined;
            return await pb.collection(Collections.Categories).getFullList<CategoryRecord>({
                filter,
                sort: 'name',
            });
        },
    });
}

export function useCreateCategory() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (newCategory: Partial<CategoryRecord>) => {
            return await pb.collection(Collections.Categories).create<CategoryRecord>({
                ...newCategory,
                owner: pb.authStore.model?.id,
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [Collections.Categories] });
        },
    });
}

export function useUpdateCategory() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<CategoryRecord> }) => {
            return await pb.collection(Collections.Categories).update<CategoryRecord>(id, data);
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

    return useMutation({
        mutationFn: async (id: string) => {
            return await pb.collection(Collections.Categories).delete(id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [Collections.Categories] });
            queryClient.invalidateQueries({ queryKey: [Collections.BudgetMonths] });
        },
    });
}

// ─── Budget Month Queries ───────────────────────────────────────

export function useBudgetMonth(month: string) {
    return useQuery({
        queryKey: [Collections.BudgetMonths, month],
        queryFn: () => getOrCreateBudgetMonth(month),
    });
}

// ─── Budget Month Mutations ──────────────────────────────────────

export function useUpdateBudgetMonth() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<BudgetMonthRecord> }) => {
            return await pb.collection(Collections.BudgetMonths).update<BudgetMonthRecord>(id, data);
        },
        onSuccess: (_, _variables) => {
            // Invalidate the specific month being edited
            // Note: queryKey depends on 'month' which isn't in variables. 
            // Invalidation of all BudgetMonths is safer if we don't have the month string here.
            queryClient.invalidateQueries({ queryKey: [Collections.BudgetMonths] });
        },
    });
}
