import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, Calendar } from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { formatCurrency } from '../../../../lib/utils';
import { BudgetProgressRing } from './BudgetProgressRing';
import type { CategoryRecord } from '../../../../types/pocketbase';
import type { RecurringConfig } from '../../../../store/useRecurringStore';

interface BudgetBottomSheetProps {
    isOpen: boolean;
    onClose: () => void;
    category: CategoryRecord | null;
    budgeted: number;
    spent: number;
    /** Called when user commits a new allocation */
    onAllocationChange: (categoryId: string, val: string) => void;
    recurringConfig: RecurringConfig | null;
    isPaid: boolean;
    isRecurring: boolean;
    onMarkPaid: () => void;
}

export function BudgetBottomSheet({
    isOpen,
    onClose,
    category,
    budgeted,
    spent,
    onAllocationChange,
    recurringConfig,
    isPaid,
    isRecurring,
    onMarkPaid,
}: BudgetBottomSheetProps) {
    const [draft, setDraft] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);
    const closeRef = useRef<HTMLButtonElement>(null);

    const absSpent = Math.abs(spent);



    // Initial sync of draft value when the sheet opens or category changes
    useEffect(() => {
        if (isOpen && category) {
            setDraft(budgeted === 0 ? '' : budgeted.toString());
        }
    }, [isOpen, category?.id]);

    const draftNum = parseFloat(draft) || 0;
    const available = draftNum - absSpent;
    const isOverspent = available < 0;

    // Derived flags
    const isGoal = !isRecurring && category?.amount && category.amount > 0;
    const targetAmount = category?.amount || 0;
    const isUnderGoal = isRecurring && recurringConfig?.amount ? draftNum < recurringConfig.amount : false;

    // Focus input on open
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 250);
        }
    }, [isOpen]);

    // Trap focus within sheet
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'BUTTON') {
                handleCommit();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose, draft]);

    const handleCommit = () => {
        if (!category) return;
        onAllocationChange(category.id, draft);
        onClose();
    };

    if (!category) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Scrim */}
                    <motion.div
                        key="scrim"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 bg-black/50 z-[60] md:hidden"
                        onClick={onClose}
                        aria-hidden="true"
                    />

                    {/* Sheet */}
                    <motion.div
                        key="sheet"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="sheet-title"
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '110%' }}
                        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
                        className="fixed bottom-0 left-0 right-0 z-[70] md:hidden bg-card rounded-t-3xl shadow-2xl will-change-transform"
                        style={{ paddingBottom: 'env(safe-area-inset-bottom, 24px)' }}
                    >
                        {/* Drag handle */}
                        <div className="flex justify-center pt-3 pb-1">
                            <div className="w-10 h-1 rounded-full bg-muted-foreground/30" aria-hidden="true" />
                        </div>

                        <div className="px-6 pt-3 pb-6 space-y-5">
                            {/* Header row */}
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <span className="text-3xl leading-none" aria-hidden="true">
                                        {category.icon || '📝'}
                                    </span>
                                    <div>
                                        <h2 id="sheet-title" className="text-xl font-bold text-foreground leading-tight">
                                            {category.name}
                                        </h2>
                                        {isRecurring && (
                                            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                                                <Calendar className="w-3 h-3" />
                                                {isPaid ? 'Paid this month' : 'Recurring'}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <button
                                    ref={closeRef}
                                    onClick={onClose}
                                    aria-label="Close budget editor"
                                    className="mt-0.5 p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Progress Ring + Stats */}
                            <div className="flex items-center gap-4 p-4 bg-muted/40 rounded-2xl">
                                <BudgetProgressRing
                                    spent={absSpent}
                                    budgeted={draftNum > 0 ? draftNum : budgeted}
                                    size={64}
                                    strokeWidth={5}
                                />
                                <div className="flex-1 grid grid-cols-2 gap-3">
                                    <div>
                                        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Spent</div>
                                        <div className="text-base font-bold text-foreground tabular-nums">{formatCurrency(absSpent)}</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Available</div>
                                        <div className={cn(
                                            'text-base font-bold tabular-nums transition-colors duration-300',
                                            isOverspent ? 'text-destructive' : available === 0 ? 'text-muted-foreground' : 'text-success'
                                        )}>
                                            {formatCurrency(available)}
                                        </div>
                                    </div>
                                    {isRecurring && recurringConfig?.amount && (
                                        <div className="col-span-2">
                                            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Goal</div>
                                            <div className={cn('text-sm font-semibold tabular-nums', isUnderGoal ? 'text-warning' : 'text-muted-foreground')}>
                                                {formatCurrency(recurringConfig.amount)}
                                                {isUnderGoal && <span className="ml-1 text-warning text-[10px]">↑ needs more</span>}
                                            </div>
                                        </div>
                                    )}
                                    {isGoal ? (
                                        <div className="col-span-2">
                                            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Target Amount</div>
                                            <div className={cn('text-sm font-semibold tabular-nums text-muted-foreground')}>
                                                {formatCurrency(targetAmount)}
                                            </div>
                                        </div>
                                    ) : null}
                                </div>
                            </div>



                            {/* Large budget input */}
                            <div className="space-y-2">
                                <label
                                    htmlFor="sheet-budget-input"
                                    className="text-sm font-semibold text-muted-foreground uppercase tracking-wide"
                                >
                                    Budget for {category.name}
                                </label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-muted-foreground pointer-events-none">
                                        $
                                    </div>
                                    <input
                                        ref={inputRef}
                                        id="sheet-budget-input"
                                        type="number"
                                        inputMode="decimal"
                                        value={draft}
                                        onChange={(e) => setDraft(e.target.value)}
                                        placeholder="0.00"
                                        aria-describedby="sheet-available"
                                        className={cn(
                                            'w-full h-16 rounded-2xl border-2 pl-10 pr-4 text-3xl font-bold text-right tabular-nums',
                                            'bg-background text-foreground',
                                            'outline-none transition-colors duration-200',
                                            '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none',
                                            isUnderGoal ? 'border-warning focus:border-warning ring-2 ring-warning/20' :
                                                isOverspent ? 'border-destructive focus:border-destructive ring-2 ring-destructive/20' :
                                                    'border-border focus:border-primary ring-2 ring-primary/10'
                                        )}
                                    />
                                </div>
                                <div id="sheet-available" className="sr-only">
                                    {isOverspent
                                        ? `Overspent by ${formatCurrency(Math.abs(available))}`
                                        : `${formatCurrency(available)} will remain available`}
                                </div>
                            </div>

                            {/* Actions row */}
                            <div className="flex gap-3">
                                {isRecurring && !isPaid && (
                                    <button
                                        onClick={() => { onMarkPaid(); onClose(); }}
                                        className="flex-1 h-12 rounded-2xl bg-primary/10 text-primary font-semibold text-sm hover:bg-primary/20 transition-colors flex items-center justify-center gap-2 active:scale-[0.97]"
                                    >
                                        <CheckCircle2 className="w-4 h-4" />
                                        Mark Paid
                                    </button>
                                )}
                                {isPaid && (
                                    <div className="flex-1 h-12 rounded-2xl bg-success/10 flex items-center justify-center gap-2 text-success text-sm font-semibold">
                                        <CheckCircle2 className="w-4 h-4" />
                                        Paid this month
                                    </div>
                                )}
                                <button
                                    onClick={handleCommit}
                                    className={cn(
                                        'flex-1 h-12 rounded-2xl font-semibold text-base transition-all active:scale-[0.97]',
                                        'bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20',
                                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
                                    )}
                                >
                                    Save
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
