// src/hooks/useBudgetGridData.ts
// Custom hook that extracts all data derivation, allocation management,
// grouping logic, and viewport detection from BudgetGrid.
//
// Follows react-specialist: "Colocate State" + "Custom Hooks"
// Follows vercel-react-best-practices: rerender-derived-state, rerender-memo

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useBudgetYjs } from './useBudgetYjs';
import {
    useCategories,
    useTransactions,
    useAccounts,
    useDeleteCategory,
    useUpdateCategory,
    useCreateCategory,
    useAddTransaction,
} from './useFinanceData';
import { useRecurringStore } from '../store/useRecurringStore';
import { useFinanceStore } from '../stores/useFinanceStore';
import { format, isToday, isTomorrow, differenceInDays, parseISO } from 'date-fns';
import { DEFAULT_GROUPS, getGroupIdForCategory } from '../components/modules/finance/budget/BudgetGroupHeader';
import type { CategoryRecord } from '../types/pocketbase';
import type { RecurringConfig } from '../store/useRecurringStore';

// ─── Return type for per-category derived data ───
export interface CategoryDerivedData {
    budgeted: number;
    absSpent: number;
    finalAvailable: number;
    isOverspent: boolean;
    isRecurring: boolean;
    isPaid: boolean;
    isUnderGoal: boolean;
    dueText: string;
    recurringConfig: RecurringConfig | null;
    isGoal: boolean;
    targetAmount: number;
    goalProgress: number;
}

