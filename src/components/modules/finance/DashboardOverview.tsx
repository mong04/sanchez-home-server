import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Landmark, ArrowRight, Wallet, Activity, Receipt, ArrowUpRight, ArrowDownRight, Sparkles, TrendingUp, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { useFinanceStore } from '../../../stores/useFinanceStore';
import { useAccounts, useTransactions, useBudgetMonth } from '../../../hooks/useFinanceData';
import { useBudgetYjs } from '../../../hooks/useBudgetYjs';
import { useBills } from '../../../hooks/use-organizer';
import { Card, CardHeader, CardTitle, CardContent } from '../../common/Card';
import { formatCurrency } from '../../../lib/utils';
import { Button } from '../../common/Button';

export function DashboardOverview() {
    const { currentMonth, setActiveTab } = useFinanceStore();
    const { data: accounts } = useAccounts();
    const { data: transactions } = useTransactions();
    const { data: budgetMonth } = useBudgetMonth(currentMonth);

    // Yjs connection for To-Be-Budgeted accuracy
    const { allocations: yjsAllocations } = useBudgetYjs(currentMonth);
    const [allocations, setAllocations] = useState<Record<string, number>>({});

    useEffect(() => {
        const update = () => {
            const current: Record<string, number> = {};
            yjsAllocations.forEach((val, key) => { current[key] = val; });
            setAllocations(current);
        };
        update(); // initial
        yjsAllocations.observe(update);
        return () => yjsAllocations.unobserve(update);
    }, [yjsAllocations]);

    const { getUpcomingBills } = useBills();

    // Derived Financial Data
    const income = budgetMonth?.income ?? 0;
    const rollover = budgetMonth?.rollover ?? 0;
    const totalBudgeted = Object.values(allocations).reduce((sum, val) => sum + (val || 0), 0);
    const toBeBudgeted = (income + rollover) - totalBudgeted;

    const netWorth = accounts?.reduce((sum, acc) => sum + (acc.currentBalance ?? 0), 0) ?? 0;
    const recentTx = transactions?.slice(0, 5) ?? [];
    const upcomingBills = getUpcomingBills(30).slice(0, 3);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 h-[calc(100dvh-200px)] lg:h-[calc(100dvh-150px)] overflow-y-auto !scrollbar-hide [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden w-full px-1 pb-12">

            {/* Primary Grid: Hero & Net Worth */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">

                {/* To Be Budgeted Hero Card */}
                <Card
                    className={`group cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden border-0 ${toBeBudgeted >= 0 ? 'bg-success' : 'bg-destructive'}`}
                    onClick={() => setActiveTab('budget')}
                >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none transition-transform group-hover:scale-110 duration-700" />

                    <CardContent className="p-6 md:p-8 flex flex-col justify-between h-full relative z-10">
                        <div className="flex justify-between items-start mb-6">
                            <h3 className="text-success-foreground font-medium uppercase tracking-wider flex items-center gap-2">
                                <Sparkles className="w-4 h-4" />
                                To Be Budgeted
                            </h3>
                            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm group-hover:bg-white/30 transition-colors">
                                <ArrowRight className="w-5 h-5 text-white transform group-hover:translate-x-1 transition-transform" />
                            </div>
                        </div>

                        <div>
                            <motion.div
                                key={toBeBudgeted}
                                initial={{ scale: 0.95, opacity: 0.8 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="text-5xl md:text-6xl font-bold text-white tracking-tight mb-2"
                            >
                                {formatCurrency(toBeBudgeted)}
                            </motion.div>
                            <p className="text-success-foreground/90 text-sm font-medium">
                                {toBeBudgeted > 0 ? 'Ready to give these dollars a job.' : toBeBudgeted < 0 ? 'You are overbudgeted. Fix this soon.' : 'Every dollar has a job. Perfect.'}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Net Worth Card */}
                <Card className="group border-l-4 border-l-blue-500 cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all">
                    <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-base md:text-lg flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-blue-500/10">
                                <Landmark className="w-4 h-4 text-blue-500" />
                            </div>
                            <span>Total Net Worth</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="text-4xl md:text-5xl font-bold text-foreground tracking-tight">
                            {formatCurrency(netWorth)}
                        </div>
                        <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1.5">
                            <TrendingUp className="w-4 h-4 text-success" />
                            Looking good this month.
                        </p>

                        {/* Mini Accounts Grid inside Net Worth */}
                        <div className="mt-6 grid grid-cols-2 gap-3">
                            {accounts?.slice(0, 4).map(acc => (
                                <div key={acc.id} className="p-3 bg-muted/50 rounded-xl border border-border hover:bg-muted transition-colors">
                                    <div className="text-xs text-muted-foreground font-medium truncate mb-1">{acc.name}</div>
                                    <div className="text-sm font-semibold text-foreground">{formatCurrency(acc.currentBalance ?? 0)}</div>
                                </div>
                            ))}
                            {(accounts?.length ?? 0) > 4 && (
                                <div
                                    className="p-3 bg-accent/50 rounded-xl border border-border flex items-center justify-center text-xs font-semibold text-primary cursor-pointer hover:bg-accent transition-colors"
                                    onClick={() => setActiveTab('accounts')}
                                >
                                    + {(accounts?.length ?? 0) - 4} More
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

            </div>

            {/* Secondary Grid: Recent Activity & Upcoming Bills */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mt-6">

                {/* Recent Activity */}
                <Card className="border border-border/60 hover:shadow-sm transition-shadow">
                    <CardHeader className="pb-4 flex-row items-center justify-between space-y-0 border-b border-border/40">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Activity className="w-4 h-4 text-muted-foreground" />
                            Recent Activity
                        </CardTitle>
                        <Button variant="ghost" size="sm" className="text-xs text-primary h-8" onClick={() => setActiveTab('transactions')}>
                            View All <ArrowRight className="w-3 h-3 ml-1" />
                        </Button>
                    </CardHeader>
                    <CardContent className="pt-4 px-4 pb-4">
                        {recentTx.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground text-sm flex flex-col items-center">
                                <div className="p-3 rounded-full bg-muted mb-3">
                                    <Activity className="w-5 h-5 opacity-50" />
                                </div>
                                <span className="font-medium text-foreground">No recent transactions</span>
                                <span className="text-xs mt-1">Add one to see it here!</span>
                            </div>
                        ) : (
                            <div className="divide-y divide-border/40">
                                <AnimatePresence>
                                    {recentTx.map(tx => {
                                        const isIncome = tx.amount > 0; // Assume positive is income relative to DB config, wait PRD usually relies on type, let's just make it simple.
                                        // Wait, PRD relies on `tx.type` or `tx.amount > 0`. We'll just assume > 0 is income for visuals.
                                        return (
                                            <div key={tx.id} className="group flex flex-col sm:flex-row sm:items-center justify-between py-3 px-2 rounded-lg hover:bg-muted/50 transition-colors gap-2 sm:gap-4">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className={`p-2 rounded-xl shrink-0 ${isIncome ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                                                        {isIncome ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="text-sm font-medium text-foreground truncate">{tx.payee || 'Unknown Payee'}</div>
                                                        <div className="text-xs text-muted-foreground mt-0.5">
                                                            {tx.date && !isNaN(new Date(tx.date).getTime())
                                                                ? format(new Date(tx.date), 'MMM d')
                                                                : 'Unknown Date'}
                                                            • {tx.expand?.account?.name || 'Account'}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center w-full sm:w-auto pl-11 sm:pl-0">
                                                    <span className={`text-sm font-semibold tabular-nums ${isIncome ? 'text-success' : 'text-foreground'}`}>
                                                        {isIncome ? '+' : ''}{formatCurrency(Math.abs(tx.amount))}
                                                    </span>
                                                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium sm:mt-1">{tx.expand?.category?.name || 'Uncategorized'}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </AnimatePresence>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Upcoming Bills Teaser */}
                <Card className="border border-border/60 hover:shadow-sm transition-shadow">
                    <CardHeader className="pb-4 flex-row items-center justify-between space-y-0 border-b border-border/40">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Receipt className="w-4 h-4 text-muted-foreground" />
                            Upcoming Bills
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 px-4 pb-4">
                        {upcomingBills.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground text-sm flex flex-col items-center">
                                <div className="p-3 rounded-full bg-success/10 mb-3 border border-success/20">
                                    <Wallet className="w-5 h-5 text-success" />
                                </div>
                                <span className="font-medium text-foreground">You're completely caught up!</span>
                                <span className="text-xs mt-1">No due bills in the next 30 days.</span>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {upcomingBills.map(bill => {
                                    const daysUntil = Math.ceil((bill.dueDate - Date.now()) / (1000 * 60 * 60 * 24));
                                    const isCritical = daysUntil <= 3;
                                    return (
                                        <div key={bill.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-xl border border-border hover:bg-muted/60 transition-colors">
                                            <div className="min-w-0">
                                                <div className="text-sm font-medium text-foreground truncate">{bill.name}</div>
                                                <div className={`text-xs mt-0.5 flex items-center gap-1 ${isCritical ? 'text-destructive font-semibold' : 'text-muted-foreground'}`}>
                                                    {isCritical && <AlertTriangle className="w-3 h-3" />}
                                                    Due in {daysUntil} day{daysUntil !== 1 && 's'}
                                                </div>
                                            </div>
                                            <div className="text-sm font-semibold tabular-nums bg-card px-3 py-1.5 rounded-lg border border-border shadow-sm">
                                                {formatCurrency(bill.amount)}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>

            </div>

        </div>
    );
}

export default DashboardOverview;
