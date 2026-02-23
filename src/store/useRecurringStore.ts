import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import type { CategoryRecord } from '../types/pocketbase';

export interface RecurringConfig {
    frequency: 'monthly' | 'quarterly' | 'yearly';
    dueDay: number; // 1-31
    amount?: number; // Target goal amount
    startDate?: string; // ISO date string
    notes?: string;
    disabled?: boolean; // For optimistic disable toggle
}

export interface RecurringState {
    /** 
     * Local cached optimistic state of recurring configurations.
     * key: categoryId
     * value: RecurringConfig
     */
    configs: Record<string, RecurringConfig>;
    /**
     * Track which months a recurring bill has been paid.
     * key: categoryId
     * value: array of YYYY-MM strings
     */
    paidMonths: Record<string, string[]>;
}

export interface RecurringActions {
    enableRecurring: (categoryId: string, config: Omit<RecurringConfig, 'disabled'>) => void;
    disableRecurring: (categoryId: string) => void;
    updateRecurringConfig: (categoryId: string, updates: Partial<RecurringConfig>) => void;

    getRecurringForCategory: (categoryId: string, categoryRecord?: CategoryRecord) => RecurringConfig | null;
    isDueThisMonth: (category: CategoryRecord, currentMonth: string) => boolean;
    getUpcomingDueDate: (category: CategoryRecord, currentMonth: string) => string | null;

    markAsPaidThisMonth: (categoryId: string, month: string) => void;
    isPaidThisMonth: (categoryId: string, month: string) => boolean;
}

export type RecurringStore = RecurringState & RecurringActions;

export const useRecurringStore = create<RecurringStore>()(
    subscribeWithSelector(
        persist(
            (set, get) => ({
                configs: {},
                paidMonths: {},

                enableRecurring: (categoryId, config) => {
                    set((state) => ({
                        configs: {
                            ...state.configs,
                            [categoryId]: { ...config, disabled: false },
                        },
                    }));
                },

                disableRecurring: (categoryId) => {
                    set((state) => ({
                        configs: {
                            ...state.configs,
                            // Set pessimistic/optimistic disabled flag 
                            // rather than deleting so we can override DB "true" locally instantly
                            [categoryId]: {
                                ...(state.configs[categoryId] || {}),
                                disabled: true,
                            },
                        },
                    }));
                },

                updateRecurringConfig: (categoryId, updates) => {
                    set((state) => {
                        const existing = state.configs[categoryId];
                        if (!existing && updates.disabled) {
                            return { configs: { ...state.configs, [categoryId]: { ...updates } as RecurringConfig } };
                        } else if (!existing) {
                            return state;
                        }

                        return {
                            configs: {
                                ...state.configs,
                                [categoryId]: { ...existing, ...updates },
                            },
                        };
                    });
                },

                getRecurringForCategory: (categoryId, categoryRecord) => {
                    const localConfig = get().configs[categoryId];

                    if (localConfig?.disabled) {
                        return null; // Explicitly disabled locally
                    }

                    // If we have a DB record, merge it in as the fallback if local doesn't exist
                    if (!localConfig && categoryRecord?.isRecurring) {
                        return {
                            frequency: categoryRecord.frequency || 'monthly',
                            dueDay: categoryRecord.dueDay || 1,
                            amount: categoryRecord.amount,
                            startDate: categoryRecord.startDate,
                            notes: categoryRecord.notes,
                        };
                    }

                    return localConfig || null;
                },

                isDueThisMonth: (category, currentMonth) => {
                    const config = get().getRecurringForCategory(category.id, category);
                    if (!config) return false;

                    const { frequency, startDate } = config;

                    const [, monthStr] = currentMonth.split('-');
                    const targetMonth = parseInt(monthStr, 10);

                    if (frequency === 'monthly') {
                        return true;
                    }

                    if (startDate) {
                        // We assume startDate is YYYY-MM-DD or full ISO
                        const startMonthObj = new Date(startDate);
                        if (!isNaN(startMonthObj.getTime())) {
                            const startMonth = startMonthObj.getMonth() + 1; // 1-12

                            if (frequency === 'yearly') {
                                return startMonth === targetMonth;
                            }
                            if (frequency === 'quarterly') {
                                return Math.abs(targetMonth - startMonth) % 3 === 0;
                            }
                        }
                    } else {
                        // Fallback without start date
                        if (frequency === 'yearly') return targetMonth === 1; // Default to Jan
                        if (frequency === 'quarterly') return (targetMonth - 1) % 3 === 0; // Default to Jan, Apr, Jul, Oct
                    }

                    return false;
                },

                getUpcomingDueDate: (category, currentMonth) => {
                    const isDue = get().isDueThisMonth(category, currentMonth);
                    if (!isDue) return null;

                    const config = get().getRecurringForCategory(category.id, category);
                    const dueDay = config?.dueDay ?? category.dueDay;

                    if (!dueDay) return null;

                    const [yearStr, monthStr] = currentMonth.split('-');
                    const year = parseInt(yearStr, 10);
                    const monthIndex = parseInt(monthStr, 10) - 1;

                    // Ensure we don't return Feb 31st etc. Clamp to last day of month
                    const lastDayOfMonth = new Date(year, monthIndex + 1, 0).getDate();
                    const actualDueDay = Math.min(dueDay, lastDayOfMonth);
                    const actualDueDayStr = actualDueDay.toString().padStart(2, '0');

                    return `${currentMonth}-${actualDueDayStr}`;
                },

                markAsPaidThisMonth: (categoryId, month) => {
                    set((state) => {
                        const existing = state.paidMonths[categoryId] || [];
                        if (existing.includes(month)) return state;
                        return {
                            paidMonths: {
                                ...state.paidMonths,
                                [categoryId]: [...existing, month],
                            },
                        };
                    });
                },

                isPaidThisMonth: (categoryId, month) => {
                    return get().paidMonths[categoryId]?.includes(month) || false;
                },
            }),
            {
                name: 'recurring-config-v1', // Persist to LocalStorage
            }
        )
    )
);
