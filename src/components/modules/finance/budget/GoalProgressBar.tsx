// src/components/modules/finance/budget/GoalProgressBar.tsx
// Linear progress bar for Savings Goals.
// Color: Primary when < 100%, Success when >= 100%.

import { cn, formatCurrency } from '../../../../lib/utils';
import { Target, Calendar as CalendarIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { parseISO, format } from 'date-fns';

interface GoalProgressBarProps {
    /** Goal target amount */
    targetAmount: number;
    /** Current available balance toward goal */
    savedAmount: number;
    /** Optional target date mapped from startDate */
    targetDate?: string;
    className?: string;
    showLabel?: boolean;
}

export function GoalProgressBar({
    targetAmount,
    savedAmount,
    targetDate,
    className,
    showLabel = true,
}: GoalProgressBarProps) {
    const pct = targetAmount > 0 ? Math.min((Math.max(0, savedAmount) / targetAmount) * 100, 100) : 0;
    const isMet = pct >= 100;

    let parsedDate = null;
    if (targetDate) {
        const parsed = parseISO(targetDate);
        if (!isNaN(parsed.getTime())) {
            parsedDate = parsed;
        }
    }

    return (
        <div className={cn('flex flex-col gap-2 w-full', className)}>
            {/* Top Row: "$1,500 / $3,000 Saved" - "50%" */}
            {showLabel && (
                <div className="flex items-center justify-between text-xs font-medium w-full mt-1">
                    <div className="flex items-center gap-1.5 text-foreground/80">
                        <span className={isMet ? 'text-success' : 'text-foreground'}>{formatCurrency(savedAmount)}</span>
                        <span className="text-muted-foreground/60">/</span>
                        <span className="text-muted-foreground">{formatCurrency(targetAmount)}</span>
                        <span className="text-muted-foreground">saved</span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] font-bold tabular-nums shrink-0">
                        {isMet && <Target className="w-3 h-3 text-success shrink-0" />}
                        <span className={isMet ? 'text-success' : 'text-primary/90'}>{Math.round(pct)}%</span>
                    </div>
                </div>
            )}

            {/* Progress Bar Track */}
            <div
                role="progressbar"
                aria-valuenow={pct}
                aria-valuemin={0}
                aria-valuemax={100}
                className="relative w-full h-2 rounded-full overflow-hidden bg-primary/10 shadow-inner"
            >
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
                    className={cn(
                        'absolute left-0 top-0 h-full rounded-full',
                        isMet ? 'bg-success' : 'bg-primary'
                    )}
                />
            </div>

            {/* Bottom Row / Meta: Target Date */}
            {parsedDate && showLabel && (
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/70 font-medium">
                    <CalendarIcon className="w-3 h-3" />
                    Target: {format(parsedDate, 'MMM d, yyyy')}
                </div>
            )}
        </div>
    );
}
