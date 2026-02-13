import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, Delete, Plus, X } from 'lucide-react';
import { useState } from 'react';
import { Modal } from '../../common/Modal';
import { Button } from '../../common/Button';
import { cn } from '../../../lib/utils';
import type { EnvelopeRecord } from '../../../types/pocketbase';

interface TransactionFabProps {
    envelopes: EnvelopeRecord[];
    onSave: (amount: number, envelopeId: string, note?: string) => void;
}

export function TransactionFab({ envelopes, onSave }: TransactionFabProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [step, setStep] = useState<1 | 2>(1);
    const [amount, setAmount] = useState('');
    const [selectedEnvelope, setSelectedEnvelope] = useState<string | null>(null);

    const vibrate = () => {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(5);
        }
    };

    const handleOpen = () => {
        vibrate();
        setIsOpen(true);
        setStep(1);
        setAmount('');
        setSelectedEnvelope(null);
    };

    const handleClose = () => {
        setIsOpen(false);
    };

    const handleNumClick = (num: string) => {
        vibrate();
        if (amount.includes('.') && num === '.') return;
        if (amount.length > 8) return; // Prevent crazy lengths
        setAmount(prev => prev + num);
    };

    const handleDelete = () => {
        vibrate();
        setAmount(prev => prev.slice(0, -1));
    };

    const handleNext = () => {
        vibrate();
        const val = parseFloat(amount);
        if (val > 0) {
            setStep(2);
        }
    };

    const handleBack = () => {
        vibrate();
        setStep(1);
    };

    const handleEnvelopeSelect = (id: string) => {
        vibrate();
        setSelectedEnvelope(id);
    };

    const handleSave = () => {
        vibrate();
        if (selectedEnvelope && parseFloat(amount) > 0) {
            onSave(parseFloat(amount), selectedEnvelope);
            handleClose();
        }
    };

    return (
        <>
            {/* FAB */}
            <Button
                size="icon"
                className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg z-40 bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 transition-transform"
                onClick={handleOpen}
                aria-label="Add Transaction"
            >
                <Plus className="w-8 h-8" />
            </Button>

            {/* Modal */}
            <Modal
                isOpen={isOpen}
                onClose={handleClose}
                title={step === 1 ? "Enter Amount" : "Select Category"}
                description={step === 1 ? "How much did you spend?" : "Where should this come from?"}
            >
                <div className="min-h-[300px] flex flex-col pb-[env(safe-area-inset-bottom)]">
                    <AnimatePresence mode="wait">
                        {step === 1 ? (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="flex-1 flex flex-col"
                            >
                                {/* Display */}
                                <div className="flex justify-center items-center py-8">
                                    <span className="text-4xl font-bold tracking-tight">
                                        ${amount || '0.00'}
                                    </span>
                                </div>

                                {/* Numpad */}
                                <div className="grid grid-cols-3 gap-4 flex-1">
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                                        <button
                                            key={num}
                                            onClick={() => handleNumClick(num.toString())}
                                            className="h-14 text-2xl font-medium rounded-lg hover:bg-muted/50 active:scale-95 transition-transform touch-manipulation"
                                        >
                                            {num}
                                        </button>
                                    ))}
                                    <button
                                        onClick={() => handleNumClick('.')}
                                        className="h-14 text-2xl font-medium rounded-lg hover:bg-muted/50 active:scale-95 transition-transform touch-manipulation"
                                    >
                                        .
                                    </button>
                                    <button
                                        onClick={() => handleNumClick('0')}
                                        className="h-14 text-2xl font-medium rounded-lg hover:bg-muted/50 active:scale-95 transition-transform touch-manipulation"
                                    >
                                        0
                                    </button>
                                    <button
                                        onClick={handleDelete}
                                        className="h-14 flex items-center justify-center text-rose-500 rounded-lg hover:bg-rose-50 active:scale-95 transition-transform touch-manipulation"
                                    >
                                        <Delete className="w-6 h-6" />
                                    </button>
                                </div>

                                <Button
                                    className="w-full mt-6 h-12 text-lg active:scale-[0.98] transition-transform"
                                    onClick={handleNext}
                                    disabled={!amount || parseFloat(amount) === 0}
                                >
                                    Next
                                </Button>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="flex-1 flex flex-col"
                            >
                                <div className="flex justify-between items-center mb-4">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleBack}
                                        className="-ml-2 h-11 px-3 text-base active:scale-95 transition-transform"
                                    >
                                        <ChevronLeft className="w-5 h-5 mr-1" />
                                        Back
                                    </Button>
                                    <span className="text-lg font-bold">${amount}</span>
                                </div>

                                <div className="grid grid-cols-2 gap-3 overflow-y-auto max-h-[40vh] pr-1">
                                    {envelopes.map((env) => (
                                        <button
                                            key={env.id}
                                            onClick={() => handleEnvelopeSelect(env.id)}
                                            className={cn(
                                                "p-4 rounded-xl border text-left transition-all active:scale-95 touch-manipulation",
                                                selectedEnvelope === env.id
                                                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                                                    : "border-border hover:border-primary/50"
                                            )}
                                        >
                                            <div className="font-semibold">{env.name}</div>
                                            <div className="text-xs text-muted-foreground mt-1">
                                                ${(env.budget_limit || 0) - (env.current_balance || 0)} left
                                            </div>
                                        </button>
                                    ))}
                                </div>

                                <Button
                                    className="w-full mt-6 h-12 text-lg active:scale-[0.98] transition-transform"
                                    onClick={handleSave}
                                    disabled={!selectedEnvelope}
                                >
                                    Save Transaction
                                </Button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </Modal>
        </>
    );
}
