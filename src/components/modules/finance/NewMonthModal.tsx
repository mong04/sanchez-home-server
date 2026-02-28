import { motion } from 'framer-motion';
import { Modal } from '../../common/Modal';
import { Button } from '../../common/Button';
import { useBudgetMonth } from '../../../hooks/useFinanceData';
import { formatCurrency } from '../../../lib/utils';
import { Calendar, Copy, Calculator, Users } from 'lucide-react';

interface NewMonthModalProps {
    month: string;
    isOpen: boolean;
    onClose: () => void;
    onStartFresh: () => void;
    onCopyPrevious: () => void;
    onUseAverage: () => void;
    isPartnerOnline?: boolean;
}

export function NewMonthModal({
    month,
    isOpen,
    onClose,
    onStartFresh,
    onCopyPrevious,
    onUseAverage,
    isPartnerOnline = false
}: NewMonthModalProps) {
    const { data: budgetMonth, isLoading } = useBudgetMonth(month);

    const income = budgetMonth?.income || 0;
    const rollover = budgetMonth?.rollover || 0;
    const totalAvailable = income + rollover;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Welcome to a New Month">
            <div className="flex flex-col items-center p-4">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1, type: 'spring' }}
                    className="mb-8 mt-4 text-center"
                >
                    <p className="text-sm font-medium text-success uppercase tracking-widest mb-2">Available to Assign</p>
                    <h2 className="text-5xl font-bold tracking-tight text-foreground">
                        {isLoading ? '...' : formatCurrency(totalAvailable)}
                    </h2>
                    <div className="flex gap-4 justify-center mt-3 text-sm text-muted-foreground font-medium">
                        <span>Income: {formatCurrency(income)}</span>
                        <span>•</span>
                        <span>Rollover: {formatCurrency(rollover)}</span>
                    </div>
                </motion.div>

                <div className="w-full flex flex-col gap-3">
                    <Button
                        size="lg"
                        className="w-full flex justify-start gap-4 h-16 text-lg"
                        onClick={() => {
                            onStartFresh();
                            onClose();
                        }}
                    >
                        <div className="w-8 h-8 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                            <Calendar className="w-4 h-4 text-primary-foreground" />
                        </div>
                        Start Fresh — Assign Every Dollar
                    </Button>

                    <Button
                        size="lg"
                        variant="outline"
                        className="w-full flex justify-start gap-4 h-16 text-lg border-border hover:bg-accent hover:border-border"
                        onClick={() => {
                            onCopyPrevious();
                            onClose();
                        }}
                    >
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                            <Copy className="w-4 h-4" />
                        </div>
                        Copy Last Month's Budget
                    </Button>

                    <Button
                        size="lg"
                        variant="outline"
                        className="w-full flex justify-start gap-4 h-16 text-lg border-border hover:bg-accent hover:border-border"
                        onClick={() => {
                            onUseAverage();
                            onClose();
                        }}
                    >
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                            <Calculator className="w-4 h-4" />
                        </div>
                        Use 3-Month Average
                    </Button>
                </div>

                <div className="mt-8 pt-6 border-t border-border w-full flex justify-center">
                    <button className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors">
                        <Users className="w-4 h-4" />
                        {isPartnerOnline ? "Start a Money Date with partner" : "Start a Money Date"}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
