// src/lib/finance/budgetUtils.ts — Budget calculation utilities

import type { BackendAdapter } from "../backend/types";
import { Collections, type BudgetMonthRecord } from "../../types/pocketbase";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";

/**
 * Gets an existing budget month record or creates a new one.
 * New months auto-calculate positive rollover from the previous month.
 */
export async function getOrCreateBudgetMonth(month: string, adapter: BackendAdapter): Promise<BudgetMonthRecord> {
    const userId = adapter.getCurrentUser()?.id;
    try {
        // Shared Budget: Look for ANY record for this month, regardless of owner.
        // This assumes the app is used by a single family/household.
        const { items } = await adapter.getList<BudgetMonthRecord>(Collections.BudgetMonths, {
            filter: `month="${month}"`,
            page: 1,
            perPage: 1
        });
        if (items.length > 0) {
            const budget = items[0];
            budget.income = await calculateIncomeForMonth(month, adapter);
            return budget;
        }
        throw new Error("Not found");
    } catch {
        // Month doesn't exist yet — create it
        const prevMonth = format(subMonths(new Date(`${month}-01`), 1), "yyyy-MM");

        let rollover = 0;
        try {
            // Look for ANY previous month record to calculate rollover
            const { items: prevItems } = await adapter.getList<BudgetMonthRecord>(Collections.BudgetMonths, {
                filter: `month="${prevMonth}"`,
                page: 1,
                perPage: 1
            });
            if (prevItems.length > 0) {
                rollover = await calculatePositiveRollover(prevItems[0], adapter);
            }
        } catch {
            // No previous month — rollover stays 0
        }

        const newBudget: Partial<BudgetMonthRecord> = {
            month,
            owner: userId,
            allocations: {},
            income: 0,
            rollover,
        };

        // Double-check race condition: if another user created it while we were calculating
        try {
            const { items: checkItems } = await adapter.getList<BudgetMonthRecord>(Collections.BudgetMonths, {
                filter: `month="${month}"`,
                page: 1,
                perPage: 1
            });
            if (checkItems.length > 0) {
                const checkBudget = checkItems[0];
                checkBudget.income = await calculateIncomeForMonth(month, adapter);
                return checkBudget;
            }
            const created = await adapter.create<BudgetMonthRecord>(Collections.BudgetMonths, newBudget);
            created.income = await calculateIncomeForMonth(month, adapter);
            return created;
        } catch {
            const created = await adapter.create<BudgetMonthRecord>(Collections.BudgetMonths, newBudget);
            created.income = await calculateIncomeForMonth(month, adapter);
            return created;
        }
    }
}

/**
 * Calculates the total positive underspend from a previous month.
 * Only categories where (budgeted - spent) > 0 contribute to rollover.
 */
async function calculatePositiveRollover(prev: BudgetMonthRecord, adapter: BackendAdapter): Promise<number> {
    let total = 0;
    for (const [catId, budgeted] of Object.entries(prev.allocations)) {
        const spent = await calculateSpentForCategory(catId, prev.month, adapter);
        const available = budgeted - spent;
        if (available > 0) total += available;
    }
    return total;
}

/**
 * Calculates total spent for a category in a given month.
 * Uses absolute values of transaction amounts (expenses are negative).
 */
export async function calculateSpentForCategory(categoryId: string, month: string, adapter: BackendAdapter): Promise<number> {
    const start = startOfMonth(new Date(`${month}-01`));
    const end = endOfMonth(start);

    const txs = await adapter.getFullList<{ amount: number }>(Collections.Transactions, {
        filter: `category="${categoryId}" && date >= "${format(start, 'yyyy-MM-dd')} 00:00:00" && date <= "${format(end, 'yyyy-MM-dd')} 23:59:59"`,
    });

    return txs.reduce((sum, tx) => sum + Math.abs(tx.amount || 0), 0);
}

/**
 * Calculates total income natively from the ledger for a given month.
 */
export async function calculateIncomeForMonth(month: string, adapter: BackendAdapter): Promise<number> {
    const start = startOfMonth(new Date(`${month}-01`));
    const end = endOfMonth(start);

    // Sum all transaction where isIncome = true in this month
    const txs = await adapter.getFullList<{ amount: number }>(Collections.Transactions, {
        filter: `isIncome=true && date >= "${format(start, 'yyyy-MM-dd')} 00:00:00" && date <= "${format(end, 'yyyy-MM-dd')} 23:59:59"`,
    });

    return txs.reduce((sum, tx) => sum + Math.abs(tx.amount || 0), 0);
}

/**
 * @deprecated — DO NOT USE. This legacy per-month formula is no longer the source of truth.
 * TBB is now calculated globally via `useGlobalTBB` (Yjs-aware) and stored in `useFinanceStore`.
 * All UI components should read TBB from `useFinanceStore().toBeBudgeted`.
 */
export function calculateToBeBudgeted(
    budget: BudgetMonthRecord,
    liveAllocations: Record<string, number>
): number {
    const assigned = Object.values(liveAllocations).reduce((a, b) => a + b, 0);
    return budget.income + budget.rollover - assigned;
}

/**
 * Copy allocations from a previous month's budget.
 */
export async function copyPreviousMonthAllocations(currentMonth: string, adapter: BackendAdapter): Promise<Record<string, number>> {
    const prevMonth = format(subMonths(new Date(`${currentMonth}-01`), 1), "yyyy-MM");
    try {
        const { items } = await adapter.getList<BudgetMonthRecord>(Collections.BudgetMonths, {
            filter: `month="${prevMonth}"`,
            page: 1,
            perPage: 1
        });
        if (items.length > 0) return { ...items[0].allocations };
        return {};
    } catch {
        return {};
    }
}

/**
 * Calculate 3-month average allocations.
 */
export async function calculateThreeMonthAverage(currentMonth: string, adapter: BackendAdapter): Promise<Record<string, number>> {
    const averages: Record<string, number[]> = {};

    for (let i = 1; i <= 3; i++) {
        const m = format(subMonths(new Date(`${currentMonth}-01`), i), "yyyy-MM");
        try {
            const { items } = await adapter.getList<BudgetMonthRecord>(Collections.BudgetMonths, {
                filter: `month="${m}"`,
                page: 1,
                perPage: 1
            });
            if (items.length > 0) {
                const budget = items[0];
                for (const [catId, amount] of Object.entries(budget.allocations)) {
                    if (!averages[catId]) averages[catId] = [];
                    averages[catId].push(amount);
                }
            }
        } catch {
            // Month doesn't exist — skip
        }
    }

    const result: Record<string, number> = {};
    for (const [catId, amounts] of Object.entries(averages)) {
        result[catId] = Math.round((amounts.reduce((a, b) => a + b, 0) / amounts.length) * 100) / 100;
    }
    return result;
}

