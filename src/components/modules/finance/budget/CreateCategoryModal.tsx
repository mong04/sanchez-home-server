// src/components/modules/finance/budget/CreateCategoryModal.tsx
// Self-contained modal for creating a new budget category or recurring bill.
// Owns: newCategory form state.

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { format } from 'date-fns';
import { Modal } from '../../../common/Modal';
import { Button } from '../../../common/Button';
import { Input } from '../../../common/Input';
import { Select } from '../../../common/Select';
import { Label } from '../../../common/Label';
import { PredictiveEmojiBar } from '../../../common/PredictiveEmojiBar';
import { cn } from '../../../../lib/utils';
import type { CategoryRecord } from '../../../../types/pocketbase';

interface CreateCategoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreateCategory: (data: Partial<CategoryRecord>) => Promise<void>;
    isPending: boolean;
}

interface NewCategoryState {
    name: string;
    icon: string;
    type: 'expense' | 'income';
    isRecurring: boolean;
    isGoal: boolean;
    amount: string;
    targetAmount: string;
    frequency: 'monthly' | 'quarterly' | 'yearly';
    dueDay: number;
    startDate: string;
    notes: string;
}

const INITIAL_STATE: NewCategoryState = {
    name: '',
    icon: '📝',
    type: 'expense',
    isRecurring: false,
    isGoal: false,
    amount: '',
    targetAmount: '',
    frequency: 'monthly',
    dueDay: 1,
    startDate: format(new Date(), 'yyyy-MM-dd'),
    notes: '',
};

