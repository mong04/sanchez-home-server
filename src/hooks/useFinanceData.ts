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
            const raw = await adapter.getFullList<AccountRecord>(Collections.Accounts, { sort: 'name' });
            return raw.map((acc) => {
                const currentBalance = acc.balance ?? 0;
                return { ...acc, currentBalance, transactionCount: 0 };
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
            const createdAccount = await adapter.create<AccountRecord>(Collections.Accounts, {
                ...newAccount,
                balance: newAccount.initialBalance ?? 0,
                owner: user?.id,
            });

            // Priority #1: Auto-generate Starting Balance transaction if initialBalance !== 0
            if (newAccount.initialBalance && newAccount.initialBalance !== 0) {
                try {
                    const isPositive = newAccount.initialBalance > 0;

                    // Starting balance is an inflow — no category needed (YNAB: goes straight to Ready to Assign)
                    await adapter.create<TransactionRecord>(Collections.Transactions, {
                        amount: newAccount.initialBalance,
                        date: new Date().toISOString(),
                        payee: 'Starting Balance',
                        category: '', // No category — income flows to Ready to Assign, not an envelope
                        account: createdAccount.id,
                        isIncome: isPositive,
                        cleared: true,
                        type: 'starting_balance',
                        createdBy: user?.id,
                    } as Partial<TransactionRecord>);
                } catch (e) {
                    console.error('[useCreateAccount] Failed to create Starting Balance transaction:', e);
                }
            }

            return createdAccount;
        },
        onSuccess: async () => {
            await queryClient.refetchQueries({ queryKey: [Collections.Accounts] });
            // Invalidate to update BudgetGrid / TBB Ledger and Transaction list
            await queryClient.invalidateQueries({ queryKey: [Collections.Transactions] });
            await queryClient.invalidateQueries({ queryKey: [Collections.BudgetMonths] });
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
            // 1. Fetch all transactions tied to this account
            const txs = await adapter.getFullList<TransactionRecord>(Collections.Transactions, {
                filter: `account = "${id}"`,
            });

            // 2. Revert Category.spent for each transaction before deleting
            // YNAB Rule: Income txs never wrote to Category.spent, so skip them
            for (const tx of txs) {
                try {
                    if (tx.category && !tx.isIncome) {
                        const cat = await adapter.getOne<CategoryRecord>(Collections.Categories, tx.category);
                        await adapter.update<CategoryRecord>(Collections.Categories, cat.id, {
                            spent: (cat.spent || 0) - (tx.amount || 0),
                        });
                    }
                } catch (e) {
                    console.warn('[useDeleteAccount] Could not revert category spent for tx', tx.id, e);
                }
            }

            // 3. Delete all child transactions (avoids FK constraint blocking the account delete)
            for (const tx of txs) {
                try {
                    await adapter.delete(Collections.Transactions, tx.id);
                } catch (e) {
                    console.warn('[useDeleteAccount] Could not delete transaction', tx.id, e);
                }
            }

            // 4. Now safely delete the account
            return await adapter.delete(Collections.Accounts, id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [Collections.Accounts] });
            queryClient.invalidateQueries({ queryKey: [Collections.Transactions] });
            queryClient.invalidateQueries({ queryKey: [Collections.Categories] });
            queryClient.invalidateQueries({ queryKey: [Collections.BudgetMonths] });
        },
        onError: (err) => {
            console.error('[useDeleteAccount] Failed to delete account:', err);
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
            const tx = await adapter.create<TransactionRecord>(Collections.Transactions, {
                ...newTransaction,
                createdBy: user?.id,
            });

            // 1. Dual write for Account Balance
            if (newTransaction.account && newTransaction.amount) {
                try {
                    const account = await adapter.getOne<AccountRecord>(Collections.Accounts, newTransaction.account);
                    const currentBalance = account.balance || 0;
                    await adapter.update<AccountRecord>(Collections.Accounts, account.id, {
                        balance: currentBalance + newTransaction.amount
                    });
                } catch (e) {
                    console.error('[useAddTransaction] Failed to update account balance', e);
                }
            }

            // 2. Dual write for Category Spent mapping
            // YNAB Rule: Income flows ONLY to Ready to Assign (account balance), never to category envelopes
            if (newTransaction.category && newTransaction.amount && !newTransaction.isIncome) {
                try {
                    const category = await adapter.getOne<CategoryRecord>(Collections.Categories, newTransaction.category);
                    const currentSpent = category.spent || 0;
                    await adapter.update<CategoryRecord>(Collections.Categories, category.id, {
                        spent: currentSpent + newTransaction.amount
                    });
                } catch (e) {
                    console.error('[useAddTransaction] Failed to update category spent', e);
                }
            }

            return tx;
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
            queryClient.invalidateQueries({ queryKey: [Collections.Categories] }); // Keep cat.spent fresh
            queryClient.invalidateQueries({ queryKey: [Collections.BudgetMonths] });
        },
    });
}

