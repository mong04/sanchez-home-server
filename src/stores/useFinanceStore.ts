// src/stores/useFinanceStore.ts — Finance module global state

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { format } from 'date-fns';

interface FinanceState {
    currentMonth: string; // "2026-02"
    setCurrentMonth: (m: string) => void;
    activeTab: 'dashboard' | 'accounts' | 'budget' | 'transactions' | 'templates';
    setActiveTab: (tab: FinanceState['activeTab']) => void;
    // Magic Sticky Header State
    toBeBudgeted: number | null;
    setToBeBudgeted: (val: number) => void;
}

export const useFinanceStore = create<FinanceState>()(
    devtools((set) => ({
        currentMonth: format(new Date(), 'yyyy-MM'),
        setCurrentMonth: (month) => set({ currentMonth: month }),
        activeTab: 'dashboard',
        setActiveTab: (tab) => set({ activeTab: tab }),
        toBeBudgeted: null,
        setToBeBudgeted: (val) => set({ toBeBudgeted: val }),
    }), { name: 'finance-store' })
);
