# UI Components: Finance Dashboard

Here are the implemented components for the Sanchez Family Finance Hub.

## 1. `src/components/modules/finance/EnvelopeCard.tsx`

Component for displaying individual envelope status, including "Safe to Spend" amount and progress bars. Handles private/hidden states.

```tsx
import { motion } from 'framer-motion';
import { Lock, Wallet } from 'lucide-react';
import * as Icons from 'lucide-react';
import { useState } from 'react';
import { Card, CardContent } from '../../common/Card';
import { cn } from '../../../lib/utils';
import type { EnvelopeRecord } from '../../../types/pocketbase';

interface EnvelopeCardProps {
    envelope: EnvelopeRecord;
    spent: number;
    onClick?: () => void;
}

export function EnvelopeCard({ envelope, spent, onClick }: EnvelopeCardProps) {
    const limit = envelope.budget_limit || 0;
    const safeToSpend = limit - spent;
    const progress = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
    const isPrivate = envelope.visibility === 'private' || envelope.visibility === 'hidden';
    const [isRevealed, setIsRevealed] = useState(false);

    // Dynamic Icon
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const IconComponent = (Icons as any)[envelope.icon || 'Wallet'] || Wallet;

    const handleReveal = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsRevealed(true);
    };

    if (isPrivate && !isRevealed) {
        return (
            <Card 
                className="cursor-pointer bg-card/50 border-dashed hover:bg-accent/50 transition-colors"
                onClick={handleReveal}
            >
                <CardContent className="flex items-center justify-center gap-3 p-6 text-muted-foreground">
                    <Lock className="w-5 h-5" />
                    <span className="italic font-medium">Hidden Envelope</span>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card 
            className="cursor-pointer hover:shadow-md transition-shadow active:scale-[0.99] duration-200"
            onClick={onClick}
        >
            <CardContent className="p-4 space-y-4">
                {/* Header */}
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                            <IconComponent className="w-5 h-5" />
                        </div>
                        <h3 className="font-semibold text-lg leading-none">{envelope.name}</h3>
                    </div>
                    <div className={cn(
                        "text-xl font-bold tabular-nums",
                        safeToSpend >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                    )}>
                        ${safeToSpend.toFixed(2)}
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="relative pt-2">
                    <div className="h-3 w-full bg-secondary rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                            className={cn(
                                "h-full rounded-full",
                                progress < 80 ? "bg-primary" :
                                progress < 100 ? "bg-amber-500" :
                                "bg-rose-500"
                            )}
                        />
                    </div>
                </div>

                {/* Footer Meta */}
                <div className="flex justify-between text-xs text-muted-foreground font-medium uppercase tracking-wider">
                    <span>Spent: ${spent.toFixed(2)}</span>
                    <span>Limit: ${limit.toFixed(2)}</span>
                </div>
            </CardContent>
        </Card>
    );
}
```

## 2. `src/components/modules/finance/TransactionFab.tsx`

Floating Action Button including the "Calculator" input modal and category selector.