export function useUpdateTransaction() {
    const queryClient = useQueryClient();
    const { adapter } = useBackend();

    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<TransactionRecord> }) => {
            const oldTx = await adapter.getOne<TransactionRecord>(Collections.Transactions, id);
            const updatedTx = await adapter.update<TransactionRecord>(Collections.Transactions, id, data);

            // Handle Account Dual Write
            if (data.amount !== undefined || data.account !== undefined) {
                const oldAmount = oldTx.amount || 0;
                const newAmount = updatedTx.amount || 0;

                try {
                    if (oldTx.account === updatedTx.account) {
                        const diff = newAmount - oldAmount;
                        if (diff !== 0) {
                            const acc = await adapter.getOne<AccountRecord>(Collections.Accounts, oldTx.account);
                            await adapter.update<AccountRecord>(Collections.Accounts, acc.id, { balance: (acc.balance || 0) + diff });
                        }
                    } else {
                        // Revert old, add new
                        const oldAcc = await adapter.getOne<AccountRecord>(Collections.Accounts, oldTx.account);
                        await adapter.update<AccountRecord>(Collections.Accounts, oldAcc.id, { balance: (oldAcc.balance || 0) - oldAmount });
                        const newAcc = await adapter.getOne<AccountRecord>(Collections.Accounts, updatedTx.account);
                        await adapter.update<AccountRecord>(Collections.Accounts, newAcc.id, { balance: (newAcc.balance || 0) + newAmount });
                    }
                } catch (e) {
                    console.error('[useUpdateTransaction] Failed to update account balances', e);
                }
            }

            // Handle Category Dual Write
            // YNAB Rule: Income never touches category envelopes
            if ((data.amount !== undefined || data.category !== undefined) && !updatedTx.isIncome) {
                const oldAmount = oldTx.isIncome ? 0 : (oldTx.amount || 0); // If it WAS income, old category impact was 0
                const newAmount = updatedTx.amount || 0;

                try {
                    if (oldTx.category === updatedTx.category) {
                        const diff = newAmount - oldAmount;
                        if (diff !== 0) {
                            const cat = await adapter.getOne<CategoryRecord>(Collections.Categories, oldTx.category);
                            await adapter.update<CategoryRecord>(Collections.Categories, cat.id, { spent: (cat.spent || 0) + diff });
                        }
                    } else {
                        if (!oldTx.isIncome) {
                            const oldCat = await adapter.getOne<CategoryRecord>(Collections.Categories, oldTx.category);
                            await adapter.update<CategoryRecord>(Collections.Categories, oldCat.id, { spent: (oldCat.spent || 0) - oldAmount });
                        }
                        const newCat = await adapter.getOne<CategoryRecord>(Collections.Categories, updatedTx.category);
                        await adapter.update<CategoryRecord>(Collections.Categories, newCat.id, { spent: (newCat.spent || 0) + newAmount });
                    }
                } catch (e) {
                    console.error('[useUpdateTransaction] Failed to update category spent', e);
                }
            }

            return updatedTx;
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: [Collections.Transactions] });
            queryClient.invalidateQueries({ queryKey: [Collections.Accounts] });
            queryClient.invalidateQueries({ queryKey: [Collections.Categories] }); // Keep cat.spent fresh
            queryClient.invalidateQueries({ queryKey: [Collections.BudgetMonths] });
        },
    });
}

export function useDeleteTransaction() {
    const queryClient = useQueryClient();
    const { adapter } = useBackend();

    return useMutation({
        mutationFn: async (id: string) => {
            const oldTx = await adapter.getOne<TransactionRecord>(Collections.Transactions, id);
            await adapter.delete(Collections.Transactions, id);

            try {
                if (oldTx.account) {
                    const acc = await adapter.getOne<AccountRecord>(Collections.Accounts, oldTx.account);
                    await adapter.update<AccountRecord>(Collections.Accounts, acc.id, { balance: (acc.balance || 0) - (oldTx.amount || 0) });
                }
                // YNAB Rule: Income never touched category envelopes, so nothing to revert
                if (oldTx.category && !oldTx.isIncome) {
                    const cat = await adapter.getOne<CategoryRecord>(Collections.Categories, oldTx.category);
                    await adapter.update<CategoryRecord>(Collections.Categories, cat.id, { spent: (cat.spent || 0) - (oldTx.amount || 0) });
                }
            } catch (e) {
                console.error('[useDeleteTransaction] Failed to revert balances', e);
            }

            return true;
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: [Collections.Transactions] });
            queryClient.invalidateQueries({ queryKey: [Collections.Accounts] });
            queryClient.invalidateQueries({ queryKey: [Collections.Categories] }); // Keep cat.spent fresh
            queryClient.invalidateQueries({ queryKey: [Collections.BudgetMonths] });
        },
    });
}

export function useNeedsReviewCount() {
    const { adapter } = useBackend();
    return useQuery({
        queryKey: [Collections.Transactions, 'needsReviewCount'],
        queryFn: async () => {
            // Lightweight count using the existing adapter capabilities
            const result = await adapter.getFullList<TransactionRecord>(Collections.Transactions, {});
            return result.filter(tx => tx.needsReview).length;
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
            queryClient.invalidateQueries({ queryKey: [Collections.BudgetMonths] });
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