export function useBudgetGridData(month: string) {
    const { allocations, setAllocation } = useBudgetYjs(month);
    const { data: categories, isLoading } = useCategories('expense');
    const { data: transactions } = useTransactions();
    const { data: accounts } = useAccounts();
    const deleteCategory = useDeleteCategory();
    const updateCategory = useUpdateCategory();
    const createCategory = useCreateCategory();
    const addTransaction = useAddTransaction();
    const {
        getRecurringForCategory,
        isDueThisMonth,
        getUpcomingDueDate,
        markAsPaidThisMonth,
        isPaidThisMonth,
    } = useRecurringStore();

    // ─── Viewport detection ───
    const [isMobile, setIsMobile] = useState(false);
    const [isTablet, setIsTablet] = useState(false);
    useEffect(() => {
        const update = () => {
            const w = window.innerWidth;
            setIsMobile(w < 768);
            setIsTablet(w >= 768 && w < 1024);
        };
        update();
        window.addEventListener('resize', update);
        return () => window.removeEventListener('resize', update);
    }, []);

    // ─── Local Yjs allocations state ───
    const [localAllocations, setLocalAllocations] = useState<Record<string, number>>({});
    useEffect(() => {
        const observer = () => {
            const current: Record<string, number> = {};
            allocations.forEach((val, key) => { current[key] = val; });
            setLocalAllocations(current);
        };
        observer();
        allocations.observe(observer);
        return () => allocations.unobserve(observer);
    }, [allocations]);

    // ─── Inline row input refs (for keyboard nav on desktop) ───
    const rowInputRefs = useRef<Map<number, React.RefObject<HTMLInputElement | null>>>(new Map());
    const getFocusRow = useCallback((index: number) => {
        const existingRef = rowInputRefs.current.get(index);
        if (existingRef) return existingRef;
        const newRef = { current: null } as React.RefObject<HTMLInputElement | null>;
        rowInputRefs.current.set(index, newRef);
        return newRef;
    }, []);
    const focusRow = useCallback((index: number) => {
        setTimeout(() => rowInputRefs.current.get(index)?.current?.focus(), 50);
    }, []);

    // ─── Category group collapse state ───
    const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
    const toggleGroup = useCallback((groupId: string) => {
        setCollapsedGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
    }, []);

    // ─── Category group overrides (persisted to localStorage) ───
    const [categoryGroupOverrides, setCategoryGroupOverrides] = useState<Record<string, string>>(() => {
        try { return JSON.parse(localStorage.getItem('sfos-budget-group-overrides') || '{}'); }
        catch { return {}; }
    });
    useEffect(() => {
        localStorage.setItem('sfos-budget-group-overrides', JSON.stringify(categoryGroupOverrides));
    }, [categoryGroupOverrides]);

    const getEffectiveGroupId = useCallback((cat: CategoryRecord) => {
        return categoryGroupOverrides[cat.id] || getGroupIdForCategory(cat.name);
    }, [categoryGroupOverrides]);

    // ─── Spend calculations ───
    const spentByCategory = useMemo(() => {
        const txs = transactions || [];
        const spent: Record<string, number> = {};
        for (const tx of txs) {
            if (tx.date.startsWith(month) && tx.category) {
                spent[tx.category] = (spent[tx.category] || 0) + (tx.amount || 0);
            }
        }
        return spent;
    }, [transactions, month]);

    const { toBeBudgeted } = useFinanceStore();
    const totalBudgeted = categories?.reduce((sum, cat) => sum + (localAllocations[cat.id] || 0), 0) || 0;
    const totalSpent = categories?.reduce((sum, cat) => sum + (spentByCategory[cat.id] || 0), 0) || 0;

    // ─── Group categories (respects user overrides) ───
    const groupedCategories = useMemo(() => {
        if (!categories) return new Map<string, CategoryRecord[]>();
        const map = new Map<string, CategoryRecord[]>();
        for (const cat of categories) {
            const gid = getEffectiveGroupId(cat);
            if (!map.has(gid)) map.set(gid, []);
            map.get(gid)!.push(cat);
        }
        return map;
    }, [categories, getEffectiveGroupId]);

    // Ordered groups (only include groups that have at least one category)
    const activeGroups = useMemo(() =>
        DEFAULT_GROUPS.filter((g) => groupedCategories.has(g.id)),
        [groupedCategories]
    );

    // ─── Helper: format due text ───
    const formatDueText = useCallback((dateStr: string | null) => {
        if (!dateStr) return '';
        try {
            const d = parseISO(dateStr);
            if (isToday(d)) return 'Due today';
            if (isTomorrow(d)) return 'Due tomorrow';
            const diff = Math.ceil(differenceInDays(d, new Date()));
            if (diff > 1 && diff <= 5) return `Due in ${diff} days`;
            if (diff < 0) return 'Past due';
            return `Due on the ${format(d, 'do')}`;
        } catch {
            return `Due ${dateStr}`;
        }
    }, []);

    // ─── Per-category derived data helper ───
    const getCategoryData = useCallback((cat: CategoryRecord): CategoryDerivedData => {
        const budgeted = localAllocations[cat.id] || 0;
        const spent = spentByCategory[cat.id] || 0;
        const absSpent = Math.abs(spent);
        const finalAvailable = budgeted - absSpent;
        const isOverspent = finalAvailable < 0;
        const recurringConfig = getRecurringForCategory(cat.id, cat);
        const isRecurring = recurringConfig !== null && isDueThisMonth(cat, month);
        const isPaid = isPaidThisMonth(cat.id, month);
        const dueDate = isRecurring ? getUpcomingDueDate(cat, month) : null;
        const isUnderGoal = isRecurring && recurringConfig?.amount ? budgeted < recurringConfig.amount : false;
        const dueText = formatDueText(dueDate);

        // Priority #3: Goals Logic
        const targetAmount = (!cat.isRecurring && (cat.amount || 0) > 0) ? cat.amount! : 0;
        const isGoal = targetAmount > 0;
        const goalProgress = isGoal ? Math.min(100, Math.max(0, (finalAvailable / targetAmount) * 100)) : 0;

        return { budgeted, absSpent, finalAvailable, isOverspent, isRecurring, isPaid, isUnderGoal, dueText, recurringConfig, isGoal, targetAmount, goalProgress };
    }, [localAllocations, spentByCategory, getRecurringForCategory, isDueThisMonth, isPaidThisMonth, getUpcomingDueDate, month, formatDueText]);

    // ─── Event handlers ───
    const handleAllocationChange = useCallback((categoryId: string, val: string) => {
        const num = parseFloat(val) || 0;
        setAllocation(categoryId, num);
    }, [setAllocation]);

    // ─── Flat ordered category list (for keyboard nav index) ───
    const orderedCategories = useMemo(() => {
        const result: CategoryRecord[] = [];
        for (const group of DEFAULT_GROUPS) {
            const cats = groupedCategories.get(group.id) || [];
            result.push(...cats);
        }
        return result;
    }, [groupedCategories]);

    return {
        // Data
        categories,
        isLoading,
        accounts,
        localAllocations,
        spentByCategory,
        totalBudgeted,
        totalSpent,
        toBeBudgeted,
        month,

        // Groups
        groupedCategories,
        activeGroups,
        collapsedGroups,
        toggleGroup,
        categoryGroupOverrides,
        setCategoryGroupOverrides,
        getEffectiveGroupId,

        // Category helpers
        getCategoryData,
        orderedCategories,

        // Viewport
        isMobile,
        isTablet,

        // Keyboard nav
        getFocusRow,
        focusRow,

        // Allocation
        setAllocation,
        handleAllocationChange,

        // Mutations (pass-through for modals)
        deleteCategory,
        updateCategory,
        createCategory,
        addTransaction,

        // Recurring store
        getRecurringForCategory,
        markAsPaidThisMonth,
        isPaidThisMonth,
    };
}