export function CreateCategoryModal({
    isOpen,
    onClose,
    onCreateCategory,
    isPending,
}: CreateCategoryModalProps) {
    const [newCategory, setNewCategory] = useState<NewCategoryState>(INITIAL_STATE);

    const handleCreate = async () => {
        if (!newCategory.name.trim()) return;
        const data: Partial<CategoryRecord> = {
            name: newCategory.name.trim(),
            icon: newCategory.icon,
            type: newCategory.type,
            isSystem: false,
            color: '#e2e8f0',
            isRecurring: newCategory.isRecurring,
            notes: newCategory.notes || '',
        };
        if (newCategory.isRecurring) {
            data.amount = parseFloat(newCategory.amount) || 0;
            data.frequency = newCategory.frequency;
            data.dueDay = newCategory.dueDay;
            data.startDate = new Date(newCategory.startDate).toISOString();
        } else if (newCategory.isGoal) {
            // Priority #3: Savings Goal uses the `amount` field natively with no schema alterations
            data.amount = parseFloat(newCategory.targetAmount) || 0;
            // Overload startDate to act as the Goal Target Date!
            data.startDate = newCategory.startDate ? new Date(newCategory.startDate).toISOString() : '';
            // ensure frequency and dueDay are empty/null to differentiate from recurring
            data.frequency = undefined;
            data.dueDay = undefined;
        }
        await onCreateCategory(data);
        setNewCategory(INITIAL_STATE);
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Add Category or Bill"
            footer={
                <>
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button
                        onClick={handleCreate}
                        disabled={isPending || !newCategory.name.trim()}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                        {isPending ? 'Creating...' : 'Create'}
                    </Button>
                </>
            }
        >
            <div className="space-y-6">
                <div className="space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center text-2xl shrink-0 select-none" aria-hidden>
                            {newCategory.icon}
                        </div>
                        <div className="flex-1 space-y-1">
                            <Label htmlFor="catName">Category Name</Label>
                            <Input
                                id="catName"
                                value={newCategory.name}
                                onChange={(e) => setNewCategory((prev) => ({ ...prev, name: e.target.value }))}
                                placeholder="e.g. Groceries, Netflix, Rent"
                                autoFocus
                            />
                            <div className="pt-2">
                                <PredictiveEmojiBar
                                    searchTerm={newCategory.name}
                                    currentEmoji={newCategory.icon}
                                    onSelect={(emoji) => setNewCategory((prev) => ({ ...prev, icon: emoji }))}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-4 border-t border-border space-y-4">
                    <label className="flex items-center justify-between cursor-pointer group">
                        <div className="space-y-0.5">
                            <div className="font-medium text-foreground group-hover:text-primary transition-colors">Savings Goal</div>
                            <div className="text-xs text-muted-foreground">Set a target amount (e.g., Vacation Fund).</div>
                        </div>
                        <div className={cn(`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2`, newCategory.isGoal ? 'bg-primary' : 'bg-muted')}>
                            <input
                                type="checkbox"
                                className="sr-only"
                                checked={newCategory.isGoal}
                                onChange={(e) => setNewCategory((prev) => ({ ...prev, isGoal: e.target.checked, isRecurring: e.target.checked ? false : prev.isRecurring }))}
                            />
                            <span className={cn('pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow ring-0 transition duration-200 ease-in-out', newCategory.isGoal ? 'translate-x-5' : 'translate-x-0')} />
                        </div>
                    </label>

                    <AnimatePresence>
                        {newCategory.isGoal && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="space-y-4 overflow-hidden pt-2"
                            >
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <Label htmlFor="catTargetAmount">Target Amount</Label>
                                        <div className="relative">
                                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</div>
                                            <Input id="catTargetAmount" type="number" className="pl-6" placeholder="0.00" value={newCategory.targetAmount} onChange={(e) => setNewCategory((prev) => ({ ...prev, targetAmount: e.target.value }))} />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="catTargetDate">Target Date (Optional)</Label>
                                        <Input id="catTargetDate" type="date" value={newCategory.startDate} onChange={(e) => setNewCategory((prev) => ({ ...prev, startDate: e.target.value }))} className="[color-scheme:light] dark:[color-scheme:dark]" />
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <label className="flex items-center justify-between cursor-pointer group">
                        <div className="space-y-0.5">
                            <div className="font-medium text-foreground group-hover:text-primary transition-colors">Recurring Bill</div>
                            <div className="text-xs text-muted-foreground">Set a standard monthly amount and frequency.</div>
                        </div>
                        <div className={cn(`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2`, newCategory.isRecurring ? 'bg-primary' : 'bg-muted')}>
                            <input
                                type="checkbox"
                                className="sr-only"
                                checked={newCategory.isRecurring}
                                onChange={(e) => setNewCategory((prev) => ({ ...prev, isRecurring: e.target.checked, isGoal: e.target.checked ? false : prev.isGoal }))}
                            />
                            <span className={cn('pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow ring-0 transition duration-200 ease-in-out', newCategory.isRecurring ? 'translate-x-5' : 'translate-x-0')} />
                        </div>
                    </label>

                    <AnimatePresence>
                        {newCategory.isRecurring && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="space-y-4 overflow-hidden"
                            >
                                <div className="grid grid-cols-2 gap-4 pt-2">
                                    <div className="space-y-1">
                                        <Label htmlFor="catAmount">Goal Amount</Label>
                                        <div className="relative">
                                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</div>
                                            <Input id="catAmount" type="number" className="pl-6" placeholder="0.00" value={newCategory.amount} onChange={(e) => setNewCategory((prev) => ({ ...prev, amount: e.target.value }))} />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <Label>Frequency</Label>
                                        <Select
                                            value={newCategory.frequency}
                                            onChange={(e) => setNewCategory((prev) => ({ ...prev, frequency: e.target.value as 'monthly' | 'quarterly' | 'yearly' }))}
                                            options={[{ value: 'monthly', label: 'Monthly' }, { value: 'quarterly', label: 'Quarterly' }, { value: 'yearly', label: 'Yearly' }]}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="catStartDate">Next Due Date</Label>
                                    <Input id="catStartDate" type="date" value={newCategory.startDate} onChange={(e) => {
                                        const val = e.target.value;
                                        setNewCategory((prev) => ({
                                            ...prev,
                                            startDate: val,
                                            dueDay: val ? parseInt(val.split('-')[2], 10) : prev.dueDay
                                        }));
                                    }} className="[color-scheme:light] dark:[color-scheme:dark]" />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="pt-4 border-t border-border space-y-1">
                    <Label htmlFor="catNotes">Notes (Optional)</Label>
                    <Input id="catNotes" value={newCategory.notes} onChange={(e) => setNewCategory((prev) => ({ ...prev, notes: e.target.value }))} placeholder="Account numbers, website, etc." />
                </div>
            </div>
        </Modal>
    );
}
