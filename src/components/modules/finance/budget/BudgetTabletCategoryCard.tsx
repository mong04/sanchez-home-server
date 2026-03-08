// src/components/modules/finance/budget/BudgetTabletCategoryCard.tsx
// Dedicated tablet (768–1023px) card-row for the kitchen iPad.
// Wide horizontal layout with:
// - 56–64px touch targets
// - Always-visible progress bar + circular progress ring
// - Inline EditableBudgetCell (click-to-edit, not tap-to-sheet)
// - Inline edit-name + delete actions
// - Larger typography and generous padding
//
// Reuses shared components: CategoryIcon, BudgetProgressBar, BudgetProgressRing,
// EditableBudgetCell. Zero logic duplication.

import { memo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { CheckCircle2, Trash2, Edit2 } from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { formatCurrency } from '../../../../lib/utils';
import { CategoryIcon } from '../../../common/CategoryIcon';
import { BudgetProgressBar } from './BudgetProgressBar';
import { GoalProgressBar } from './GoalProgressBar';
import { BudgetProgressRing } from './BudgetProgressRing';
import { EditableBudgetCell } from './EditableBudgetCell';
import type { CategoryRecord } from '../../../../types/pocketbase';
import type { RecurringConfig } from '../../../../store/useRecurringStore';

interface BudgetTabletCategoryCardProps {
    category: CategoryRecord;
    budgeted: number;
    activity: number;
    finalAvailable: number;
    isOverspent: boolean;
    isUnderGoal: boolean;
    isRecurring: boolean;
    isPaid: boolean;
    dueText: string;
    recurringConfig: RecurringConfig | null;
    isGoal: boolean;
    targetAmount: number;
    goalProgress: number;
    onAllocationChange: (catId: string, val: string) => void;
    onEditName: (cat: CategoryRecord) => void;
    onDelete: (catId: string) => void;
    onMarkPaid: (cat: CategoryRecord) => void;
    onFix: (cat: CategoryRecord) => void;
}

export const BudgetTabletCategoryCard = memo(function BudgetTabletCategoryCard({
    category: cat,
    budgeted,
    activity,
    finalAvailable,
    isOverspent,
    isUnderGoal,
    isRecurring,
    isPaid,
    dueText,
    recurringConfig,
    isGoal,
    targetAmount,
    onAllocationChange,
    onEditName,
    onDelete,
    onMarkPaid,
    onFix,
}: BudgetTabletCategoryCardProps) {
    const prefersReduced = useReducedMotion();

    return (
        <motion.div
            layout={false}
            initial={prefersReduced ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReduced ? { opacity: 0 } : { opacity: 0, height: 0 }}
            transition={{ duration: prefersReduced ? 0 : 0.18 }}
            className={cn(
                // Wide card-row with generous padding and touch-friendly height
                'rounded-2xl border p-5 transition-colors duration-200',
                'bg-card border-border shadow-sm',
                'min-h-[64px]', // 64px minimum touch target
                isOverspent && 'border-destructive/30 bg-destructive/5',
                isUnderGoal && !isOverspent && 'border-warning/30'
            )}
            aria-label={`${cat.name}: budgeted ${formatCurrency(budgeted)}, spent ${formatCurrency(Math.abs(activity))}, available ${formatCurrency(finalAvailable)}`}
        >
            {/* ─── Row 1: Icon + Name + Ring + Available ─── */}
            <div className="flex items-center gap-3 md:gap-4">
                {/* Category icon — large touch target */}
                <CategoryIcon
                    categoryName={cat.name}
                    emojiOverride={cat.icon}
                    className="w-12 h-12 md:w-14 md:h-14 shadow-sm shrink-0"
                    emojiClassName="text-xl md:text-2xl"
                />

                {/* Name + metadata */}
                <div className="flex flex-col min-w-0 flex-1 gap-0.5">
                    <span className="font-bold text-base md:text-lg text-foreground truncate leading-tight mt-0.5">
                        {cat.name}
                    </span>
                    {/* Collapsed Zen Subtitle */}
                    {(isRecurring || isGoal) && (
                        <div className="text-xs md:text-sm text-muted-foreground/90 mt-0.5">
                            {isRecurring && recurringConfig?.amount && (
                                <span>{dueText || 'Bill'} ({formatCurrency(recurringConfig.amount)})</span>
                            )}
                            {isGoal && targetAmount > 0 && !isRecurring && (
                                <span>Target: {formatCurrency(targetAmount)}</span>
                            )}
                        </div>
                    )}
                </div>

                {/* Progress ring + Available */}
                <div className="flex items-center gap-2 md:gap-4 shrink-0">
                    <BudgetProgressRing
                        spent={Math.abs(activity)}
                        budgeted={budgeted}
                        size={48}
                        strokeWidth={4}
                    />
                    <div className="flex flex-col items-end gap-0.5">
                        <motion.span
                            key={finalAvailable}
                            initial={prefersReduced ? false : { opacity: 0.7, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.18 }}
                            className={cn(
                                'font-bold text-lg md:text-xl tabular-nums',
                                finalAvailable < 0 ? 'text-destructive' :
                                    finalAvailable > 0 ? 'text-success' :
                                        'text-muted-foreground'
                            )}
                            aria-live="polite"
                        >
                            {formatCurrency(finalAvailable)}
                        </motion.span>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">
                            available
                        </span>
                    </div>
                </div>
            </div>

            {/* ─── Row 2: Progress bar ─── */}
            {isGoal ? (
                <GoalProgressBar targetAmount={targetAmount} savedAmount={finalAvailable} className="mt-4" />
            ) : (
                <BudgetProgressBar spent={Math.abs(activity)} budgeted={budgeted} showLabel className="mt-4" />
            )}

            {/* ─── Row 3: Inline budget input + Actions ─── */}
            <div className="flex items-center justify-between mt-4 gap-4">
                {/* Budget input — always visible, click-to-edit */}
                <div className="flex items-center gap-3 flex-1">
                    <label
                        htmlFor={`budget-tablet-${cat.id}`}
                        className="text-xs font-semibold text-muted-foreground uppercase tracking-wide shrink-0"
                    >
                        Budgeted
                    </label>
                    <EditableBudgetCell
                        value={budgeted}
                        onChange={(val) => onAllocationChange(cat.id, val)}
                        isUnderGoal={isUnderGoal}
                        isOverspent={isOverspent}
                        className="flex-1 max-w-[200px]"
                    />
                </div>

                {/* Action buttons — generous touch targets */}
                <div className="flex items-center gap-2">
                    {isOverspent && (
                        <button
                            onClick={() => onFix(cat)}
                            aria-label={`Cover overspending in ${cat.name}`}
                            className="flex items-center gap-1.5 text-xs md:text-sm bg-primary text-primary-foreground px-5 py-2 rounded-full font-bold hover:bg-primary/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[44px] shadow-sm"
                        >
                            Cover Overspend
                        </button>
                    )}
                    {isRecurring && !isPaid && !isOverspent && (
                        <button
                            onClick={() => onMarkPaid(cat)}
                            aria-label={`Mark ${cat.name} as paid`}
                            className="flex items-center gap-1.5 text-xs bg-primary/10 text-primary px-4 py-2 rounded-full font-semibold hover:bg-primary/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[40px]"
                        >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Mark Paid
                        </button>
                    )}
                    {isPaid && (
                        <span className="text-sm flex items-center gap-1 text-success font-semibold px-2">
                            <CheckCircle2 className="w-4 h-4" /> Paid
                        </span>
                    )}

                    {/* Edit name */}
                    <button
                        onClick={() => onEditName(cat)}
                        aria-label={`Edit ${cat.name}`}
                        className="p-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-w-[40px] min-h-[40px] flex items-center justify-center"
                    >
                        <Edit2 className="w-4 h-4" />
                    </button>

                    {/* Delete */}
                    <button
                        onClick={() => onDelete(cat.id)}
                        aria-label={`Delete ${cat.name}`}
                        className="p-2.5 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-w-[40px] min-h-[40px] flex items-center justify-center"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </motion.div>
    );
});
