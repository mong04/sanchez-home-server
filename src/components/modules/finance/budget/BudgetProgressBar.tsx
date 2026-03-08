// src/components/modules/finance/budget/BudgetProgressBar.tsx
// Linear progress bar for budget category rows.
// Color: green=healthy, amber=near limit (>80%), red=overspent.

import { cn } from '../../../../lib/utils';

interface BudgetProgressBarProps {
    /** Amount spent (absolute value, positive) */
    spent: number;
    /** Amount budgeted */
    budgeted: number;
    /** Optional extra class on the outer wrapper */
    className?: string;
    /** Show the percentage label inline */
    showLabel?: boolean;
}

function getBarColor(pct: number): string {
    if (pct >= 100) return 'bg-destructive';
    if (pct >= 80) return 'bg-warning';
    // Zen Palette: Muted, peaceful normal state instead of screaming green
    return 'bg-primary/30 dark:bg-primary/40';
}

function getTrackColor(pct: number): string {
    if (pct >= 100) return 'bg-destructive/15';
    if (pct >= 80) return 'bg-warning/15';
    return 'bg-muted';
}

export function BudgetProgressBar({
    spent,
    budgeted,
    className,
    showLabel = false,
}: BudgetProgressBarProps) {
    const pct = budgeted > 0 ? Math.min((spent / budgeted) * 100, 100) : 0;
    const overPct = budgeted > 0 ? Math.max(((spent - budgeted) / budgeted) * 100, 0) : 0;
    const isOverspent = spent > budgeted && budgeted > 0;
    const displayPct = budgeted > 0 ? Math.round((spent / budgeted) * 100) : 0;
    const barColor = getBarColor(displayPct);
    const trackColor = getTrackColor(displayPct);

    return (
        <div className={cn('flex items-center gap-2', className)}>
            <div
                role="progressbar"
                aria-valuenow={displayPct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${displayPct}% of budget used`}
                className={cn('relative flex-1 h-1.5 rounded-full overflow-hidden', trackColor)}
            >
                <div
                    className={cn(
                        'absolute left-0 top-0 h-full rounded-full transition-all duration-700 ease-out',
                        barColor
                    )}
                    style={{ width: `${pct}%` }}
                />
                {/* Overspent overflow indicator — red pulse at the right edge */}
                {isOverspent && (
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-destructive animate-pulse" />
                )}
            </div>
            {showLabel && (
                <span
                    className={cn(
                        'text-[10px] font-semibold tabular-nums shrink-0',
                        isOverspent ? 'text-destructive' :
                            displayPct >= 80 ? 'text-warning' :
                                'text-muted-foreground'
                    )}
                >
                    {overPct > 0 ? `+${Math.round(overPct)}%` : `${displayPct}%`}
                </span>
            )}
        </div>
    );
}
