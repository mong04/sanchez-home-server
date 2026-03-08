// src/components/modules/finance/budget/BudgetCategoryRow.tsx
// Desktop table row with inline PredictiveEmojiBar popover for quick icon changes.
// Keyboard-navigable: Tab advances budget cell to next row, arrows navigate rows.

import { useRef, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit2, Trash2, CheckCircle2 } from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { formatCurrency } from '../../../../lib/utils';
import { CategoryIcon } from '../../../common/CategoryIcon';
import { PredictiveEmojiBar } from '../../../common/PredictiveEmojiBar';
import { BudgetProgressBar } from './BudgetProgressBar';
import { GoalProgressBar } from './GoalProgressBar';
import { EditableBudgetCell } from './EditableBudgetCell';
import type { CategoryRecord } from '../../../../types/pocketbase';
import type { RecurringConfig } from '../../../../store/useRecurringStore';

interface BudgetCategoryRowProps {
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
    /** Controls which row's icon popover is visible (null = none) */
    iconPopoverCatId: string | null;
    /** Ref for outside-click detection of the popover */
    iconPopoverRef: React.RefObject<HTMLDivElement | null>;
    /** Toggle popover for this row */
    onIconClick: (catId: string) => void;
    /** Called when user picks an emoji from the predictive bar or full picker */
    onIconSelect: (catId: string, emoji: string) => void;
    onAllocationChange: (catId: string, val: string) => void;
    onEditName: (cat: CategoryRecord) => void;
    onDelete: (catId: string) => void;
    onMarkPaid: (cat: CategoryRecord) => void;
    onFix: (cat: CategoryRecord) => void;
    rowIndex: number;
    totalRows: number;
    onFocusRow: (index: number) => void;
    month: string;
}

