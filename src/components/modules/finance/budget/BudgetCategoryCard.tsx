// src/components/modules/finance/budget/BudgetCategoryCard.tsx
// Tablet & Mobile category card.
// Tablet: Shows progress ring + inline budget input (expanded tap area, 56px height).
// Mobile: Tap-to-open-sheet card. No inline editing.
// Uses `isMobile` prop to choose behavior.

import { useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, CheckCircle2, Trash2, Edit2, MoreHorizontal } from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { formatCurrency } from '../../../../lib/utils';
import { CategoryIcon } from '../../../common/CategoryIcon';
import { Button } from '../../../common/Button';
import { BudgetProgressBar } from './BudgetProgressBar';
import { GoalProgressBar } from './GoalProgressBar';
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
    isGoal: boolean;
    targetAmount: number;
    goalProgress: number;
    /** Mobile = tap opens bottom sheet. Tablet = shows inline edit input. */
    isMobile: boolean;
    onAllocationChange: (catId: string, val: string) => void;
    onTap: (cat: CategoryRecord) => void;
    onDelete: (catId: string) => void;
    onMarkPaid: (cat: CategoryRecord) => void;
    onFix: (cat: CategoryRecord) => void;
    onEditName: (cat: CategoryRecord) => void;
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
    isGoal,
    targetAmount,
    isMobile,
    onAllocationChange,
    onTap,
    onDelete,
    onMarkPaid,
    onFix,
    onEditName,
}: BudgetCategoryCardProps) {
    const [menuOpen, setMenuOpen] = useState(false);

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
                    <div className="flex items-center gap-1.5 flex-wrap text-xs text-muted-foreground mt-0.5">
                        {isRecurring ? (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-px rounded bg-muted text-[9px] uppercase tracking-wider font-semibold">
                                <Calendar className="w-2.5 h-2.5" />
                            </span>
                        ) : isGoal ? (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-px rounded bg-primary/10 text-[9px] text-primary uppercase tracking-wider font-semibold">
                                <span>Goal</span>
                            </span>
                        ) : null}
                        <span>
                            {isGoal ? `Saved ${formatCurrency(finalAvailable)}` : `Spent ${formatCurrency(absSpent)}`}
                            {isRecurring && recurringConfig?.amount ? ` · Bill ${formatCurrency(recurringConfig.amount)}` : ''}
                            {isGoal && targetAmount > 0 ? ` · Target ${formatCurrency(targetAmount)}` : ''}
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
            {isGoal ? (
                <GoalProgressBar targetAmount={targetAmount} savedAmount={finalAvailable} targetDate={cat.startDate} className="mt-3" />
            ) : (
                <BudgetProgressBar spent={absSpent} budgeted={budgeted} showLabel className="mt-3" />
            )}

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
            {isMobile ? (
                <div className="flex items-center h-8 mt-3 relative">
                    {/* Primary visible state info on the left */}
                    <div className="flex-1 flex gap-2">
                        {isOverspent ? (
                            <button
                                onClick={() => onFix(cat)}
                                className="flex items-center gap-1.5 text-xs bg-primary text-primary-foreground px-4 py-1.5 rounded-full font-bold hover:bg-primary/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring shadow-sm"
                            >
                                Cover Overspend
                            </button>
                        ) : isPaid ? (
                            <span className="text-xs flex items-center gap-1 text-success font-semibold py-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Paid
                            </span>
                        ) : null}
                    </div>

                    {/* Sliding Menu on the right */}
                    <div className="flex justify-end relative z-10 w-[140px]">
                        <AnimatePresence mode="wait">
                            {menuOpen ? (
                                <motion.div
                                    key="menu"
                                    initial={{ width: 0, opacity: 0 }}
                                    animate={{ width: 'auto', opacity: 1 }}
                                    exit={{ width: 0, opacity: 0 }}
                                    className="flex bg-muted rounded-full border border-border shadow-sm p-[2px] overflow-hidden absolute right-0 bottom-0"
                                >
                                    {isRecurring && !isPaid && !isOverspent && (
                                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full hover:bg-background text-primary" onClick={() => { onMarkPaid(cat); setMenuOpen(false); }}>
                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                        </Button>
                                    )}
                                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full hover:bg-background text-muted-foreground mx-0.5" onClick={() => { onEditName(cat); setMenuOpen(false); }}>
                                        <Edit2 className="w-3.5 h-3.5" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full hover:bg-background text-destructive mr-0.5" onClick={() => { onDelete(cat.id); setMenuOpen(false); }}>
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                    <div className="w-[1px] bg-border/50 mx-1 my-1"></div>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full bg-background border border-border shadow-sm text-foreground active:scale-95 transition-transform" onClick={() => setMenuOpen(false)}>
                                        <MoreHorizontal className="w-4 h-4" />
                                    </Button>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="toggle"
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                    className="absolute right-0 bottom-0"
                                >
                                    <Button variant="ghost" size="sm" className="h-8 px-2.5 rounded-full text-muted-foreground active:bg-muted border border-transparent hover:border-border hover:bg-muted/50" onClick={(e) => { e.stopPropagation(); setMenuOpen(true); }}>
                                        <MoreHorizontal className="w-4 h-4" />
                                    </Button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            ) : (
                <div className="flex items-center gap-2 mt-3">
                    {isOverspent && (
                        <button
                            onClick={() => onFix(cat)}
                            aria-label={`Cover overspending in ${cat.name}`}
                            className="flex items-center gap-1.5 text-xs bg-primary text-primary-foreground px-4 py-2 rounded-full font-bold hover:bg-primary/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring shadow-sm"
                        >
                            Cover Overspend
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
                    <div className="ml-auto flex gap-1">
                        <button
                            onClick={() => onEditName(cat)}
                            aria-label={`Edit ${cat.name}`}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                            <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => onDelete(cat.id)}
                            aria-label={`Delete ${cat.name}`}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </motion.div>
    );
});
