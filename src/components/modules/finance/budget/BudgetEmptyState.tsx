// src/components/modules/finance/budget/BudgetEmptyState.tsx
// Premium empty state shown when no categories exist yet.

import { Button } from '../../../common/Button';
import { motion } from 'framer-motion';

interface BudgetEmptyStateProps {
    onAddCategory: () => void;
}

export function BudgetEmptyState({ onAddCategory }: BudgetEmptyStateProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="flex flex-col items-center justify-center py-20 px-6 text-center gap-6"
        >
            {/* Illustration */}
            <div className="relative">
                <div className="w-28 h-28 rounded-full bg-gradient-to-br from-success/20 to-success/5 border border-success/20 flex items-center justify-center shadow-lg">
                    <span className="text-5xl" role="img" aria-label="Seedling">🌱</span>
                </div>
                {/* Decorative dots */}
                <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-success/40" />
                <div className="absolute -bottom-0.5 -left-1 w-2 h-2 rounded-full bg-primary/30" />
            </div>

            <div className="space-y-2 max-w-xs">
                <h3 className="text-xl font-bold text-foreground">Every dollar needs a job</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                    Add categories to give every dollar a purpose. Start with housing, food, and bills — you can always add more.
                </p>
            </div>

            <Button
                onClick={onAddCategory}
                className="mt-2 gap-2 bg-success hover:bg-success/90 text-success-foreground shadow-md shadow-success/20 transition-all active:scale-[0.97]"
                size="lg"
            >
                <span className="text-lg leading-none">+</span>
                Add Your First Category
            </Button>
        </motion.div>
    );
}