```tsx
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

    const handleOpen = () => {
        setIsOpen(true);
        setStep(1);
        setAmount('');
        setSelectedEnvelope(null);
    };

    const handleClose = () => {
        setIsOpen(false);
    };

    const handleNumClick = (num: string) => {
        if (amount.includes('.') && num === '.') return;
        if (amount.length > 8) return; // Prevent crazy lengths
        setAmount(prev => prev + num);
    };

    const handleDelete = () => {
        setAmount(prev => prev.slice(0, -1));
    };

    const handleNext = () => {
        const val = parseFloat(amount);
        if (val > 0) {
            setStep(2);
        }
    };

    const handleSave = () => {
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
                className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg z-40 bg-primary text-primary-foreground hover:bg-primary/90"
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
                <div className="min-h-[300px] flex flex-col">
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
                                            className="h-14 text-2xl font-medium rounded-lg hover:bg-muted/50 active:scale-95 transition-transform"
                                        >
                                            {num}
                                        </button>
                                    ))}
                                    <button
                                        onClick={() => handleNumClick('.')}
                                        className="h-14 text-2xl font-medium rounded-lg hover:bg-muted/50 active:scale-95 transition-transform"
                                    >
                                        .
                                    </button>
                                    <button
                                        onClick={() => handleNumClick('0')}
                                        className="h-14 text-2xl font-medium rounded-lg hover:bg-muted/50 active:scale-95 transition-transform"
                                    >
                                        0
                                    </button>
                                    <button
                                        onClick={handleDelete}
                                        className="h-14 flex items-center justify-center text-rose-500 rounded-lg hover:bg-rose-50 active:scale-95 transition-transform"
                                    >
                                        <Delete className="w-6 h-6" />
                                    </button>
                                </div>

                                <Button 
                                    className="w-full mt-6 h-12 text-lg" 
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
                                    <Button variant="ghost" size="sm" onClick={() => setStep(1)} className="-ml-2">
                                        <ChevronLeft className="w-4 h-4 mr-1" />
                                        Back
                                    </Button>
                                    <span className="text-lg font-bold">${amount}</span>
                                </div>

                                <div className="grid grid-cols-2 gap-3 overflow-y-auto max-h-[300px] pr-1">
                                    {envelopes.map((env) => (
                                        <button
                                            key={env.id}
                                            onClick={() => setSelectedEnvelope(env.id)}
                                            className={cn(
                                                "p-4 rounded-xl border text-left transition-all active:scale-95",
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
                                    className="w-full mt-6 h-12 text-lg" 
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
```

## 3. `src/components/modules/finance/FinanceDashboard.tsx`

Main container that ties everything together. Implements the "Joint" vs "Personal" view switching.

```tsx
import { useState } from 'react';
import { EnvelopeCard } from './EnvelopeCard';
import { TransactionFab } from './TransactionFab';
import { useEnvelopes, useAddTransaction } from '../../../hooks/useFinanceData';
import { cn } from '../../../lib/utils';
import { Loader2 } from 'lucide-react';

type Tab = 'joint' | 'personal' | 'savings';

export default function FinanceDashboard() {
    const { data: envelopes, isLoading } = useEnvelopes();
    const { mutate: addTransaction } = useAddTransaction();
    const [activeTab, setActiveTab] = useState<Tab>('joint');

    const filteredEnvelopes = envelopes?.filter(env => {
        if (activeTab === 'joint') return env.visibility === 'public';
        if (activeTab === 'personal') return env.visibility === 'private' || env.visibility === 'hidden';
        if (activeTab === 'savings') return false; // Placeholder for savings
        return true;
    });

    const handleTransactionSave = (amount: number, envelopeId: string, note?: string) => {
       addTransaction({
           amount,
           envelope: envelopeId,
           notes: note,
           date: new Date().toISOString(),
           payee: 'Manual Entry', // Default
           status: 'cleared'
       });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full min-h-[50vh]">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="container max-w-5xl mx-auto p-4 pb-24 space-y-6">
            {/* Header / Tabs */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <h1 className="text-3xl font-bold tracking-tight">Finance Hub</h1>
                
                {/* Segmented Control */}
                <div className="flex p-1 bg-muted rounded-xl w-full sm:w-auto">
                    {(['joint', 'personal', 'savings'] as Tab[]).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={cn(
                                "flex-1 sm:flex-none px-6 py-2 rounded-lg text-sm font-medium transition-all capitalize",
                                activeTab === tab 
                                    ? "bg-background text-foreground shadow-sm" 
                                    : "text-muted-foreground hover:text-foreground/70"
                            )}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredEnvelopes?.map((envelope) => (
                    <EnvelopeCard
                        key={envelope.id}
                        envelope={envelope}
                        spent={(envelope.budget_limit || 0) - (envelope.current_balance || 0)} 
                        onClick={() => console.log('View envelope details', envelope.id)}
                    />
                ))}
                
                {filteredEnvelopes?.length === 0 && (
                    <div className="col-span-full py-12 text-center text-muted-foreground border border-dashed rounded-xl">
                        No envelopes found for {activeTab}.
                    </div>
                )}
            </div>

            {/* FAB */}
            <TransactionFab 
                envelopes={envelopes || []} 
                onSave={handleTransactionSave} 
            />
        </div>
    );
}
```
