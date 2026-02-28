// src/components/modules/finance/budget/BudgetGroupHeader.tsx
// Collapsible category group header row (e.g. "Housing", "Food & Dining").
// Groups are defined locally by the client — no backend change required.
// Uses category name matching to auto-assign groups; ungrouped falls into "Other".

import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { formatCurrency } from '../../../../lib/utils';

export interface CategoryGroup {
    id: string;
    label: string;
    /** Emoji for the group */
    icon: string;
}

/** Default category groups — keywords that match category names (case-insensitive) */
export const DEFAULT_GROUPS: CategoryGroup[] = [
    { id: 'housing', label: 'Housing', icon: '🏠' },
    { id: 'food', label: 'Food & Dining', icon: '🍽️' },
    { id: 'transportation', label: 'Transportation', icon: '🚗' },
    { id: 'utilities', label: 'Utilities & Bills', icon: '⚡' },
    { id: 'health', label: 'Health & Wellness', icon: '💊' },
    { id: 'entertainment', label: 'Entertainment', icon: '🎬' },
    { id: 'savings', label: 'Savings & Goals', icon: '🎯' },
    { id: 'other', label: 'Everything Else', icon: '📦' },
];

/** Keyword map for auto-grouping categories */
const GROUP_KEYWORDS: Record<string, string[]> = {
    housing: ['rent', 'mortgage', 'hoa', 'home', 'housing', 'property', 'apartment'],
    food: ['grocer', 'food', 'dining', 'restaurant', 'lunch', 'coffee', 'meal', 'takeout', 'delivery'],
    transportation: ['gas', 'fuel', 'car', 'auto', 'uber', 'lyft', 'parking', 'transit', 'transport', 'commute'],
    utilities: ['electric', 'water', 'internet', 'phone', 'netflix', 'spotify', 'subscription', 'utility', 'bill', 'cable', 'streaming'],
    health: ['doctor', 'dentist', 'medical', 'health', 'gym', 'fitness', 'pharmacy', 'insurance', 'wellness'],
    entertainment: ['entertainment', 'fun', 'movie', 'game', 'hobby', 'vacation', 'travel', 'fun', 'adventure'],
    savings: ['saving', 'emergency', 'invest', 'retirement', 'goal', '401', 'ira', 'fund'],
};

/** Given a category name, returns the matching group id */
export function getGroupIdForCategory(categoryName: string): string {
    const lower = categoryName.toLowerCase();
    for (const [groupId, keywords] of Object.entries(GROUP_KEYWORDS)) {
        if (keywords.some((kw) => lower.includes(kw))) {
            return groupId;
        }
    }
    return 'other';
}

interface BudgetGroupHeaderProps {
    group: CategoryGroup;
    isCollapsed: boolean;
    onToggle: () => void;
    /** Sum of budgeted amounts in this group */
    totalBudgeted: number;
    /** Sum of spent amounts in this group */
    totalSpent: number;
    /** Category count */
    count: number;
    className?: string;
}

export function BudgetGroupHeader({
    group,
    isCollapsed,
    onToggle,
    totalBudgeted,
    totalSpent,
    count,
    className,
}: BudgetGroupHeaderProps) {
    const available = totalBudgeted - Math.abs(totalSpent);
    const isGroupOverspent = available < 0;

    return (
        <button
            onClick={onToggle}
            aria-expanded={!isCollapsed}
            aria-controls={`group-rows-${group.id}`}
            className={cn(
                'w-full flex items-center gap-3 px-4 py-2.5 transition-colors group',
                'bg-muted/50 hover:bg-accent/50 focus-visible:outline-none',
                'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
                'border-b border-border/60',
                className
            )}
        >
            {/* Chevron */}
            <motion.div
                animate={{ rotate: isCollapsed ? 0 : 90 }}
                transition={{ duration: 0.2 }}
                className="text-muted-foreground shrink-0"
                aria-hidden="true"
            >
                <ChevronRight className="w-4 h-4" />
            </motion.div>

            {/* Icon + Label */}
            <span className="text-base leading-none shrink-0" aria-hidden="true">{group.icon}</span>
            <span className="font-semibold text-sm text-foreground">{group.label}</span>
            <span className="text-xs text-muted-foreground">
                ({count})
            </span>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Group totals — only visible on md+ */}
            <div className="hidden md:flex items-center gap-4 text-sm tabular-nums">
                <span className="text-muted-foreground">{formatCurrency(totalBudgeted)}</span>
                <span
                    className={cn(
                        'font-semibold',
                        isGroupOverspent ? 'text-destructive' : 'text-success'
                    )}
                >
                    {formatCurrency(available)}
                </span>
            </div>
        </button>
    );
}

/** Wrapper that applies AnimatePresence to the rows of a group */
export function BudgetGroupRows({
    groupId,
    isCollapsed,
    children,
}: {
    groupId: string;
    isCollapsed: boolean;
    children: React.ReactNode;
}) {
    return (
        <AnimatePresence initial={false}>
            {!isCollapsed && (
                <motion.div
                    id={`group-rows-${groupId}`}
                    key={`rows-${groupId}`}
                    initial={{ height: 0, opacity: 0, overflow: 'hidden' }}
                    animate={{ height: 'auto', opacity: 1, overflow: 'visible' }}
                    exit={{ height: 0, opacity: 0, overflow: 'hidden' }}
                    transition={{ duration: 0.22, ease: 'easeInOut' }}
                >
                    {children}
                </motion.div>
            )}
        </AnimatePresence>
    );
}
