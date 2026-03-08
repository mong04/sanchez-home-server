// src/components/modules/finance/budget/BudgetProgressRing.tsx
// Circular SVG progress ring for tablet cards and BudgetBottomSheet.
// Small, glanceable, no external deps.

import { cn } from '../../../../lib/utils';

interface BudgetProgressRingProps {
    spent: number;
    budgeted: number;
    /** Outer diameter in pixels */
    size?: number;
    /** Stroke width in pixels */
    strokeWidth?: number;
    className?: string;
}

export function BudgetProgressRing({
    spent,
    budgeted,
    size = 48,
    strokeWidth = 4,
    className,
}: BudgetProgressRingProps) {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const pct = budgeted > 0 ? Math.min(spent / budgeted, 1) : 0;
    const offset = circumference * (1 - pct);

    const isOverspent = spent > budgeted && budgeted > 0;
    const isNearLimit = pct >= 0.8 && !isOverspent;

    const ringColor = isOverspent
        ? 'stroke-destructive'
        : isNearLimit
            ? 'stroke-warning'
            : 'stroke-primary/30 dark:stroke-primary/40';

    const displayPct = budgeted > 0 ? Math.round(pct * 100) : 0;

    return (
        <div
            className={cn('relative shrink-0', className)}
            style={{ width: size, height: size }}
            role="img"
            aria-label={`${displayPct}% of budget used`}
        >
            <svg
                width={size}
                height={size}
                viewBox={`0 0 ${size} ${size}`}
                className="-rotate-90"
                aria-hidden="true"
            >
                {/* Track */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    strokeWidth={strokeWidth}
                    className={cn(
                        'transition-all duration-500',
                        isOverspent ? 'stroke-destructive/15' :
                            isNearLimit ? 'stroke-warning/15' :
                                'stroke-muted'
                    )}
                />
                {/* Fill */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    className={cn('transition-all duration-700 ease-out', ringColor)}
                />
            </svg>
            {/* Center percentage */}
            <div className="absolute inset-0 flex items-center justify-center">
                <span
                    className={cn(
                        'font-bold tabular-nums leading-none',
                        size >= 56 ? 'text-xs' : 'text-[9px]',
                        isOverspent ? 'text-destructive' :
                            isNearLimit ? 'text-warning' :
                                'text-success'
                    )}
                >
                    {displayPct}%
                </span>
            </div>
        </div>
    );
}
