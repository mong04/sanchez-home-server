import { render, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import FinanceDashboard from '../FinanceDashboard';
import { useFinanceStore } from '../../../../stores/useFinanceStore';
import * as financeDataHooks from '../../../../hooks/useFinanceData';
import * as budgetYjsHooks from '../../../../hooks/useBudgetYjs';

// --- Mocks Setup ---
vi.mock('../../../../stores/useFinanceStore');
vi.mock('../../../../hooks/useFinanceData');
vi.mock('../../../../hooks/useBudgetYjs');

const mockSetToBeBudgeted = vi.fn();
let mockAllocations = new Map();

// A simple mock for useBudgetYjs
vi.mocked(budgetYjsHooks.useBudgetYjs).mockImplementation(() => ({
    peerCount: 1,
    allocations: {
        forEach: (cb: any) => mockAllocations.forEach((val, key) => cb(val, key)),
        observe: vi.fn(),
        unobserve: vi.fn(),
        get: (id: string) => mockAllocations.get(id) || 0,
        set: (id: string, val: number) => mockAllocations.set(id, val),
        delete: (id: string) => mockAllocations.delete(id)
    } as any,
    provider: null as any,
    setAllocation: vi.fn(),
    getAllocations: vi.fn(),
    isConnected: true,
}));

// Mock FinanceStore
vi.mocked(useFinanceStore).mockImplementation(() => ({
    activeTab: 'budget', // default to budget
    setActiveTab: vi.fn(),
    currentMonth: '2026-02',
    setCurrentMonth: vi.fn(),
    toBeBudgeted: 0,
    setToBeBudgeted: mockSetToBeBudgeted,
    isDarkMode: true,
    setIsDarkMode: vi.fn()
}) as any);

// Mock Finance Data Hooks defaults
vi.mocked(financeDataHooks.useTransactions).mockImplementation(() => ({ data: [] }) as any);
vi.mocked(financeDataHooks.useAccounts).mockImplementation(() => ({ data: [] }) as any);
vi.mocked(financeDataHooks.useCategories).mockImplementation(() => ({ data: [] }) as any);
vi.mocked(financeDataHooks.useAddTransaction).mockImplementation(() => ({ mutateAsync: vi.fn() }) as any);
vi.mocked(financeDataHooks.useUpdateBudgetMonth).mockImplementation(() => ({ mutateAsync: vi.fn() }) as any);

describe('Integration: Income + TBB Formula (Zero-Based Budgeting)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockAllocations.clear();
        mockSetToBeBudgeted.mockClear();
    });

    it('Logs $500 income → TBB increases by $500', async () => {
        // Mock a scenario where 500 income is present in budgetMonth
        vi.mocked(financeDataHooks.useBudgetMonth).mockImplementation(() => ({
            data: { id: 'bm1', income: 500, rollover: 0 }
        }) as any);

        render(<FinanceDashboard />);

        // The dashboard calculateTbb effect should run
        await waitFor(() => {
            // formula: (income + rollover) - sum(allocations)
            // (500 + 0) - 0 = 500
            expect(mockSetToBeBudgeted).toHaveBeenCalledWith(500);
        });
    });

    it('Logs $50 expense → TBB stays the same (expenses do not subtract)', async () => {
        // Mock 1000 income, 0 rollover, no allocations
        vi.mocked(financeDataHooks.useBudgetMonth).mockImplementation(() => ({
            data: { id: 'bm1', income: 1000, rollover: 0 }
        }) as any);

        // Note: Expenses only show up in transactions which the dashboard doesn't read for TBB
        // We'll mock transactions with an expense just to prove it doesn't affect `setToBeBudgeted`
        vi.mocked(financeDataHooks.useTransactions).mockImplementation(() => ({
            data: [{ amount: -50, category: 'food' }]
        }) as any);

        render(<FinanceDashboard />);

        await waitFor(() => {
            // (1000 + 0) - 0 = 1000. TBB ignores the explicit -50 expense.
            expect(mockSetToBeBudgeted).toHaveBeenCalledWith(1000);
            expect(mockSetToBeBudgeted).not.toHaveBeenCalledWith(950);
        });
    });

    it('Manual assignment to categories → TBB decreases only on assignment', async () => {
        // Initial state: Income = 1000, Allocations = 300
        vi.mocked(financeDataHooks.useBudgetMonth).mockImplementation(() => ({
            data: { id: 'bm1', income: 1000, rollover: 0 }
        }) as any);

        mockAllocations.set('food', 200);
        mockAllocations.set('gas', 100);

        render(<FinanceDashboard />);

        // TBB should be calculated as 1000 - 300 = 700
        await waitFor(() => {
            expect(mockSetToBeBudgeted).toHaveBeenCalledWith(700);
        });
    });
});
