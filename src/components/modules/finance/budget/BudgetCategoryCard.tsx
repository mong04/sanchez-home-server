// src/components/modules/finance/budget/BudgetCategoryCard.tsx
// Tablet & Mobile category card.
// Tablet: Shows progress ring + inline budget input (expanded tap area, 56px height).
// Mobile: Tap-to-open-sheet card. No inline editing.
// Uses `isMobile` prop to choose behavior.

import { memo } from 'react';
import { motion } from 'framer-motion';
import { Calendar, CheckCircle2, AlertTriangle, Trash2 } from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { formatCurrency } from '../../../../lib/utils';
import { CategoryIcon } from '../../../common/CategoryIcon';
import { BudgetProgressBar } from './BudgetProgressBar';
import { BudgetProgressRing } from './BudgetProgressRing';
import { EditableBudgetCell } from './EditableBudgetCell';
import type { CategoryRecord } from '../../../../types/pocketbase';
import type { RecurringConfig } from '../../../../store/useRecurringStore';

interface BudgetCategoryCardProps {
    category: CategoryRecord;
    budgeted: number;
    absSpent: number;
    finalAvailable: number;
    isOverspent: boolean;
    isUnderGoal: boolean;
    isRecurring: boolean;
    isPaid: boolean;
    dueText: string;
    recurringConfig: RecurringConfig | null;
    /** Mobile = tap opens bottom sheet. Tablet = shows inline edit input. */
    isMobile: boolean;
    onAllocationChange: (catId: string, val: string) => void;
    onTap: (cat: CategoryRecord) => void;
    onDelete: (catId: string) => void;
    onMarkPaid: (cat: CategoryRecord) => void;
    onFix: (cat: CategoryRecord) => void;
}

