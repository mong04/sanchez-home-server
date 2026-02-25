import { useState, useRef, useEffect } from 'react';
import { motion, MotionValue } from 'framer-motion';
import confetti from 'canvas-confetti';

import { useFinanceStore } from '../../../stores/useFinanceStore';
import { useBudgetMonth, useUpdateBudgetMonth } from '../../../hooks/useFinanceData';
import { formatCurrency } from '../../../lib/utils';
import { Input } from '../../common/Input';

interface TbbHeroCardProps {
    month: string;
    scrollY?: MotionValue<number>;
    className?: string;
}

export function TbbHeroCard({ month, className = "" }: TbbHeroCardProps) {
    const { toBeBudgeted: rawToBeBudgeted } = useFinanceStore();
    const toBeBudgeted = rawToBeBudgeted ?? 0;
    const { data: budgetMonth } = useBudgetMonth(month);
    const updateBudgetMonth = useUpdateBudgetMonth();

    const income = budgetMonth?.income ?? 0;

    const [isEditingIncome, setIsEditingIncome] = useState(false);
    const [incomeInput, setIncomeInput] = useState('');

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

    const handleIncomeSubmit = () => {
        const num = parseFloat(incomeInput) || 0;
        if (budgetMonth?.id) {
            updateBudgetMonth.mutate({ id: budgetMonth.id, data: { income: num } });
        }
        setIsEditingIncome(false);
    };

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
                    className="text-[clamp(2rem,16cqw,4.5rem)] font-bold tracking-tight cursor-pointer w-full truncate px-2 leading-none py-1"
                    onClick={() => {
                        setIncomeInput(income.toString());
                        setIsEditingIncome(true);
                    }}
                >
                    {formatCurrency(toBeBudgeted)}
                </motion.div>

                {isEditingIncome && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 flex gap-2 items-center"
                    >
                        <Input
                            type="number"
                            value={incomeInput}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setIncomeInput(e.target.value)}
                            className="w-32 text-foreground text-center"
                            autoFocus
                            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && handleIncomeSubmit()}
                            onBlur={handleIncomeSubmit}
                        />
                    </motion.div>
                )}
            </div>
        </motion.div>
    );
}