export const BudgetCategoryRow = memo(function BudgetCategoryRow({
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
    iconPopoverCatId,
    iconPopoverRef,
    onIconClick,
    onIconSelect,
    onAllocationChange,
    onEditName,
    onDelete,
    onMarkPaid,
    onFix,
    rowIndex,
    totalRows,
    onFocusRow,
}: BudgetCategoryRowProps) {
    const budgetInputRef = useRef<HTMLInputElement>(null);

    const handleTabNext = () => {
        if (rowIndex < totalRows - 1) onFocusRow(rowIndex + 1);
    };
    const handleArrowUp = () => {
        if (rowIndex > 0) onFocusRow(rowIndex - 1);
    };
    const handleArrowDown = () => {
        if (rowIndex < totalRows - 1) onFocusRow(rowIndex + 1);
    };

    return (
        <motion.div
            key={cat.id}
            layout={false}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.15 }}
            role="row"
            className={cn(
                'group grid grid-cols-12 gap-4 px-4 py-3 items-center border-b border-border/40 transition-colors duration-200 relative',
                iconPopoverCatId === cat.id && 'z-20',
                isOverspent ? 'bg-destructive/5 hover:bg-destructive/8' :
                    isUnderGoal ? 'bg-warning/5 hover:bg-warning/8' :
                        'hover:bg-accent/40'
            )}
        >
            {/* Col 1–4: Category icon + name + progress bar */}
            <div role="gridcell" className="col-span-4 flex items-center gap-3 min-w-0">
                {/* Icon with PredictiveEmojiBar popover — quick, contextual icon picker */}
                <div className="relative shrink-0" ref={iconPopoverCatId === cat.id ? iconPopoverRef : undefined}>
                    <CategoryIcon
                        categoryName={cat.name}
                        emojiOverride={cat.icon}
                        className="w-9 h-9 shadow-sm cursor-pointer hover:scale-105 active:scale-95 transition-transform"
                        emojiClassName="text-lg"
                        onClick={() => onIconClick(cat.id)}
                    />
                    {/* Inline emoji popover — PredictiveEmojiBar renders 5 smart suggestions + a "More"
                        button that opens the full EmojiPickerModal. Modal uses createPortal(document.body)
                        so it correctly escapes this small popover container. */}
                    <AnimatePresence>
                        {iconPopoverCatId === cat.id && (
                            <motion.div
                                initial={{ opacity: 0, y: 4, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 4, scale: 0.95 }}
                                transition={{ duration: 0.14 }}
                                className="absolute left-0 top-full mt-2 z-[9999] bg-card border border-border rounded-2xl shadow-xl p-2"
                            >
                                <PredictiveEmojiBar
                                    searchTerm={cat.name}
                                    currentEmoji={cat.icon}
                                    onSelect={(emoji) => onIconSelect(cat.id, emoji)}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="flex flex-col min-w-0 flex-1">
                    <span className="font-medium text-sm text-foreground leading-tight break-words line-clamp-2">{cat.name}</span>
                    {isGoal ? (
                        <GoalProgressBar targetAmount={targetAmount} savedAmount={finalAvailable} className="mt-1" />
                    ) : (
                        <BudgetProgressBar spent={Math.abs(activity)} budgeted={budgeted} showLabel className="mt-1 pr-2" />
                    )}
                    {/* Collapsed Zen Subtitle */}
                    {(isRecurring || isGoal) && (
                        <div className="text-[11px] text-muted-foreground/90 mt-0.5">
                            {isRecurring && recurringConfig?.amount && (
                                <span className={cn(isUnderGoal && 'text-warning font-medium')}>
                                    {dueText || 'Bill'} ({formatCurrency(recurringConfig.amount)})
                                </span>
                            )}
                            {isGoal && targetAmount > 0 && !isRecurring && (
                                <span>Target: {formatCurrency(targetAmount)}</span>
                            )}
                        </div>
                    )}
                </div>

                {/* Hover actions */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-0.5 shrink-0">
                    <button
                        onClick={() => onEditName(cat)}
                        aria-label={`Edit category ${cat.name}`}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                        <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={() => onDelete(cat.id)}
                        aria-label={`Delete category ${cat.name}`}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            {/* Col 5–7: Budgeted (editable) */}
            <div role="gridcell" className="col-span-3 flex justify-end">
                <EditableBudgetCell
                    value={budgeted}
                    onChange={(val) => onAllocationChange(cat.id, val)}
                    isUnderGoal={isUnderGoal}
                    isOverspent={isOverspent}
                    onTabNext={handleTabNext}
                    onArrowUp={handleArrowUp}
                    onArrowDown={handleArrowDown}
                    inputRef={budgetInputRef}
                />
            </div>

            {/* Col 8–9: Spent */}
            <div role="gridcell" className="col-span-2 flex justify-end items-center">
                <span className="text-sm text-muted-foreground tabular-nums font-medium">
                    {formatCurrency(activity)}
                </span>
            </div>

            {/* Col 10–12: Available + actions */}
            <div role="gridcell" className="col-span-3 flex flex-col items-end gap-1 pr-1">
                <div className="flex items-center gap-2">
                    <motion.span
                        key={finalAvailable}
                        initial={{ opacity: 0.6, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.18 }}
                        className={cn(
                            'text-base font-semibold tabular-nums transition-colors',
                            finalAvailable < 0 ? 'text-destructive' :
                                finalAvailable > 0 ? 'text-success' :
                                    'text-muted-foreground'
                        )}
                        aria-live="polite"
                        aria-atomic="true"
                    >
                        {formatCurrency(finalAvailable)}
                    </motion.span>

                    {isOverspent && (
                        <button
                            onClick={() => onFix(cat)}
                            aria-label={`Cover overspending in ${cat.name}`}
                            className="text-[10px] bg-primary text-primary-foreground px-3 py-1.5 rounded-full font-bold hover:bg-primary/90 transition-colors flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring shadow-sm"
                        >
                            Cover
                        </button>
                    )}
                </div>

                {/* Recurring actions */}
                {isRecurring && !isOverspent && (
                    <div className="flex items-center gap-1.5">
                        {dueText && !isPaid && (
                            <span className="text-[10px] text-muted-foreground">{dueText}</span>
                        )}
                        {!isPaid && (
                            <button
                                onClick={() => onMarkPaid(cat)}
                                className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                                Mark Paid
                            </button>
                        )}
                        {isPaid && (
                            <span className="text-[10px] flex items-center gap-1 text-success font-bold">
                                <CheckCircle2 className="w-3 h-3" /> Paid
                            </span>
                        )}
                    </div>
                )}
            </div>
        </motion.div>
    );
});
