import { useState, useRef, useEffect } from 'react';
import { motion, MotionValue } from 'framer-motion';
import confetti from 'canvas-confetti';

import { useFinanceStore } from '../../../stores/useFinanceStore';
import { useBudgetMonth } from '../../../hooks/useFinanceData';
import { formatCurrency } from '../../../lib/utils';

interface TbbHeroCardProps {
    month: string;
    scrollY?: MotionValue<number>;
    className?: string;
}

export function TbbHeroCard({ month, className = "" }: TbbHeroCardProps) {
    const { toBeBudgeted: rawToBeBudgeted } = useFinanceStore();
    const toBeBudgeted = rawToBeBudgeted ?? 0;
    const { data: budgetMonth } = useBudgetMonth(month);

    const income = budgetMonth?.income ?? 0;

    // Confetti logic: fire when TBB goes from negative to >= 0
    const prevTbbRef = useRef<number | null>(null);
    useEffect(() => {
        if (prevTbbRef.current !== null && prevTbbRef.current !== 0 && toBeBudgeted === 0) {
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#10b981', '#34d399', '#059669']
            });
        }
        prevTbbRef.current = toBeBudgeted;
    }, [toBeBudgeted]);

    return (
        <motion.div
            layout
            className={`@container relative overflow-hidden rounded-3xl p-8 text-center text-primary-foreground shadow-xl transition-colors duration-500
                ${toBeBudgeted >= 0 ? 'bg-primary' : 'bg-destructive'}
                ${className}
            `}
        >
            <div className="flex flex-col items-center justify-center gap-2">
                <p className="text-primary-foreground/80 text-base font-medium uppercase tracking-wider">To Be Budgeted</p>
                <motion.div
                    key={toBeBudgeted}
                    initial={{ scale: 0.9, opacity: 0.8 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="text-[clamp(2rem,16cqw,4.5rem)] font-bold tracking-tight w-full truncate px-2 leading-none py-1"
                >
                    {formatCurrency(toBeBudgeted)}
                </motion.div>
            </div>
        </motion.div>
    );
}
