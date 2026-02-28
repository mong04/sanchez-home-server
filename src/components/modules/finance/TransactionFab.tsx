import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Check, Briefcase, SplitSquareHorizontal, ChevronDown, RotateCcw } from 'lucide-react';
import { useAddTransaction, useCategories, useAccounts, useTransactions } from '../../../hooks/useFinanceData';
import { useFinanceStore } from '../../../stores/useFinanceStore';
import { useBudgetYjs } from '../../../hooks/useBudgetYjs';
import { formatCurrency } from '../../../lib/utils';

type Step = 'amount' | 'category' | 'payee';

export function TransactionFab() {
    const [isOpen, setIsOpen] = useState(false);
    const [step, setStep] = useState<Step>('amount');

    // Amount State
    const [amountStr, setAmountStr] = useState('0');

    // Split State
    const [isSplit, setIsSplit] = useState(false);
    const [splitAmountStr, setSplitAmountStr] = useState('0');
    const [activeInput, setActiveInput] = useState<'main' | 'split'>('main');

    // Category State (for split, we need two)
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

    // Payee State
    const [payeeStr, setPayeeStr] = useState('');
    const { data: recentTxs } = useTransactions();

    // Account State
    const { data: accounts } = useAccounts();
    const [selectedAccountId, setSelectedAccountId] = useState<string>('');
    const [showAccountSelector, setShowAccountSelector] = useState(false);

    // Insights State
    const [isSaved, setIsSaved] = useState(false);
    const [savedInsight, setSavedInsight] = useState('');

    const { data: categories } = useCategories('expense');
    const addTransaction = useAddTransaction();

    const { currentMonth } = useFinanceStore();
    const { allocations } = useBudgetYjs(currentMonth);

    // Set default account when accounts load
    useEffect(() => {
        if (accounts && accounts.length > 0 && !selectedAccountId) {
            // Try to find a checking account, otherwise use first
            const defaultAcc = accounts.find(a => a.name.toLowerCase().includes('checking')) || accounts[0];
            setSelectedAccountId(defaultAcc.id);
        }
    }, [accounts, selectedAccountId]);

    const triggerHaptic = () => {
        if ('vibrate' in navigator) navigator.vibrate(50);
    };

    const handleKeypadPress = (key: string) => {
        triggerHaptic();

        const setStr = activeInput === 'main' ? setAmountStr : setSplitAmountStr;
        const currentStr = activeInput === 'main' ? amountStr : splitAmountStr;

        if (key === 'clear') {
            setStr('0');
        } else if (key === 'backspace') {
            setStr(currentStr.length > 1 ? currentStr.slice(0, -1) : '0');
        } else if (key === '.') {
            if (!currentStr.includes('.')) setStr(currentStr + '.');
        } else {
            setStr(currentStr === '0' ? key : currentStr + key);
        }
    };

    const handleNext = () => {
        triggerHaptic();
        const mainVal = parseFloat(amountStr);
        if (mainVal > 0) {
            setStep('category');
        }
    };

    const handleCategorySelect = (categoryId: string) => {
        triggerHaptic();

        if (!isSplit) {
            setSelectedCategories([categoryId]);
            setStep('payee');
        } else {
            const newCats = [...selectedCategories, categoryId];
            setSelectedCategories(newCats);

            if (newCats.length === 2) {
                setStep('payee');
            }
        }
    };

    const handlePayeeSubmit = async (finalPayee: string) => {
        if (!finalPayee.trim() && !payeeStr.trim()) return;
        const submitPayee = finalPayee.trim() || payeeStr.trim();
        triggerHaptic();
        await executeSave(selectedCategories, submitPayee);
    };

    const executeSave = async (categoryIds: string[], finalPayee: string) => {
        if (!selectedAccountId) return;

        const mainAmount = parseFloat(amountStr);
        const splitAmount = isSplit ? parseFloat(splitAmountStr) : 0;

        try {
            if (!isSplit || categoryIds.length === 1) {
                await addTransaction.mutateAsync({
                    amount: -mainAmount,
                    category: categoryIds[0],
                    account: selectedAccountId,
                    date: new Date().toISOString(),
                    type: 'normal',
                    payee: finalPayee,
                    cleared: false
                });
                generateInsight(categoryIds[0], mainAmount);
            } else {
                // Split transaction
                const remainingAmount = mainAmount - splitAmount;
                const splitGroupId = crypto.randomUUID();

                await Promise.all([
                    addTransaction.mutateAsync({
                        amount: -remainingAmount,
                        category: categoryIds[0],
                        account: selectedAccountId,
                        date: new Date().toISOString(),
                        type: 'normal',
                        notes: 'Split via Quick Add',
                        payee: finalPayee,
                        cleared: false,
                        splitGroupId
                    }),
                    addTransaction.mutateAsync({
                        amount: -splitAmount,
                        category: categoryIds[1],
                        account: selectedAccountId,
                        date: new Date().toISOString(),
                        type: 'normal',
                        notes: 'Split via Quick Add',
                        payee: finalPayee,
                        cleared: false,
                        splitGroupId
                    })
                ]);
                generateInsight(categoryIds[0], remainingAmount); // Show insight for the main category
            }

            setIsSaved(true);
            setTimeout(() => {
                setIsOpen(false);
                setTimeout(reset, 400); // Wait for exit animation
            }, 3000); // 3 seconds to view the insight

        } catch (error) {
            console.error("Failed to save transaction", error);
        }
    };

    const generateInsight = (categoryId: string, spendAmount: number) => {
        const cat = categories?.find(c => c.id === categoryId);
        if (!cat) {
            setSavedInsight('Transaction logged successfully!');
            return;
        }

        const budgeted = allocations.get(categoryId) || 0;

        // Very basic spent calculation (in a real app, this would use the store)
        // Here we just say "You budgeted X, minus this spend, you have Y left (not counting previous spends)"
        // But since we don't have total spent per category easily in this component without duplicating logic,
        // we'll just show an encouraging note.

        if (budgeted > spendAmount) {
            setSavedInsight(`Logged to ${cat.name}. You budgeted ${formatCurrency(budgeted)} this month.`);
        } else {
            setSavedInsight(`Logged to ${cat.name}.`);
        }
    };

    const reset = () => {
        setStep('amount');
        setAmountStr('0');
        setIsSplit(false);
        setSplitAmountStr('0');
        setActiveInput('main');
        setSelectedCategories([]);
        setPayeeStr('');
        setIsSaved(false);
        setShowAccountSelector(false);
    };

    const toggleOpen = () => {
        triggerHaptic();
        if (isOpen) {
            setIsOpen(false);
            setTimeout(reset, 300);
        } else {
            setIsOpen(true);
        }
    };

    const keypad = [
        ['1', '2', '3'],
        ['4', '5', '6'],
        ['7', '8', '9'],
        ['.', '0', 'backspace']
    ];

    const slideVariants = {
        enter: { x: 50, opacity: 0 },
        center: { x: 0, opacity: 1 },
        exit: { x: -50, opacity: 0 }
    };

    // Keyboard support for desktop
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen || isSaved) return;

            if (step === 'payee') {
                if (e.key === 'Enter' && payeeStr.trim().length > 0) {
                    e.preventDefault();
                    handlePayeeSubmit(payeeStr);
                } else if (e.key === 'Escape') {
                    setIsOpen(false);
                    setTimeout(reset, 300);
                }
                return;
            }

            if (step !== 'amount') return;

            const key = e.key;
            if (/[0-9]/.test(key)) {
                handleKeypadPress(key);
            } else if (key === '.' || key === ',') {
                handleKeypadPress('.');
            } else if (key === 'Backspace') {
                handleKeypadPress('backspace');
            } else if (key === 'Enter') {
                const mainVal = parseFloat(amountStr);
                if (mainVal > 0 && !(isSplit && parseFloat(splitAmountStr) >= mainVal)) {
                    handleNext();
                }
            } else if (key === 'Escape') {
                setIsOpen(false);
                setTimeout(reset, 300);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, step, isSaved, amountStr, splitAmountStr, isSplit, activeInput]);


    // Smart Suggestions: If it's morning, suggest breakfast/coffee. If weekend, dining out.
    const suggestedCategories = useMemo(() => {
        if (!categories) return [];
        const hour = new Date().getHours();
        const day = new Date().getDay();
        const isWeekend = day === 0 || day === 6;

        let priorityKeywords = [''];
        if (hour >= 6 && hour <= 10) priorityKeywords = ['coffee', 'breakfast'];
        else if (hour >= 11 && hour <= 14) priorityKeywords = ['lunch', 'dining'];
        else if (hour >= 17 && hour <= 21) priorityKeywords = ['dinner', 'dining', 'takeout'];
        else if (isWeekend) priorityKeywords = ['fun', 'entertainment', 'dining'];
        else priorityKeywords = ['groceries', 'gas'];

        const sorted = [...categories].sort((a, b) => {
            const aName = a.name.toLowerCase();
            const bName = b.name.toLowerCase();
            const aMatch = priorityKeywords.some(kw => aName.includes(kw));
            const bMatch = priorityKeywords.some(kw => bName.includes(kw));
            if (aMatch && !bMatch) return -1;
            if (!aMatch && bMatch) return 1;
            return 0;
        });

        return sorted;
    }, [categories]);

    // Intelligent Payee Suggestions
    const suggestedPayees = useMemo(() => {
        if (!recentTxs || recentTxs.length === 0 || selectedCategories.length === 0) return [];
        const primaryCatId = selectedCategories[0];

        // Filter transactions by the primary selected category
        const catTxs = recentTxs.filter(tx => tx.category === primaryCatId && tx.payee && tx.payee.trim() !== '' && tx.payee !== 'Quick Add');

        // Count frequency of payees
        const payeeCounts = new Map<string, number>();
        for (const tx of catTxs) {
            const p = tx.payee.trim();
            payeeCounts.set(p, (payeeCounts.get(p) || 0) + 1);
        }

        // Sort by frequency and return top 3
        return Array.from(payeeCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(entry => entry[0]);
    }, [recentTxs, selectedCategories]);

    const activeAccount = accounts?.find(a => a.id === selectedAccountId);

    return (
        <div className="fixed bottom-24 md:bottom-6 right-4 md:right-6 z-50 flex flex-col items-end pointer-events-none">

            {/* Overlay for mobile bottom sheet */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsOpen(false)}
                        className="md:hidden fixed inset-0 bg-black/40 z-40 pointer-events-auto backdrop-blur-sm"
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 100 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 100 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="
                            pointer-events-auto flex flex-col overflow-hidden bg-background shadow-2xl
                            mb-4 w-full md:w-[360px] border border-border
                            fixed md:relative bottom-0 right-0 left-0 md:bottom-auto md:right-auto md:left-auto
                            rounded-t-3xl md:rounded-3xl
                            h-[85vh] max-h-[600px] md:h-[550px] md:max-h-[550px]
                            z-50
                        "
                    >
                        {/* Mobile drag handle indicator */}
                        <div className="md:hidden w-full flex justify-center pt-3 pb-1 bg-background cursor-grab active:cursor-grabbing">
                            <div className="w-12 h-1.5 bg-muted rounded-full" />
                        </div>

                        {/* Header */}
                        <div className="flex items-center justify-between p-4 bg-background border-b border-border/50 shrink-0">
                            <span className="font-semibold text-muted-foreground text-sm tracking-wide uppercase">
                                {step === 'amount' ? 'Quick Add' :
                                    step === 'payee' ? 'Who did you pay?' :
                                        isSplit ? `Select Category ${selectedCategories.length + 1}/2` : 'Select Category'}
                            </span>
                            {step !== 'amount' && !isSaved && (
                                <button
                                    onClick={() => {
                                        if (step === 'payee') {
                                            setStep('category');
                                            // Don't clear categories here to allow them to re-click the same one if they made a mistake
                                        } else if (selectedCategories.length > 0) {
                                            setSelectedCategories([]);
                                        } else {
                                            setStep('amount');
                                        }
                                    }}
                                    className="text-primary text-sm font-medium hover:text-primary/80"
                                >
                                    Back
                                </button>
                            )}
                        </div>

                        {/* Content Area */}
                        <div className="relative flex-1 bg-background overflow-hidden">
                            <AnimatePresence mode="wait">
                                {isSaved ? (
                                    <motion.div
                                        key="success"
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center"
                                    >
                                        <motion.div
                                            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.1 }}
                                            className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mb-6 text-success"
                                        >
                                            <Check className="w-10 h-10" />
                                        </motion.div>
                                        <h3 className="text-2xl font-bold mb-2 text-foreground">Saved!</h3>
                                        <p className="text-muted-foreground font-medium text-lg leading-relaxed">
                                            {savedInsight}
                                        </p>
                                        <button
                                            onClick={() => setIsSaved(false)}
                                            className="mt-8 text-sm text-primary font-medium hover:underline flex items-center gap-1"
                                        >
                                            <RotateCcw className="w-4 h-4" /> Undo
                                        </button>
                                    </motion.div>
                                ) : step === 'amount' ? (
                                    <motion.div
                                        key="amount"
                                        variants={slideVariants}
                                        initial="enter"
                                        animate="center"
                                        exit="exit"
                                        className="absolute inset-0 flex flex-col justify-between"
                                    >
                                        <div className="flex-1 flex flex-col items-center justify-center p-4 min-h-0 overflow-y-auto w-full">

                                            {/* Account Pill Selector */}
                                            <div className="mb-6 relative">
                                                <button
                                                    onClick={() => setShowAccountSelector(!showAccountSelector)}
                                                    className="flex items-center gap-2 bg-muted/50 hover:bg-muted px-4 py-2 rounded-full transition-colors border border-border/50 text-sm font-medium"
                                                >
                                                    <Briefcase className="w-4 h-4 text-primary" />
                                                    <span className="truncate max-w-[150px]">{activeAccount?.name || 'Select Account'}</span>
                                                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                                </button>

                                                {/* Mini Account Dropdown */}
                                                <AnimatePresence>
                                                    {showAccountSelector && (
                                                        <motion.div
                                                            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                                                            className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-64 bg-popover border border-border shadow-lg rounded-2xl overflow-hidden z-20"
                                                        >
                                                            <div className="max-h-48 overflow-y-auto">
                                                                {accounts?.map(acc => (
                                                                    <button
                                                                        key={acc.id}
                                                                        onClick={() => { setSelectedAccountId(acc.id); setShowAccountSelector(false); }}
                                                                        className={`w-full text-left px-4 py-3 hover:bg-muted text-sm font-medium transition-colors ${selectedAccountId === acc.id ? 'bg-primary/10 text-primary' : ''}`}
                                                                    >
                                                                        {acc.name}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>

                                            {/* Amount Display */}
                                            <div className="flex flex-col items-center w-full px-6 gap-4">
                                                <div
                                                    onClick={() => setActiveInput('main')}
                                                    className={`w-full flex justify-center items-baseline pb-2 border-b-2 transition-colors ${activeInput === 'main' ? 'border-primary' : 'border-transparent opacity-50'}`}
                                                >
                                                    <span className="text-3xl text-muted-foreground/50 mr-1 font-semibold">$</span>
                                                    <span className="text-6xl font-bold tracking-tight text-foreground truncate">{amountStr}</span>
                                                </div>

                                                {/* Split Amount Display */}
                                                <AnimatePresence>
                                                    {isSplit && (
                                                        <motion.div
                                                            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                                            onClick={() => setActiveInput('split')}
                                                            className={`w-full flex justify-center items-baseline pb-2 border-b-2 transition-colors overflow-hidden ${activeInput === 'split' ? 'border-blue-500' : 'border-transparent opacity-50'}`}
                                                        >
                                                            <span className="text-xl text-muted-foreground/50 mr-1 font-semibold">$</span>
                                                            <span className="text-4xl font-bold tracking-tight text-foreground truncate">{splitAmountStr}</span>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>

                                            {/* Quick Split Toggle */}
                                            <button
                                                onClick={() => {
                                                    setIsSplit(!isSplit);
                                                    setActiveInput(!isSplit ? 'split' : 'main');
                                                    if (isSplit) setSplitAmountStr('0');
                                                }}
                                                className={`mt-4 mb-2 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-colors shrink-0
                                                    ${isSplit ? 'bg-blue-500/10 text-blue-600' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
                                            >
                                                <SplitSquareHorizontal className="w-4 h-4" />
                                                {isSplit ? 'Cancel Split' : 'Split Amount'}
                                            </button>

                                        </div>

                                        {/* Numpad & Submit Area */}
                                        <div className="flex flex-col shrink-0 mt-auto">
                                            <div className="grid grid-cols-3 gap-[1px] bg-border/50">
                                                {keypad.flat().map((key) => (
                                                    <button
                                                        key={key}
                                                        onClick={() => handleKeypadPress(key)}
                                                        className="bg-background h-14 sm:h-16 flex items-center justify-center text-2xl font-medium text-foreground hover:bg-muted active:bg-accent transition-colors"
                                                    >
                                                        {key === 'backspace' ? <X className="w-6 h-6" /> : key}
                                                    </button>
                                                ))}
                                            </div>

                                            <button
                                                onClick={handleNext}
                                                disabled={parseFloat(amountStr) <= 0 || (isSplit && parseFloat(splitAmountStr) >= parseFloat(amountStr))}
                                                className="w-full h-16 sm:h-16 bg-primary hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground text-primary-foreground text-lg font-bold transition-colors flex items-center justify-center shrink-0"
                                            >
                                                Next
                                            </button>
                                        </div>
                                    </motion.div>
                                ) : step === 'category' ? (
                                    <motion.div
                                        key="category"
                                        variants={slideVariants}
                                        initial="enter"
                                        animate="center"
                                        exit="exit"
                                        className="absolute inset-0 overflow-y-auto p-4 content-start"
                                    >
                                        <div className="mb-4">
                                            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 px-2">Suggestions</h4>
                                            <div className="grid grid-cols-3 gap-2">
                                                {suggestedCategories.slice(0, 3).map((cat) => (
                                                    <button
                                                        key={`sugg-${cat.id}`}
                                                        onClick={() => handleCategorySelect(cat.id)}
                                                        className="flex flex-col items-center justify-center p-3 rounded-2xl border-2 border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors"
                                                    >
                                                        <div className="w-10 h-10 rounded-full flex items-center justify-center mb-2 shadow-sm" style={{ backgroundColor: cat.color || 'hsl(var(--muted))', color: '#fff' }}>
                                                            {cat.icon || '📌'}
                                                        </div>
                                                        <span className="text-[11px] font-bold text-foreground text-center leading-tight">{cat.name}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 px-2 mt-6">All Categories</h4>
                                        <div className="grid grid-cols-3 gap-2 pb-20">
                                            {suggestedCategories.slice(3).map((cat) => (
                                                <button
                                                    key={cat.id}
                                                    onClick={() => handleCategorySelect(cat.id)}
                                                    className="flex flex-col items-center justify-center p-3 rounded-2xl border border-border hover:border-primary/50 hover:bg-muted/50 transition-colors"
                                                >
                                                    <div className="w-8 h-8 rounded-full flex items-center justify-center mb-2" style={{ backgroundColor: cat.color || 'hsl(var(--muted))', color: '#fff' }}>
                                                        {cat.icon || '📌'}
                                                    </div>
                                                    <span className="text-[10px] font-medium text-muted-foreground text-center leading-tight truncate w-full">{cat.name}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="payee"
                                        variants={slideVariants}
                                        initial="enter"
                                        animate="center"
                                        exit="exit"
                                        className="absolute inset-0 flex flex-col p-4 bg-background"
                                    >
                                        <div className="flex-1 flex flex-col justify-center max-w-sm w-full mx-auto pb-20">
                                            {suggestedPayees.length > 0 && (
                                                <div className="mb-8">
                                                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 px-2 text-center">Top Suggestions</h4>
                                                    <div className="flex flex-col gap-2">
                                                        {suggestedPayees.map(p => (
                                                            <button
                                                                key={p}
                                                                onClick={() => handlePayeeSubmit(p)}
                                                                className="flex items-center justify-center p-4 rounded-2xl bg-muted/50 hover:bg-primary/10 hover:text-primary border border-border hover:border-primary/30 transition-colors text-foreground font-semibold text-lg"
                                                            >
                                                                {p}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 px-2 text-center">Manual Entry</h4>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="text"
                                                    value={payeeStr}
                                                    onChange={(e) => setPayeeStr(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') handlePayeeSubmit(payeeStr);
                                                    }}
                                                    placeholder="Type payee name..."
                                                    className="flex-1 h-14 rounded-2xl border-2 border-input bg-background px-4 py-2 text-lg font-semibold text-foreground ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-primary transition-colors"
                                                    autoFocus
                                                />
                                                <button
                                                    onClick={() => handlePayeeSubmit(payeeStr)}
                                                    disabled={!payeeStr.trim()}
                                                    className="h-14 w-14 flex items-center justify-center shrink-0 rounded-2xl bg-primary hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground text-primary-foreground transition-colors"
                                                >
                                                    <Check className="w-6 h-6" />
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleOpen}
                className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl md:rounded-full shadow-xl flex items-center justify-center transition-colors text-primary-foreground pointer-events-auto
                     ${isOpen ? 'bg-muted-foreground' : 'bg-primary hover:bg-primary/90'}
                 `}
            >
                <motion.div animate={{ rotate: isOpen ? 45 : 0 }}>
                    <Plus className="w-7 h-7 md:w-8 md:h-8" />
                </motion.div>
            </motion.button>
        </div>
    );
}

