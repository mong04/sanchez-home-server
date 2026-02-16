import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Plus, Wallet, TrendingUp, Grid3X3 } from 'lucide-react';
import { startOfMonth, endOfMonth } from 'date-fns';
import { EnvelopeCard } from './EnvelopeCard';
import { TransactionFab } from './TransactionFab';
import { BudgetAllocation } from './Budgets/BudgetAllocation';
import { SpendingTrendChart } from './Charts/SpendingTrendChart';
import { CreateEnvelopeModal } from './CreateEnvelopeModal';
import { useEnvelopes, useAddTransaction } from '../../../hooks/useFinanceData';
import { cn } from '../../../lib/utils';

type Tab = 'joint' | 'personal' | 'savings';

export default function FinanceDashboard() {
    const { data: envelopes, isLoading } = useEnvelopes();
    const { mutate: addTransaction } = useAddTransaction();
    const [activeTab, setActiveTab] = useState<Tab>('joint');
    const [viewMode, setViewMode] = useState<'cards' | 'allocation' | 'insights'>('cards');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Calculate chart dates for insights
    const today = new Date();
    const startDate = startOfMonth(today);
    const endDate = endOfMonth(today);

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
        <div className="container max-w-7xl mx-auto p-4 md:p-6 pb-24 space-y-6">
            {/* Header / Tabs */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Finance Hub</h1>
                    <p className="text-muted-foreground">Manage your family budget</p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                    {/* View Switcher (Desktop focus) */}
                    <div className="hidden md:flex bg-muted/50 p-1 rounded-lg border border-border">
                        <button
                            onClick={() => setViewMode('cards')}
                            className={cn(
                                "px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2",
                                viewMode === 'cards' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <Wallet className="w-4 h-4" />
                            Cards
                        </button>
                        <button
                            onClick={() => setViewMode('allocation')}
                            className={cn(
                                "px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2",
                                viewMode === 'allocation' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <Grid3X3 className="w-4 h-4" />
                            Allocation
                        </button>
                        <button
                            onClick={() => setViewMode('insights')}
                            className={cn(
                                "px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2",
                                viewMode === 'insights' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <TrendingUp className="w-4 h-4" />
                            Insights
                        </button>
                    </div>

                    {/* Segmented Control (Joint/Personal) */}
                    <div className="flex p-1 bg-muted rounded-xl w-full sm:w-auto">
                        {(['joint', 'personal', 'savings'] as Tab[]).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={cn(
                                    "flex-1 sm:px-6 py-2 rounded-lg text-sm font-medium transition-all capitalize",
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
            </div>

            {/* Content Area */}
            <div className="min-h-[400px]">
                <AnimatePresence mode="wait">
                    {viewMode === 'allocation' ? (
                        <motion.div
                            key="allocation"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                        >
                            <BudgetAllocation envelopes={filteredEnvelopes || []} />
                        </motion.div>
                    ) : viewMode === 'insights' ? (
                        <motion.div
                            key="insights"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
                        >
                            <div className="bg-card border border-border p-6 rounded-xl">
                                <h3 className="text-lg font-semibold mb-4">Monthly Spending Trend</h3>
                                <SpendingTrendChart
                                    transactions={[]} // TODO: Fetch real transactions
                                    totalBudget={filteredEnvelopes?.reduce((sum, e) => sum + (e.budget_limit || 0), 0) || 0}
                                    startDate={startDate}
                                    endDate={endDate}
                                />
                            </div>
                            <div className="bg-card border border-border p-6 rounded-xl flex flex-col justify-center items-center text-center">
                                <TrendingUp className="w-12 h-12 text-muted-foreground/30 mb-4" />
                                <h3 className="text-lg font-semibold">Category Breakdown</h3>
                                <p className="text-muted-foreground">Visual analytics coming in next update.</p>
                            </div>
                        </motion.div>
                    ) : (
                        /* Default Cards View */
                        <motion.div
                            key="cards"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                        >
                            {filteredEnvelopes?.map((envelope) => (
                                <EnvelopeCard
                                    key={envelope.id}
                                    envelope={envelope}
                                    spent={(envelope.budget_limit || 0) - (envelope.current_balance || 0)}
                                    onClick={() => console.log('View envelope details', envelope.id)}
                                />
                            ))}

                            <button
                                onClick={() => setIsCreateModalOpen(true)}
                                className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-muted-foreground/20 rounded-xl hover:border-primary/50 hover:bg-accent/50 transition-all group h-full min-h-[160px]"
                            >
                                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                    <Plus className="w-6 h-6 text-muted-foreground" />
                                </div>
                                <span className="font-medium text-muted-foreground">Create Envelope</span>
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Modals */}
            <CreateEnvelopeModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
            />

            {/* FAB */}
            <TransactionFab
                envelopes={envelopes || []}
                onSave={handleTransactionSave}
            />
        </div>
    );
}
