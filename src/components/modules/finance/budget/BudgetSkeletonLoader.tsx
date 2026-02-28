// src/components/modules/finance/budget/BudgetSkeletonLoader.tsx
// Skeleton loading state for the budget grid during initial data fetch.

import { cn } from '../../../../lib/utils';

function SkeletonRow({ wide = false }: { wide?: boolean }) {
    return (
        <div className={cn('flex items-center gap-3 px-4 py-3 border-b border-border/50', wide && 'gap-4')}>
            {/* Icon */}
            <div className="w-10 h-10 rounded-2xl bg-muted animate-pulse shrink-0" />
            {/* Name + bar */}
            <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                <div className="h-3.5 bg-muted animate-pulse rounded-full w-28" />
                <div className="h-1.5 bg-muted/60 animate-pulse rounded-full w-full" />
            </div>
            {/* Budget cell */}
            <div className="h-9 w-24 bg-muted animate-pulse rounded-xl shrink-0" />
            {/* Spent */}
            <div className="h-4 w-16 bg-muted/60 animate-pulse rounded-full shrink-0 hidden md:block" />
            {/* Available */}
            <div className="h-5 w-20 bg-muted animate-pulse rounded-full shrink-0" />
        </div>
    );
}

function SkeletonGroupHeader() {
    return (
        <div className="flex items-center gap-3 px-4 py-2.5 bg-muted/50 border-b border-border/60">
            <div className="w-4 h-4 bg-muted animate-pulse rounded" />
            <div className="w-5 h-5 bg-muted animate-pulse rounded" />
            <div className="h-3 w-28 bg-muted animate-pulse rounded-full" />
        </div>
    );
}

interface BudgetSkeletonLoaderProps {
    rows?: number;
    className?: string;
}

export function BudgetSkeletonLoader({ rows = 6, className }: BudgetSkeletonLoaderProps) {
    return (
        <div
            className={cn('flex flex-col divide-y divide-border', className)}
            aria-busy="true"
            aria-label="Loading budget categories"
        >
            <SkeletonGroupHeader />
            {Array.from({ length: Math.ceil(rows / 2) }).map((_, i) => (
                <SkeletonRow key={`a-${i}`} />
            ))}
            <SkeletonGroupHeader />
            {Array.from({ length: Math.floor(rows / 2) }).map((_, i) => (
                <SkeletonRow key={`b-${i}`} />
            ))}
        </div>
    );
}
