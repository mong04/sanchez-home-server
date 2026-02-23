import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBudgetYjs } from '../../../hooks/useBudgetYjs';
import { useCategories, useTransactions, useDeleteCategory, useUpdateCategory, useCreateCategory, useAddTransaction, useAccounts } from '../../../hooks/useFinanceData';
import type { CategoryRecord } from '../../../types/pocketbase';
import { formatCurrency } from '../../../lib/utils';
import { Card } from '../../common/Card';
import { CategoryIcon } from '../../common/CategoryIcon';
import { PredictiveEmojiBar } from '../../common/PredictiveEmojiBar';
import { Edit2, Trash2, Calendar, CheckCircle2 } from 'lucide-react';
import { Input } from '../../common/Input';
import { Button } from '../../common/Button';
import { Modal } from '../../common/Modal';
import { Select } from '../../common/Select';
import { Label } from '../../common/Label';
import { useRecurringStore } from '../../../store/useRecurringStore';
import { format, isToday, isTomorrow, differenceInDays, parseISO } from 'date-fns';
import { useFinanceStore } from '../../../stores/useFinanceStore';

interface BudgetGridProps {
    month: string; // "YYYY-MM" format
}


export function BudgetGrid({ month }: BudgetGridProps) {
    const { allocations, setAllocation } = useBudgetYjs(month);
    const { data: categories } = useCategories('expense');
    const { data: transactions } = useTransactions();
    const { data: accounts } = useAccounts();
    const deleteCategory = useDeleteCategory();
    const updateCategory = useUpdateCategory();
    const addTransaction = useAddTransaction();
    const createCategory = useCreateCategory();
    const { getRecurringForCategory, isDueThisMonth, getUpcomingDueDate, markAsPaidThisMonth, isPaidThisMonth } = useRecurringStore();

    const [iconPopoverCatId, setIconPopoverCatId] = useState<string | null>(null);
    const iconPopoverRef = useRef<HTMLDivElement>(null);
    const [markPaidModalOpen, setMarkPaidModalOpen] = useState(false);
    const [selectedRecurringCategory, setSelectedRecurringCategory] = useState<{ id: string, name: string, amount: number } | null>(null);
    const [splits, setSplits] = useState<{ id: string, accountId: string, amount: number }[]>([]);

    // Close icon popover on outside click
    useEffect(() => {
        if (!iconPopoverCatId) return;
        const handler = (e: MouseEvent) => {
            if (iconPopoverRef.current && !iconPopoverRef.current.contains(e.target as Node)) {
                setIconPopoverCatId(null);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [iconPopoverCatId]);

    // Create Category State
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [newCategory, setNewCategory] = useState({
        name: '',
        icon: '📝',
        type: 'expense' as 'expense' | 'income',
        isRecurring: false,
        amount: '',
        frequency: 'monthly' as 'monthly' | 'quarterly' | 'yearly',
        dueDay: 1,
        startDate: format(new Date(), 'yyyy-MM-dd'),
        notes: ''
    });

    // Track allocations manually for reactivity from Yjs map
    const [localAllocations, setLocalAllocations] = useState<Record<string, number>>({});


    // No longer needed — PredictiveEmojiBar & its lazy EmojiPickerModal handle selection internally


    useEffect(() => {
        const observer = () => {
            const current: Record<string, number> = {};
            allocations.forEach((val, key) => { current[key] = val; });
            setLocalAllocations(current);
        };
        // Initial load
        observer();

        allocations.observe(observer);
        return () => allocations.unobserve(observer);
    }, [allocations]);

    // Calculate spent per category
    const spentByCategory = useMemo(() => {
        const txs = transactions || [];
        const spent: Record<string, number> = {};
        for (const tx of txs) {
            // Very simple month filter using string prefix "YYYY-MM"
            if (tx.date.startsWith(month) && tx.category) {
                spent[tx.category] = (spent[tx.category] || 0) + (tx.amount || 0);
            }
        }
        return spent;
    }, [transactions, month]);

    const { toBeBudgeted } = useFinanceStore();
    const totalBudgeted = categories?.reduce((sum, cat) => sum + (localAllocations[cat.id] || 0), 0) || 0;
    const totalSpent = categories?.reduce((sum, cat) => sum + (spentByCategory[cat.id] || 0), 0) || 0;

    const handleAllocationChange = (categoryId: string, val: string) => {
        const num = parseFloat(val) || 0;
        setAllocation(categoryId, num);
    };

    const handleOpenMarkPaid = (category: CategoryRecord) => {
        setSelectedRecurringCategory({ id: category.id, name: category.name, amount: category.amount || 0 });
        const config = getRecurringForCategory(category.id, category);
        const defaultAmount = config?.amount || category.amount || 0;

        const defaultAccountId = accounts && accounts.length > 0 ? accounts[0].id : '';
        setSplits([{
            id: crypto.randomUUID(),
            accountId: defaultAccountId,
            amount: defaultAmount
        }]);
        setMarkPaidModalOpen(true);
    };

    const handleConfirmMarkPaid = async () => {
        if (!selectedRecurringCategory || splits.length === 0) return;

        const targetAmount = selectedRecurringCategory.amount;
        const totalSplit = splits.reduce((sum, s) => sum + s.amount, 0);

        if (Math.abs(totalSplit - targetAmount) > 0.01) {
            alert("Split amounts must equal the target goal amount.");
            return;
        }

        const splitGroupId = splits.length > 1 ? crypto.randomUUID() : undefined;

        try {
            for (const split of splits) {
                if (split.amount <= 0 || !split.accountId) continue;

                await addTransaction.mutateAsync({
                    date: new Date().toISOString(),
                    amount: -Math.abs(split.amount), // Expenses are negative via standard pattern
                    category: selectedRecurringCategory.id,
                    account: split.accountId,
                    payee: `${selectedRecurringCategory.name} Payment`,
                    cleared: true,
                    type: 'normal',
                    notes: splits.length > 1 ? 'Split Payment' : undefined,
                    splitGroupId: splitGroupId
                });
            }

            markAsPaidThisMonth(selectedRecurringCategory.id, month);
            setMarkPaidModalOpen(false);
        } catch (err) {
            console.error("Failed to log split transactions", err);
        }
    };

    const handleCreateCategory = async () => {
        if (!newCategory.name.trim()) return;

        const data: Partial<CategoryRecord> = {
            name: newCategory.name.trim(),
            icon: newCategory.icon,
            type: newCategory.type,
            isSystem: false,
            color: '#e2e8f0', // default fallback color
            isRecurring: newCategory.isRecurring,
            notes: newCategory.notes || ''
        };

        if (newCategory.isRecurring) {
            data.amount = parseFloat(newCategory.amount) || 0;
            data.frequency = newCategory.frequency;
            data.dueDay = newCategory.dueDay;
            data.startDate = new Date(newCategory.startDate).toISOString();
        }

        await createCategory.mutateAsync(data);

        // Reset form and close
        setNewCategory({
            name: '',
            icon: '📝',
            type: 'expense',
            isRecurring: false,
            amount: '',
            frequency: 'monthly',
            dueDay: 1,
            startDate: format(new Date(), 'yyyy-MM-dd'),
            notes: ''
        });
        setCreateModalOpen(false);
    };

    const targetGoal = selectedRecurringCategory?.amount || 0;
    const currentSplitTotal = splits.reduce((sum, s) => sum + s.amount, 0);
    const remainingToAssign = targetGoal - currentSplitTotal;
    const isSplitValid = Math.abs(remainingToAssign) < 0.01;

    const formatDueText = (dateStr: string | null) => {
        if (!dateStr) return '';
        try {
            const d = parseISO(dateStr);
            if (isToday(d)) return 'Due today';
            if (isTomorrow(d)) return 'Due tomorrow';
            const diff = Math.ceil(differenceInDays(d, new Date()));
            if (diff > 1 && diff <= 5) return `Due in ${diff} days`;
            if (diff < 0) return `Past due`;
            return `Due on the ${format(d, 'do')}`;
        } catch {
            return `Due ${dateStr}`;
        }
    };

    return (
        <div className="flex flex-col gap-6 p-4 max-w-5xl mx-auto pb-32">
            {/* Empty State vs Grid */}

            {/* Modal for Mark Paid is located down below */}
            {!categories || categories.length === 0 ? (
                <div className="text-center py-12 flex flex-col items-center gap-4">
                    <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
                        <span className="text-4xl">🌱</span>
                    </div>
                    <h3 className="text-xl font-semibold text-foreground">Let's add some categories</h3>
                    <p className="text-muted-foreground max-w-sm">Categorize your spending to give every dollar a job.</p>
                    <Button onClick={() => setCreateModalOpen(true)} className="mt-2">
                        + Add Category or Bill
                    </Button>
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {/* Toolbar */}
                    <div className="flex justify-end pr-2 md:pr-0">
                        <Button variant="outline" size="sm" onClick={() => setCreateModalOpen(true)} className="shadow-sm min-h-[44px] md:min-h-0 bg-card">
                            <span className="text-lg leading-none mr-1.5 mb-0.5">+</span> Add Category or Bill
                        </Button>
                    </div>

                    <Card className="bg-card shadow-sm border-border flex flex-col overflow-hidden h-[calc(100dvh-250px)] lg:h-[calc(100dvh-190px)]">
                        <div className="w-full flex flex-col flex-1 min-h-0">
                            {/* Header */}
                            <div className="hidden lg:grid lg:grid-cols-12 gap-4 p-4 border-b border-border/50 bg-card/95 backdrop-blur-md text-sm font-medium text-muted-foreground uppercase tracking-wider sticky top-0 z-30 shadow-sm transition-all duration-300 shrink-0">
                                <div className="col-span-4 pl-2">Category</div>
                                <div className="col-span-3 text-right">Budgeted</div>
                                <div className="col-span-2 text-right">Spent</div>
                                <div className="col-span-3 text-right pr-2">Available</div>
                            </div>

                            {/* Rows */}
                            <div className="flex-1 overflow-y-auto !scrollbar-hide [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden w-full relative">
                                <div className="divide-y divide-border">
                                    <AnimatePresence>
                                        {categories.map((cat) => {
                                            const budgeted = localAllocations[cat.id] || 0;
                                            const spent = spentByCategory[cat.id] || 0;
                                            const absSpent = Math.abs(spent);
                                            const finalAvailable = budgeted - absSpent;
                                            const isOverspent = finalAvailable < 0;

                                            const recurringConfig = getRecurringForCategory(cat.id, cat);
                                            const isRecurring = recurringConfig !== null && isDueThisMonth(cat, month);
                                            const isPaid = isPaidThisMonth(cat.id, month);
                                            const dueDate = isRecurring ? getUpcomingDueDate(cat, month) : null;
                                            const isUnderGoal = isRecurring && recurringConfig?.amount && budgeted < recurringConfig.amount;
                                            const dueText = formatDueText(dueDate);

                                            return (
                                                <motion.div
                                                    key={cat.id}
                                                    layout
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    className={`group flex flex-col lg:grid lg:grid-cols-12 gap-3 lg:gap-4 p-4 lg:items-center transition-colors
                                                ${isOverspent ? 'bg-destructive/5 hover:bg-destructive/10' :
                                                            isUnderGoal ? 'bg-warning/5 hover:bg-warning/10' : 'hover:bg-accent/50'}
                                            `}
                                                >
                                                    {/* Top Row (Mobile) / Column 1 (Desktop) */}
                                                    <div className="flex items-center justify-between lg:col-span-4">
                                                        <div className="flex items-center gap-3">
                                                            {/* Icon with predictive bar popover */}
                                                            <div className="relative shrink-0" ref={iconPopoverCatId === cat.id ? iconPopoverRef : null}>
                                                                <CategoryIcon
                                                                    categoryName={cat.name}
                                                                    emojiOverride={cat.icon}
                                                                    className="w-12 h-12 lg:w-10 lg:h-10 shadow-sm"
                                                                    emojiClassName="text-2xl lg:text-xl"
                                                                    onClick={() => setIconPopoverCatId(iconPopoverCatId === cat.id ? null : cat.id)}
                                                                />
                                                                <AnimatePresence>
                                                                    {iconPopoverCatId === cat.id && (
                                                                        <motion.div
                                                                            initial={{ opacity: 0, y: 4, scale: 0.95 }}
                                                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                                                            exit={{ opacity: 0, y: 4, scale: 0.95 }}
                                                                            transition={{ duration: 0.15 }}
                                                                            className="absolute left-0 top-full mt-2 z-[9999] bg-card border border-border rounded-2xl shadow-xl p-2"
                                                                        >
                                                                            <PredictiveEmojiBar
                                                                                searchTerm={cat.name}
                                                                                currentEmoji={cat.icon}
                                                                                onSelect={(emoji) => {
                                                                                    updateCategory.mutate({ id: cat.id, data: { icon: emoji } });
                                                                                    setIconPopoverCatId(null);
                                                                                }}
                                                                            />
                                                                        </motion.div>
                                                                    )}
                                                                </AnimatePresence>
                                                            </div>
                                                            <div className="flex flex-col min-w-0">
                                                                <span className="font-semibold lg:font-medium text-foreground truncate text-base lg:text-sm flex items-center gap-2">
                                                                    <span className="truncate">{cat.name}</span>
                                                                    {isRecurring && (
                                                                        <span className="shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-muted text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                                                                            <Calendar className="w-3 h-3" /> <span className="hidden lg:inline">Recurring</span>
                                                                        </span>
                                                                    )}
                                                                </span>
                                                            </div>
                                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity gap-1 hidden lg:flex">
                                                                <button className="p-1.5 lg:p-1 text-muted-foreground hover:text-primary"><Edit2 className="w-4 h-4 lg:w-3.5 lg:h-3.5" /></button>
                                                                <button onClick={() => deleteCategory.mutate(cat.id)} className="p-1.5 lg:p-1 text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4 lg:w-3.5 lg:h-3.5" /></button>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Middle Row (Mobile) / Column 2 & 3 (Desktop) */}
                                                    <div className="flex items-center justify-between lg:contents mt-2 lg:mt-0 bg-background/50 lg:bg-transparent p-3 lg:p-0 rounded-2xl border border-border lg:border-transparent">

                                                        <div className="flex flex-col lg:hidden min-w-0">
                                                            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Budgeted</span>
                                                            <span className="text-xs text-muted-foreground">Spent: {formatCurrency(absSpent)}</span>
                                                            {isRecurring && recurringConfig?.amount ? (
                                                                <span className={`text-[10px] mt-0.5 truncate ${isUnderGoal ? 'text-warning font-medium' : 'text-muted-foreground'}`}>
                                                                    Goal: {formatCurrency(recurringConfig.amount)}
                                                                </span>
                                                            ) : null}
                                                        </div>

                                                        <div className="lg:col-span-3 flex justify-end min-w-0">
                                                            <div className="flex flex-col items-end min-w-0">
                                                                {isRecurring && recurringConfig?.amount ? (
                                                                    <span className={`text-[10px] mb-1 text-right truncate max-w-full ${isUnderGoal ? 'text-warning font-medium' : 'text-muted-foreground'} hidden lg:block`}>
                                                                        Goal: {formatCurrency(recurringConfig.amount)}
                                                                    </span>
                                                                ) : null}
                                                                <Input
                                                                    type="number"
                                                                    value={budgeted === 0 ? '' : budgeted}
                                                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleAllocationChange(cat.id, e.target.value)}
                                                                    placeholder="0.00"
                                                                    className={`w-[110px] lg:w-[120px] h-12 lg:h-auto text-lg lg:text-base text-right lg:bg-transparent hover:border-primary/50 focus:bg-background transition-all text-foreground font-semibold lg:font-medium rounded-xl ${isUnderGoal ? 'bg-warning/10 border-warning/30 focus:border-warning' : 'bg-muted/50 border-border lg:border-transparent'}`}
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="hidden lg:flex lg:col-span-2 justify-end items-center text-muted-foreground tabular-nums">
                                                            {formatCurrency(absSpent)}
                                                        </div>
                                                    </div>

                                                    {/* Bottom Row (Mobile) / Column 4 (Desktop) */}
                                                    <div className="flex items-center justify-between lg:col-span-3 lg:justify-end lg:pr-2 pt-2 lg:pt-0">
                                                        <div className="lg:hidden flex flex-col">
                                                            <span className="text-sm font-semibold text-muted-foreground uppercase">Available</span>
                                                            {isRecurring && dueText && !isPaid && (
                                                                <span className="text-[10px] text-muted-foreground mt-0.5">{dueText}</span>
                                                            )}
                                                        </div>
                                                        <div className="flex flex-col items-end gap-1">
                                                            <div className="flex items-center gap-3">
                                                                <motion.span
                                                                    key={finalAvailable}
                                                                    className={`font-bold text-xl lg:font-semibold lg:text-base transition-colors ${finalAvailable < 0 ? 'text-destructive' : finalAvailable > 0 ? 'text-success' : 'text-muted-foreground'}`}
                                                                >
                                                                    {formatCurrency(finalAvailable)}
                                                                </motion.span>

                                                                {isOverspent && (
                                                                    <button className="text-xs bg-destructive text-destructive-foreground px-4 py-2 lg:px-3 lg:py-1 rounded-full font-bold lg:font-medium hover:opacity-80 transition-opacity ml-2">
                                                                        Fix
                                                                    </button>
                                                                )}
                                                            </div>

                                                            {/* Recurring Actions */}
                                                            {isRecurring && !isOverspent && (
                                                                <div className="flex items-center gap-2 mt-1">
                                                                    {dueText && !isPaid && (
                                                                        <span className="text-[10px] text-muted-foreground hidden lg:block">{dueText}</span>
                                                                    )}
                                                                    {!isPaid && month === format(new Date(), 'yyyy-MM') && (
                                                                        <button
                                                                            onClick={() => handleOpenMarkPaid(cat)}
                                                                            className="text-[10px] px-2 py-1 rounded bg-primary/10 text-primary hover:bg-primary/20 font-semibold transition-colors"
                                                                        >
                                                                            Mark Paid
                                                                        </button>
                                                                    )}
                                                                    {isPaid && (
                                                                        <span className="text-[10px] flex items-center gap-1 text-success font-medium">
                                                                            <CheckCircle2 className="w-3 h-3" /> Paid
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </AnimatePresence>
                                </div>
                            </div>

                            {/* Footer Totals */}
                            <div className="grid grid-cols-2 lg:grid-cols-12 gap-4 p-4 lg:p-6 border-t border-border bg-muted/30 font-semibold text-foreground shrink-0 z-10 relative">
                                <div className="col-span-1 lg:col-span-4 pl-0 lg:pl-2 text-muted-foreground uppercase text-sm tracking-wider flex items-center">Totals</div>
                                <div className="hidden lg:block lg:col-span-3 text-right">{formatCurrency(totalBudgeted)}</div>
                                <div className="hidden lg:block lg:col-span-2 text-right">{formatCurrency(totalSpent)}</div>
                                <div className="col-span-1 lg:col-span-3 text-right lg:pr-2 flex flex-col justify-end">
                                    <span className={(toBeBudgeted ?? 0) < 0 ? 'text-destructive text-lg' : 'text-lg'}>
                                        {formatCurrency(toBeBudgeted ?? 0)}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider lg:hidden">To Be Budgeted</span>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            )
            }



            {/* Mark Paid Modal */}
            <Modal
                isOpen={markPaidModalOpen}
                onClose={() => setMarkPaidModalOpen(false)}
                title={`Mark ${selectedRecurringCategory?.name} Paid`}
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setMarkPaidModalOpen(false)}>Cancel</Button>
                        <Button
                            onClick={handleConfirmMarkPaid}
                            disabled={addTransaction.isPending || !isSplitValid || splits.some(s => !s.accountId)}
                            className="bg-success hover:bg-success/90 text-success-foreground"
                        >
                            {addTransaction.isPending ? 'Logging...' : 'Confirm'}
                        </Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <div className="bg-muted/50 p-4 rounded-xl flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">Target Amount</span>
                        <div className="text-right">
                            <span className="text-lg font-bold text-foreground block">
                                {formatCurrency(targetGoal)}
                            </span>
                            {!isSplitValid && (
                                <span className={`text-xs ${remainingToAssign > 0 ? 'text-primary' : 'text-destructive'}`}>
                                    {remainingToAssign > 0 ? `${formatCurrency(remainingToAssign)} remaining` : `${formatCurrency(Math.abs(remainingToAssign))} over`}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium text-muted-foreground">Payment Accounts</h4>
                        </div>

                        <div className="space-y-2">
                            {splits.map((split, index) => (
                                <div key={split.id} className="flex items-center gap-2 group">
                                    <div className="flex-1">
                                        <Select
                                            value={split.accountId}
                                            onChange={(e) => {
                                                const newSplits = [...splits];
                                                newSplits[index].accountId = e.target.value;
                                                setSplits(newSplits);
                                            }}
                                            options={accounts?.map(a => ({ value: a.id, label: `${a.name} (${formatCurrency(a.currentBalance)})` })) || []}
                                        />
                                    </div>
                                    <div className="w-28 relative">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</div>
                                        <Input
                                            type="number"
                                            value={split.amount || ''}
                                            onChange={(e) => {
                                                const newSplits = [...splits];
                                                newSplits[index].amount = parseFloat(e.target.value) || 0;
                                                setSplits(newSplits);
                                            }}
                                            className="pl-6 h-11 text-right"
                                            placeholder="0.00"
                                        />
                                    </div>
                                    {splits.length > 1 && (
                                        <button
                                            onClick={() => setSplits(splits.filter(s => s.id !== split.id))}
                                            className="p-2 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                            aria-label="Remove split"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>

                        {splits.length < 5 && (
                            <button
                                onClick={() => {
                                    setSplits([...splits, {
                                        id: crypto.randomUUID(),
                                        accountId: accounts && accounts.length > 0 ? accounts[0].id : '',
                                        amount: remainingToAssign > 0 ? remainingToAssign : 0
                                    }]);
                                }}
                                className="text-sm font-medium text-primary hover:text-primary/80 transition-colors flex items-center gap-1 py-1"
                            >
                                + Add Split
                            </button>
                        )}
                    </div>
                </div>
            </Modal>

            {/* Create Category Modal */}
            <Modal
                isOpen={createModalOpen}
                onClose={() => setCreateModalOpen(false)}
                title="Add Category or Bill"
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setCreateModalOpen(false)}>Cancel</Button>
                        <Button
                            onClick={handleCreateCategory}
                            disabled={createCategory.isPending || !newCategory.name.trim()}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground"
                        >
                            {createCategory.isPending ? 'Creating...' : 'Create'}
                        </Button>
                    </>
                }
            >
                <div className="space-y-6">
                    {/* Basic Info */}
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
                                    onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="e.g. Groceries, Netflix, Rent"
                                    autoFocus
                                />
                                {/* Predictive emoji bar — reacts as user types */}
                                <div className="pt-2">
                                    <PredictiveEmojiBar
                                        searchTerm={newCategory.name}
                                        currentEmoji={newCategory.icon}
                                        onSelect={(emoji) => setNewCategory(prev => ({ ...prev, icon: emoji }))}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Recurring Configuration */}
                    <div className="pt-4 border-t border-border space-y-4">
                        <label className="flex items-center justify-between cursor-pointer group">
                            <div className="space-y-0.5">
                                <div className="font-medium text-foreground group-hover:text-primary transition-colors">Recurring Bill</div>
                                <div className="text-xs text-muted-foreground">Set a goal amount and frequency for this category.</div>
                            </div>
                            <div className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${newCategory.isRecurring ? 'bg-primary' : 'bg-muted'}`}>
                                <input
                                    type="checkbox"
                                    className="sr-only"
                                    checked={newCategory.isRecurring}
                                    onChange={(e) => setNewCategory(prev => ({ ...prev, isRecurring: e.target.checked }))}
                                />
                                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow ring-0 transition duration-200 ease-in-out ${newCategory.isRecurring ? 'translate-x-5' : 'translate-x-0'}`} />
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
                                                <Input
                                                    id="catAmount"
                                                    type="number"
                                                    className="pl-6"
                                                    placeholder="0.00"
                                                    value={newCategory.amount}
                                                    onChange={(e) => setNewCategory(prev => ({ ...prev, amount: e.target.value }))}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <Label>Frequency</Label>
                                            <Select
                                                value={newCategory.frequency}
                                                onChange={(e) => setNewCategory(prev => ({ ...prev, frequency: e.target.value as 'monthly' | 'quarterly' | 'yearly' }))}
                                                options={[
                                                    { value: 'monthly', label: 'Monthly' },
                                                    { value: 'quarterly', label: 'Quarterly' },
                                                    { value: 'yearly', label: 'Yearly' }
                                                ]}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <Label htmlFor="catDueDay">Due Day (1-31)</Label>
                                            <Input
                                                id="catDueDay"
                                                type="number"
                                                min={1}
                                                max={31}
                                                value={newCategory.dueDay}
                                                onChange={(e) => setNewCategory(prev => ({ ...prev, dueDay: parseInt(e.target.value) || 1 }))}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label htmlFor="catStartDate">Start Date</Label>
                                            <Input
                                                id="catStartDate"
                                                type="date"
                                                value={newCategory.startDate}
                                                onChange={(e) => setNewCategory(prev => ({ ...prev, startDate: e.target.value }))}
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="pt-4 border-t border-border space-y-1">
                        <Label htmlFor="catNotes">Notes (Optional)</Label>
                        <Input
                            id="catNotes"
                            value={newCategory.notes}
                            onChange={(e) => setNewCategory(prev => ({ ...prev, notes: e.target.value }))}
                            placeholder="Account numbers, website, etc."
                        />
                    </div>
                </div>
            </Modal>
        </div >
    );
}
