// src/components/modules/finance/budget/BudgetSummaryBar.tsx
// Sticky summary bar showing Total Budgeted | Total Spent | To Be Budgeted.
// Visible on all breakpoints, sticks below the column header row.
// TBB is the hero number — large, color-coded, animated.

import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../../lib/utils';
import { formatCurrency } from '../../../../lib/utils';

interface BudgetSummaryBarProps {
    totalBudgeted: number;
    totalSpent: number;
    toBeBudgeted: number;
    className?: string;
}

function AnimatedNumber({ value, className }: { value: number; className?: string }) {
    return (
        <AnimatePresence mode="popLayout">
            <motion.span
                key={value}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
                className={cn('block tabular-nums font-bold', className)}
            >
                {formatCurrency(value)}
            </motion.span>
        </AnimatePresence>
    );
}

export function BudgetSummaryBar({
    totalBudgeted,
    totalSpent,
    toBeBudgeted,
    className,
}: BudgetSummaryBarProps) {
    const tbbPositive = toBeBudgeted >= 0;
    const tbbExact = toBeBudgeted === 0;

    return (
        <motion.div
            layout
            className={cn(
                'w-full grid grid-cols-3 gap-0 border-b border-border',
                'bg-card/95 backdrop-blur-sm shadow-sm',
                className
            )}
            aria-label="Budget summary"
            role="status"
            aria-live="polite"
        >
            {/* Total Budgeted */}
            <div className="flex flex-col items-center justify-center px-2 py-3 md:py-4 border-r border-border/50">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">
                    Budgeted
                </span>
                <AnimatedNumber
                    value={totalBudgeted}
                    className="text-sm md:text-base text-foreground"
                />
            </div>

            {/* Total Spent */}
            <div className="flex flex-col items-center justify-center px-2 py-3 md:py-4 border-r border-border/50">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">
                    Spent
                </span>
                <AnimatedNumber
                    value={Math.abs(totalSpent)}
                    className="text-sm md:text-base text-muted-foreground"
                />
            </div>

            {/* TBB Hero */}
            <div
                className={cn(
                    'flex flex-col items-center justify-center px-2 py-3 md:py-4 transition-colors duration-500',
                    tbbExact
                        ? 'bg-success/10'
                        : tbbPositive
                            ? ''
                            : 'bg-destructive/5'
                )}
            >
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">
                    <span className="hidden sm:inline">To Be Budgeted</span>
                    <span className="sm:hidden">Left</span>
                </span>
                <AnimatedNumber
                    value={toBeBudgeted}
                    className={cn(
                        'text-base md:text-lg lg:text-xl',
                        tbbExact ? 'text-success' :
                            tbbPositive ? 'text-success' :
                                'text-destructive'
                    )}
                />
                {tbbExact && (
                    <motion.span
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-[9px] text-success font-semibold mt-0.5 uppercase tracking-wide"
                    >
                        ✓ All assigned!
                    </motion.span>
                )}
            </div>
        </motion.div>
    );
}