export const BudgetCategoryCard = memo(function BudgetCategoryCard({
    category: cat,
    budgeted,
    absSpent,
    finalAvailable,
    isOverspent,
    isUnderGoal,
    isRecurring,
    isPaid,
    dueText,
    recurringConfig,
    isMobile,
    onAllocationChange,
    onTap,
    onDelete,
    onMarkPaid,
    onFix,
}: BudgetCategoryCardProps) {
    return (
        <motion.div
            key={cat.id}
            layout={false}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }}
            className={cn(
                'rounded-2xl border p-4 transition-colors duration-200',
                'bg-card border-border shadow-sm',
                isOverspent && 'border-destructive/30 bg-destructive/5',
                isUnderGoal && !isOverspent && 'border-warning/30'
            )}
            aria-label={`${cat.name}: budgeted ${formatCurrency(budgeted)}, spent ${formatCurrency(absSpent)}, available ${formatCurrency(finalAvailable)}`}
        >
            {/* Top Row: Icon + Name + Available */}
            <div className="flex items-start gap-3">
                {/* Mobile: tap the whole card for the sheet, but we still need a way to tap icon */}
                {isMobile ? (
                    <button
                        onClick={() => onTap(cat)}
                        aria-label={`Open ${cat.name} budget editor`}
                        className="shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-2xl"
                    >
                        <CategoryIcon
                            categoryName={cat.name}
                            emojiOverride={cat.icon}
                            className="w-12 h-12 shadow-sm"
                            emojiClassName="text-2xl"
                        />
                    </button>
                ) : (
                    <CategoryIcon
                        categoryName={cat.name}
                        emojiOverride={cat.icon}
                        className="w-11 h-11 shadow-sm shrink-0"
                        emojiClassName="text-xl"
                    />
                )}

                <div className="flex flex-col min-w-0 flex-1 gap-0.5">
                    {/* Name — full row width */}
                    <span className="font-semibold text-foreground text-base leading-tight break-words line-clamp-2">{cat.name}</span>
                    {/* Metadata line: badge + spend + goal + due */}
                    <div className="flex items-center gap-1.5 flex-wrap text-xs text-muted-foreground">
                        {isRecurring && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-px rounded bg-muted text-[9px] uppercase tracking-wider font-semibold">
                                <Calendar className="w-2.5 h-2.5" />
                            </span>
                        )}
                        <span>
                            Spent {formatCurrency(absSpent)}
                            {isRecurring && recurringConfig?.amount ? ` · Goal ${formatCurrency(recurringConfig.amount)}` : ''}
                        </span>
                        {isRecurring && dueText && !isPaid && (
                            <span className="text-[10px] text-muted-foreground/80">· {dueText}</span>
                        )}
                    </div>
                </div>

                {/* Right side: ring (tablet) or available (both) */}
                <div className="flex flex-col items-end gap-1 shrink-0">
                    {/* Tablet gets progress ring */}
                    {!isMobile && (
                        <BudgetProgressRing
                            spent={absSpent}
                            budgeted={budgeted}
                            size={48}
                            strokeWidth={4}
                        />
                    )}
                    <motion.span
                        key={finalAvailable}
                        initial={{ opacity: 0.7, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.18 }}
                        className={cn(
                            'font-bold tabular-nums',
                            isMobile ? 'text-xl' : 'text-base',
                            finalAvailable < 0 ? 'text-destructive' :
                                finalAvailable > 0 ? 'text-success' :
                                    'text-muted-foreground'
                        )}
                        aria-live="polite"
                    >
                        {formatCurrency(finalAvailable)}
                    </motion.span>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wide">available</span>
                </div>
            </div>

            {/* Progress bar */}
            <BudgetProgressBar
                spent={absSpent}
                budgeted={budgeted}
                showLabel
                className="mt-3"
            />

            {/* Tablet: inline budget input */}
            {!isMobile && (
                <div className="flex items-center justify-between mt-3 gap-3">
                    <label
                        htmlFor={`budget-${cat.id}`}
                        className="text-xs font-semibold text-muted-foreground uppercase tracking-wide"
                    >
                        Budgeted
                    </label>
                    <EditableBudgetCell
                        value={budgeted}
                        onChange={(val) => onAllocationChange(cat.id, val)}
                        isUnderGoal={isUnderGoal}
                        isOverspent={isOverspent}
                        className="flex-1 justify-end"
                    />
                </div>
            )}

            {/* Mobile: tap to edit hint */}
            {isMobile && (
                <button
                    onClick={() => onTap(cat)}
                    className="mt-3 w-full h-11 rounded-xl border border-border bg-muted/40 hover:bg-muted/60 text-sm text-muted-foreground font-medium transition-colors active:scale-[0.98] flex items-center justify-between px-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label={`Edit budget for ${cat.name}: currently ${formatCurrency(budgeted)}`}
                >
                    <span>Budgeted</span>
                    <span className="font-semibold text-foreground tabular-nums">
                        {budgeted === 0 ? <span className="text-muted-foreground/60">Tap to set</span> : formatCurrency(budgeted)}
                    </span>
                </button>
            )}

            {/* Action buttons row */}
            <div className="flex items-center gap-2 mt-3">
                {isOverspent && (
                    <button
                        onClick={() => onFix(cat)}
                        aria-label={`Fix overspending in ${cat.name}`}
                        className="flex items-center gap-1.5 text-xs bg-destructive text-destructive-foreground px-3 py-1.5 rounded-full font-semibold hover:opacity-80 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                        <AlertTriangle className="w-3 h-3" /> Fix Overspend
                    </button>
                )}
                {isRecurring && !isPaid && !isOverspent && (
                    <button
                        onClick={() => onMarkPaid(cat)}
                        className="flex items-center gap-1.5 text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-full font-semibold hover:bg-primary/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                        <CheckCircle2 className="w-3 h-3" /> Mark Paid
                    </button>
                )}
                {isPaid && (
                    <span className="text-xs flex items-center gap-1 text-success font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Paid
                    </span>
                )}
                <div className="ml-auto">
                    <button
                        onClick={() => onDelete(cat.id)}
                        aria-label={`Delete ${cat.name}`}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </motion.div>
    );
});
