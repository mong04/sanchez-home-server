import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useBackend } from '../providers/BackendProvider';
import { useAccounts } from './useFinanceData';
import { Collections, type BudgetMonthRecord, type CategoryRecord } from '../types/pocketbase';

interface UseGlobalTBBOptions {
    /** The currently viewed month (e.g. "2026-03") */
    currentMonth: string;
    /** Live Yjs allocations for the current month — the real-time source of truth */
    liveAllocations: Record<string, number>;
}

export function useGlobalTBB({ currentMonth, liveAllocations }: UseGlobalTBBOptions) {
    const { adapter } = useBackend();

    // 1. Fetch all accounts for Total Cash calculation
    const { data: accounts = [] } = useAccounts();

    // 2. Fetch all categories to access their 'spent' metric
    const { data: categories = [] } = useQuery({
        queryKey: [Collections.Categories],
        queryFn: async () => adapter.getFullList<CategoryRecord>(Collections.Categories, {}),
    });

    // 3. Fetch ALL budget months for historical allocations (non-current months)
    const { data: budgetMonths = [] } = useQuery({
        queryKey: [Collections.BudgetMonths, 'all'],
        queryFn: async () => adapter.getFullList<BudgetMonthRecord>(Collections.BudgetMonths, {}),
    });

    // Master YNAB Math Calculation
    const tbb = useMemo(() => {
        // ─── A. Total Cash ───
        let totalCash = 0;
        let totalCCDebt = 0;

        accounts.forEach(acc => {
            const bal = acc.currentBalance || 0;
            if (acc.type === 'checking' || acc.type === 'savings' || acc.type === 'investment' || acc.type === 'other') {
                totalCash += bal;
            } else if (acc.type === 'credit_card' || acc.type === 'loan') {
                if (bal < 0) totalCCDebt += Math.abs(bal);
            }
        });

        // ─── B. Total Assigned (Global) ───
        // For the CURRENT month: use live Yjs allocations (instant reactivity)
        // For ALL OTHER months: use the persisted BudgetMonths from the DB
        let totalAssigned = 0;

        // Current month — live from Yjs
        Object.values(liveAllocations).forEach(val => {
            totalAssigned += val || 0;
        });

        // Other months — from DB
        budgetMonths.forEach(bm => {
            if (bm.month === currentMonth) return; // Skip — we already used Yjs for this month
            if (bm.allocations) {
                Object.values(bm.allocations).forEach(val => {
                    totalAssigned += (val as number) || 0;
                });
            }
        });

        // ─── C. Total Category Spent (negative = expenses) ───
        // Since income no longer touches Category.spent (P0 fix), this is pure expense activity.
        // We need this to derive Total Inflows from Total Cash.
        let totalCategorySpent = 0;
        categories.forEach(cat => {
            if (cat.type === 'income') return; // Income categories don't hold spending
            totalCategorySpent += cat.spent || 0; // This is negative for expenses (e.g., -$25)
        });

        // ─── D. The Correct YNAB Equation ───
        //
        // YNAB's Ready to Assign = Total Inflows − Total Assigned
        //
        // Total Inflows = all money that has ever entered the system (starting balances + income)
        // We can derive it: Total Inflows = Total Cash − Total Category Spent
        //   because: Total Cash = Total Inflows + Total Expenses (expenses are negative)
        //   so:       Total Inflows = Total Cash − Total Expenses = Total Cash − totalCategorySpent
        //
        // This ensures SPENDING never changes TBB. Only income and assignments do.
        //
        const totalInflows = totalCash - totalCategorySpent; // e.g., $1675 - (-$25) = $1700
        const finalTBB = totalInflows - totalAssigned;

        return {
            toBeBudgeted: finalTBB,
            totalCash,
            totalInflows,
            totalAssigned,
            totalCCDebt,
        };

    }, [accounts, categories, budgetMonths, currentMonth, liveAllocations]);

    return tbb;
}
