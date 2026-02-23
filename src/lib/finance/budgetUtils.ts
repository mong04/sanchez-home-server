// src/lib/finance/budgetUtils.ts — Budget calculation utilities

import { pb } from "../pocketbase";
import { Collections, type BudgetMonthRecord } from "../../types/pocketbase";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";

/**
 * Gets an existing budget month record or creates a new one.
 * New months auto-calculate positive rollover from the previous month.
 */
export async function getOrCreateBudgetMonth(month: string): Promise<BudgetMonthRecord> {
    const userId = pb.authStore.model?.id;
    try {
        // Shared Budget: Look for ANY record for this month, regardless of owner.
        // This assumes the app is used by a single family/household.
        return await pb.collection(Collections.BudgetMonths).getFirstListItem<BudgetMonthRecord>(
            `month="${month}"`
        );
    } catch {
        // Month doesn't exist yet — create it
        const prevMonth = format(subMonths(new Date(`${month}-01`), 1), "yyyy-MM");

        let rollover = 0;
        try {
            // Look for ANY previous month record to calculate rollover
            const prev = await pb.collection(Collections.BudgetMonths).getFirstListItem<BudgetMonthRecord>(
                `month="${prevMonth}"`
            );
            rollover = await calculatePositiveRollover(prev);
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
            return await pb.collection(Collections.BudgetMonths).getFirstListItem<BudgetMonthRecord>(
                `month="${month}"`
            );
        } catch {
            return pb.collection(Collections.BudgetMonths).create<BudgetMonthRecord>(newBudget);
        }
    }
}

/**
 * Calculates the total positive underspend from a previous month.
 * Only categories where (budgeted - spent) > 0 contribute to rollover.
 */
async function calculatePositiveRollover(prev: BudgetMonthRecord): Promise<number> {
    let total = 0;
    for (const [catId, budgeted] of Object.entries(prev.allocations)) {
        const spent = await calculateSpentForCategory(catId, prev.month);
        const available = budgeted - spent;
        if (available > 0) total += available;
    }
    return total;
}

/**
 * Calculates total spent for a category in a given month.
 * Uses absolute values of transaction amounts (expenses are negative).
 */
export async function calculateSpentForCategory(categoryId: string, month: string): Promise<number> {
    const start = startOfMonth(new Date(`${month}-01`));
    const end = endOfMonth(start);

    const txs = await pb.collection(Collections.Transactions).getFullList({
        filter: `category="${categoryId}" && date >= "${format(start, 'yyyy-MM-dd')}" && date <= "${format(end, 'yyyy-MM-dd')}"`,
    });

    return txs.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
}

/**
 * Calculates "To Be Budgeted" = income + rollover - sum(all allocated amounts).
 * This is the core zero-based budgeting equation.
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
export async function copyPreviousMonthAllocations(currentMonth: string): Promise<Record<string, number>> {
    const prevMonth = format(subMonths(new Date(`${currentMonth}-01`), 1), "yyyy-MM");
    try {
        const prev = await pb.collection(Collections.BudgetMonths).getFirstListItem<BudgetMonthRecord>(
            `month="${prevMonth}"`
        );
        return { ...prev.allocations };
    } catch {
        return {};
    }
}

/**
 * Calculate 3-month average allocations.
 */
export async function calculateThreeMonthAverage(currentMonth: string): Promise<Record<string, number>> {
    const averages: Record<string, number[]> = {};

    for (let i = 1; i <= 3; i++) {
        const m = format(subMonths(new Date(`${currentMonth}-01`), i), "yyyy-MM");
        try {
            const budget = await pb.collection(Collections.BudgetMonths).getFirstListItem<BudgetMonthRecord>(
                `month="${m}"`
            );
            for (const [catId, amount] of Object.entries(budget.allocations)) {
                if (!averages[catId]) averages[catId] = [];
                averages[catId].push(amount);
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
