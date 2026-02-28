// src/components/modules/finance/budget/EditableBudgetCell.tsx
// Click/tap to reveal input. Text otherwise. Full keyboard navigation support.
// Tab → next row's cell, Arrow Up/Down → navigate rows, Enter → edit, Esc → cancel.
//
// FIX LOG:
// - Removed onFocus={startEditing} — it caused a re-entry loop when blur from the
//   input re-focused the button, immediately re-opening editing mode.
// - Added `displayValue` local state for optimistic display: the shown value updates
//   immediately when committed rather than waiting for the parent to propagate via Yjs.
// - `onBlur` is now guarded with a `isSaving` ref to prevent double-commits.

import { useState, useRef, useEffect, useCallback, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { formatCurrency } from '../../../../lib/utils';

interface EditableBudgetCellProps {
    value: number;
    onChange: (val: string) => void;
    isUnderGoal?: boolean;
    isOverspent?: boolean;
    /** Called when user presses Tab or Enter — parent manages focus to next cell */
    onTabNext?: () => void;
    /** Called when user presses Arrow Up */
    onArrowUp?: () => void;
    /** Called when user presses Arrow Down */
    onArrowDown?: () => void;
    /** For programmatic focus: pass a ref to allow parent to call .focus() */
    inputRef?: React.RefObject<HTMLInputElement | null>;
    className?: string;
    showSaveFeedback?: boolean;
}

export function EditableBudgetCell({
    value,
    onChange,
    isUnderGoal = false,
    isOverspent = false,
    onTabNext,
    onArrowUp,
    onArrowDown,
    inputRef: externalInputRef,
    className,
    showSaveFeedback = true,
}: EditableBudgetCellProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [draft, setDraft] = useState('');
    const [displayValue, setDisplayValue] = useState<number>(value);
    const [showCheck, setShowCheck] = useState(false);
    const internalRef = useRef<HTMLInputElement>(null);
    const activeRef = externalInputRef ?? internalRef;
    const isSavingRef = useRef(false); // guard against double-commit on blur
    const cellId = useId();

    // Sync display value with parent when it updates (e.g., real-time Yjs sync from partner)
    useEffect(() => {
        if (!isEditing) {
            setDisplayValue(value);
        }
    }, [value, isEditing]);

    // NOTE: We do NOT use useEffect to focus the input — by the time useEffect fires
    // with AnimatePresence, the input may not be in the DOM yet (especially with mode="wait").
    // Instead, we use a ref callback directly on motion.input (see below).

    const startEditing = useCallback(() => {
        setDraft(displayValue === 0 ? '' : displayValue.toString());
        setIsEditing(true);
        isSavingRef.current = false;
    }, [displayValue]);

    const commitEdit = useCallback(() => {
        if (isSavingRef.current) return; // Guard against blur firing after explicit commit
        isSavingRef.current = true;
        setIsEditing(false);

        const numVal = parseFloat(draft) || 0;
        if (numVal !== displayValue) {
            setDisplayValue(numVal); // Optimistic — don't wait for Yjs round-trip
            onChange(draft === '' ? '0' : draft);
            if (showSaveFeedback) {
                setShowCheck(true);
                setTimeout(() => setShowCheck(false), 1200);
            }
        }
    }, [draft, displayValue, onChange, showSaveFeedback]);

    const cancelEdit = useCallback(() => {
        isSavingRef.current = true;
        setIsEditing(false);
        setDraft('');
    }, []);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            commitEdit();
            // Tab to next after a brief delay so the blur doesn't re-fire
            setTimeout(() => { isSavingRef.current = false; onTabNext?.(); }, 50);
        } else if (e.key === 'Escape') {
            e.preventDefault();
            cancelEdit();
        } else if (e.key === 'Tab') {
            e.preventDefault();
            commitEdit();
            setTimeout(() => { isSavingRef.current = false; onTabNext?.(); }, 50);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            commitEdit();
            setTimeout(() => { isSavingRef.current = false; onArrowUp?.(); }, 50);
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            commitEdit();
            setTimeout(() => { isSavingRef.current = false; onArrowDown?.(); }, 50);
        }
    };

    const displayBorderColor = isOverspent
        ? 'border-destructive/40'
        : isUnderGoal
            ? 'border-warning/40'
            : 'border-transparent';

    const editingBorderColor = isOverspent
        ? 'border-destructive focus:ring-destructive/30'
        : isUnderGoal
            ? 'border-warning focus:ring-warning/30'
            : 'border-primary focus:ring-primary/20';

    return (
        <div className={cn('relative flex items-center justify-end gap-2', className)}>
            {/*
              Fixed-size overlay: both button and input are absolute inside here so they
              stack on top of each other during the AnimatePresence crossfade rather than
              sitting side-by-side in the flex row (which caused the layout jump).
            */}
            <div className="relative w-[120px] h-11 md:h-9 shrink-0">
                <AnimatePresence>
                    {isEditing ? (
                        <motion.input
                            key="input"
                            ref={(el) => {
                                if (el) {
                                    (activeRef as React.MutableRefObject<HTMLInputElement | null>).current = el;
                                    el.focus();
                                    el.select();
                                }
                            }}
                            id={cellId}
                            type="number"
                            inputMode="decimal"
                            value={draft}
                            onChange={(e) => setDraft(e.target.value)}
                            onBlur={commitEdit}
                            onKeyDown={handleKeyDown}
                            aria-label={`Budget amount for category, currently ${formatCurrency(displayValue)}`}
                            initial={{ opacity: 0, scale: 0.96 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.96 }}
                            transition={{ duration: 0.12 }}
                            className={cn(
                                'absolute inset-0 w-full h-full rounded-xl border text-right px-3 text-base md:text-sm font-semibold',
                                'bg-background text-foreground tabular-nums',
                                'outline-none ring-2 ring-offset-0 transition-colors',
                                '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none',
                                editingBorderColor
                            )}
                        />
                    ) : (
                        <motion.button
                            key="display"
                            onClick={startEditing}
                            onKeyDown={(e) => e.key === 'Enter' && startEditing()}
                            aria-label={`Budget amount: ${formatCurrency(displayValue)}. Press Enter or click to edit.`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.1 }}
                            className={cn(
                                'w-[120px] h-11 md:h-9 rounded-xl border text-right px-3',
                                'text-base md:text-sm font-semibold tabular-nums',
                                'hover:border-primary/40 hover:bg-accent/40',
                                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
                                'transition-all duration-150 cursor-text text-foreground',
                                isUnderGoal ? 'bg-warning/10' : 'bg-muted/40',
                                displayBorderColor
                            )}
                        >
                            {displayValue === 0 ? (
                                <span className="text-muted-foreground/50 font-medium text-sm">$0</span>
                            ) : (
                                formatCurrency(displayValue)
                            )}
                        </motion.button>
                    )}
                </AnimatePresence>
            </div>{/* end fixed-size overlay wrapper */}

            {/* Optimistic save checkmark — lives outside the fixed wrapper in the flex row */}
            <AnimatePresence>
                {showCheck && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        transition={{ type: 'spring', damping: 12, stiffness: 500 }}
                        className="text-success shrink-0"
                        aria-hidden="true"
                    >
                        <Check className="w-4 h-4" strokeWidth={3} />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
