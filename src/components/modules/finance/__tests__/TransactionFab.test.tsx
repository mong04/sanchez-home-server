import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TransactionFab } from '../TransactionFab';

const mockMutateAsync = vi.fn();
const mockUpdateBudgetMonthMutateAsync = vi.fn();

// Mocks
vi.mock('../../../../hooks/useFinanceData', () => ({
    useAddTransaction: vi.fn(() => ({ mutateAsync: mockMutateAsync })),
    useCategories: vi.fn((type) => ({
        data: [
            { id: 'cat-e1', name: 'Groceries', type: 'expense', isSystem: false },
            { id: 'cat-i1', name: 'Income', type: 'income', isSystem: true }
        ].filter(c => type ? c.type === type : true)
    })),
    useAccounts: vi.fn(() => ({ data: [{ id: 'acc-1', name: 'Checking Account' }] })),
    useTransactions: vi.fn(() => ({ data: [] })),
    useBudgetMonth: vi.fn(() => ({ data: { id: 'bm1', income: 1000 } })),
    useUpdateBudgetMonth: vi.fn(() => ({ mutateAsync: mockUpdateBudgetMonthMutateAsync }))
}));

vi.mock('../../../../stores/useFinanceStore', () => ({
    useFinanceStore: vi.fn(() => ({ currentMonth: '2026-02' }))
}));

vi.mock('../../../../hooks/useBudgetYjs', () => ({
    useBudgetYjs: vi.fn(() => ({ allocations: new Map() }))
}));

// Mock window navigator vibrate
if (!global.navigator) {
    (global as any).navigator = {};
}
Object.defineProperty(global.navigator, 'vibrate', {
    value: vi.fn(),
    writable: true
});

describe('TransactionFab - Income Flow', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
    });

    it('toggles transaction type to Income', async () => {
        render(<TransactionFab />);

        // Open FAB
        const openBtn = document.querySelector('.w-14.h-14, .w-16.h-16');
        if (openBtn) fireEvent.click(openBtn);

        // Find Expense/Income toggles
        const incomeBtn = await screen.findByText(/Income/i);
        expect(incomeBtn).toBeTruthy();

        fireEvent.click(incomeBtn);

        // Expect numpad label to change
        expect(screen.getByText('How much did you get paid?')).toBeTruthy();
    });

    it('skips category step for Income and proceeds to payee', async () => {
        render(<TransactionFab />);

        // Open FAB
        const openBtn = document.querySelector('.w-14.h-14, .w-16.h-16');
        if (openBtn) fireEvent.click(openBtn);

        // Select Income
        const incomeBtn = await screen.findByText(/Income/i);
        fireEvent.click(incomeBtn);

        // Enter amount (1)
        fireEvent.click(screen.getByText('1'));

        // Click Next
        fireEvent.click(screen.getByText('Next'));

        // Should skip "Select Category" (length 15) and go straight to "Who paid you?"
        await waitFor(() => {
            expect(screen.getByText('Who paid you?')).toBeTruthy();
        });
        expect(screen.queryByText('Select Category')).toBeNull();
    });

    it('submits an income transaction with isIncome flag and system category', async () => {
        render(<TransactionFab />);

        const openBtn = document.querySelector('.w-14.h-14, .w-16.h-16');
        if (openBtn) fireEvent.click(openBtn);

        // Select Income
        const incomeBtn = await screen.findByText(/Income/i);
        fireEvent.click(incomeBtn);

        // Enter amount (5)
        fireEvent.click(screen.getByText('5'));

        // Next (skips to payee)
        fireEvent.click(screen.getByText('Next'));

        // Enter payee and submit
        const payeeInput = await screen.findByPlaceholderText('Type payee name...');
        fireEvent.change(payeeInput, { target: { value: 'Work' } });
        fireEvent.keyDown(payeeInput, { key: 'Enter', code: 'Enter' });

        // Verify mutation arguments
        await waitFor(() => {
            expect(mockMutateAsync).toHaveBeenCalledTimes(1);
            const callArgs = mockMutateAsync.mock.calls[0][0];
            expect(callArgs.amount).toBe(5); // Positive for income
            expect(callArgs.isIncome).toBe(true);
            expect(callArgs.category).toBe('cat-i1'); // Dynamically found system category
            expect(callArgs.type).toBe('normal');
            expect(callArgs.payee).toBe('Work');

            expect(mockUpdateBudgetMonthMutateAsync).toHaveBeenCalledTimes(1);
            expect(mockUpdateBudgetMonthMutateAsync).toHaveBeenCalledWith({
                id: 'bm1',
                data: { income: 1005 } // 1000 + 5
            });
        });
    });
});
