import React, { Suspense, useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard,
    Landmark,
    ArrowLeftRight,
    User,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import { format, addMonths, subMonths, parse } from 'date-fns';

import { useFinanceStore } from '../../../stores/useFinanceStore';
import { useBudgetYjs } from '../../../hooks/useBudgetYjs';
import { useBudgetMonth } from '../../../hooks/useFinanceData';
import { cn } from '../../../lib/utils';
import { TransactionFab } from './TransactionFab';
import { TbbHeroCard } from './TbbHeroCard';

// Lazy load components with error boundaries in mind (though currently just suspense)
const DashboardOverview = React.lazy(() => import('./DashboardOverview').then(m => ({ default: m.DashboardOverview as React.ComponentType<any> })));
const AccountsList = React.lazy(() => import('./AccountsList').then(m => ({ default: m.AccountsList as React.ComponentType<any> })));
const BudgetGrid = React.lazy(() => import('./BudgetGrid').then(m => ({ default: m.BudgetGrid as React.ComponentType<{ month: string, scrollY?: any }> })));
const TransactionsTable = React.lazy(() => import('./TransactionsTable').then(m => ({ default: m.TransactionsTable as React.ComponentType<any> })));

const TABS = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'accounts', label: 'Accounts', icon: Landmark },
    { id: 'budget', label: 'Budget', icon: User },
    { id: 'transactions', label: 'Activity', icon: ArrowLeftRight },
] as const;

function TabLoading() {
    return (
        <div className="w-full h-64 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
        </div>
    );
}

export function FinanceDashboard() {
    const { activeTab, setActiveTab, currentMonth, setCurrentMonth, toBeBudgeted, setToBeBudgeted } = useFinanceStore();

    // Scroll tracking for Zero-CLS Magic Sticky Headers (Percentage Based Tracking)
    const [showCompactMinis, setShowCompactMinis] = useState(false);
    const heroRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const scrollContainer = document.querySelector('.overflow-y-auto');
        if (!scrollContainer) return;

        const handleScroll = () => {
            if (!heroRef.current) return;
            const heroRect = heroRef.current.getBoundingClientRect();
            const containerRect = scrollContainer.getBoundingClientRect();

            // Calculate how much of the hero unit is still visible in the container.
            // heroRect.bottom is relative to viewport. containerRect.top is relative to viewport.
            // Subtracting 60px accounts for the sticky tabs height immediately below the container top.
            const visibleHeight = (heroRect.bottom - containerRect.top) - 60;
            const threshold = heroRect.height * 0.2; // Trigger when 80% scrolled off

            setShowCompactMinis(visibleHeight < threshold);
        };

        // Delay initial measure slightly to ensure DOM is painted
        requestAnimationFrame(handleScroll);

        scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
        window.addEventListener('resize', handleScroll);

        return () => {
            scrollContainer.removeEventListener('scroll', handleScroll);
            window.removeEventListener('resize', handleScroll);
        };
    }, []);


    // Data hooks
    const { data: budgetMonth } = useBudgetMonth(currentMonth);
    const { peerCount, allocations } = useBudgetYjs(currentMonth);

    // Keep global To Be Budgeted state perfectly in sync across all headers and dashboards
    useEffect(() => {
        const calculateTbb = () => {
            const income = budgetMonth?.income ?? 0;
            const rollover = budgetMonth?.rollover ?? 0;
            let totalBudgeted = 0;
            allocations.forEach((val) => { totalBudgeted += (val || 0); });
            setToBeBudgeted((income + rollover) - totalBudgeted);
        };

        calculateTbb();
        allocations.observe(calculateTbb);
        return () => allocations.unobserve(calculateTbb);
    }, [allocations, budgetMonth?.income, budgetMonth?.rollover, setToBeBudgeted]);

    // Month Navigation Handlers
    const handlePrevMonth = () => {
        const date = parse(currentMonth, 'yyyy-MM', new Date());
        setCurrentMonth(format(subMonths(date, 1), 'yyyy-MM'));
    };

    const handleNextMonth = () => {
        const date = parse(currentMonth, 'yyyy-MM', new Date());
        setCurrentMonth(format(addMonths(date, 1), 'yyyy-MM'));
    };

    const displayMonth = format(parse(currentMonth, 'yyyy-MM', new Date()), 'MMMM yyyy');
    const displayMonthShort = format(parse(currentMonth, 'yyyy-MM', new Date()), 'MMM yyyy');

    return (
        <div className="min-h-screen bg-background text-foreground pb-4 lg:pb-8 selection:bg-emerald-500/20 selection:text-emerald-700 dark:selection:text-emerald-300 relative w-full">

            {/* --- UNIVERSAL NORMAL FLOW HERO AREA (NOT STICKY - Scrolls away organically) --- */}
            <div ref={heroRef} className="flex flex-col pt-8 px-4 max-w-5xl mx-auto">
                {/* Dash Header */}
                <div className="bg-gradient-to-b from-emerald-900 via-emerald-800 to-emerald-900 text-white rounded-3xl md:rounded-[2.5rem] shadow-xl p-6 md:p-8 relative overflow-hidden flex flex-col lg:flex-row lg:items-center justify-between gap-6 md:gap-8">
                    <div className="absolute top-0 right-0 w-64 md:w-96 h-64 md:h-96 bg-emerald-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
                    <div className="hidden lg:block absolute bottom-0 left-0 w-72 h-72 bg-emerald-700/30 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4 pointer-events-none" />

                    <div className="relative z-10 flex flex-col gap-4">
                        <div>
                            <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">Sanchez Family OS</h1>
                            <p className="text-emerald-100/90 font-medium mt-1 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Finance Center
                            </p>
                        </div>

                        {/* Desktop-only internal Month Nav (optional visual balance) */}
                        {activeTab === 'budget' && (
                            <div className="hidden lg:flex items-center gap-4 bg-emerald-950/40 backdrop-blur-md p-1.5 rounded-2xl border border-emerald-700/50 shadow-inner w-fit">
                                <button onClick={handlePrevMonth} className="p-2 hover:bg-emerald-800/50 rounded-xl transition-colors text-emerald-100 hover:text-white"><ChevronLeft className="w-5 h-5" /></button>
                                <div className="flex flex-col items-center min-w-[130px]">
                                    <span className="text-sm font-semibold tracking-wide">{displayMonth}</span>
                                    <AnimatePresence>
                                        {peerCount > 1 && (
                                            <motion.div initial={{ opacity: 0, height: 0, margin: 0 }} animate={{ opacity: 1, height: 'auto', marginTop: 2 }} exit={{ opacity: 0, height: 0, margin: 0 }} className="flex items-center gap-1.5 text-[10px] text-emerald-300 uppercase tracking-wider font-bold overflow-hidden">
                                                <span className="relative flex h-1.5 w-1.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span><span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400"></span></span>
                                                Partner Live
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                                <button onClick={handleNextMonth} className="p-2 hover:bg-emerald-800/50 rounded-xl transition-colors text-emerald-100 hover:text-white"><ChevronRight className="w-5 h-5" /></button>
                            </div>
                        )}
                    </div>

                    {/* Desktop-only internal TBB Card Component */}
                    {activeTab === 'budget' && (
                        <div className="hidden lg:block relative z-10 flex-1 max-w-[350px] lg:max-w-[450px] min-w-0 shrink">
                            <TbbHeroCard month={currentMonth} className="!p-4 sm:!p-6" />
                        </div>
                    )}
                </div>

                {/* Mobile Extra Heroes (Budget Tab) - These act as the scroll trackers for both views since mobile stacks them */}
                {activeTab === 'budget' && (
                    <div className="mt-6 flex flex-col lg:hidden gap-6">
                        <div className="mx-auto flex items-center gap-4 bg-card/80 dark:bg-card/60 backdrop-blur-md p-1.5 rounded-2xl border border-border/50 shadow-sm w-fit">
                            <button onClick={handlePrevMonth} className="p-2 hover:bg-accent rounded-xl transition-colors text-muted-foreground"><ChevronLeft className="w-5 h-5" /></button>
                            <div className="flex flex-col items-center min-w-[130px]">
                                <span className="text-sm font-semibold tracking-wide text-foreground">{displayMonth}</span>
                                <AnimatePresence>
                                    {peerCount > 1 && (
                                        <motion.div initial={{ opacity: 0, height: 0, margin: 0 }} animate={{ opacity: 1, height: 'auto', marginTop: 2 }} exit={{ opacity: 0, height: 0, margin: 0 }} className="flex items-center gap-1.5 text-[10px] text-emerald-500 dark:text-emerald-400 uppercase tracking-wider font-bold overflow-hidden">
                                            <span className="relative flex h-1.5 w-1.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 dark:bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-600 dark:bg-emerald-500"></span></span>
                                            Partner Live
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                            <button onClick={handleNextMonth} className="p-2 hover:bg-accent rounded-xl transition-colors text-muted-foreground"><ChevronRight className="w-5 h-5" /></button>
                        </div>
                        <div>
                            <TbbHeroCard month={currentMonth} />
                        </div>
                    </div>
                )}
            </div>

            {/* --- UNIVERSAL STICKY HEADER ZONE --- */}
            <div className="sticky -top-4 md:-top-8 z-40 w-full flex flex-col gap-2 pb-2 pt-0 md:pt-2 mx-auto max-w-5xl pointer-events-none relative transition-all duration-300">

                {/* Primary Tab Row (Responsive) */}
                <div className="w-full flex justify-center px-1 sm:px-2 md:px-4 pointer-events-auto mt-2 md:mt-0 relative">
                    <motion.div
                        layout
                        className="flex flex-col sm:flex-row items-center gap-0 sm:gap-1 xl:gap-2 p-1 sm:p-1.5 bg-card/90 dark:bg-card/70 backdrop-blur-2xl rounded-2xl sm:rounded-[1.25rem] shadow-lg border border-border/50 dark:border-border/30 w-full sm:w-fit z-20 overflow-hidden shadow-black/5 dark:shadow-black/20 max-w-full"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    >
                        <motion.div layout className="grid grid-cols-4 sm:flex gap-1 sm:gap-1.5 w-full sm:w-auto shrink-0">
                            {TABS.map((tab) => {
                                const Icon = tab.icon;
                                const isActive = activeTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={cn(
                                            "relative flex flex-col sm:flex-row items-center justify-center gap-1 md:gap-1.5 xl:gap-2 px-1 py-1.5 sm:px-2 md:px-2.5 xl:px-4 sm:py-2.5 rounded-[10px] sm:rounded-xl text-[10px] sm:text-[11px] xl:text-sm tracking-tight sm:tracking-normal font-medium transition-colors outline-none",
                                            isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
                                        )}
                                    >
                                        {isActive && (
                                            <motion.div
                                                layoutId="activeTab"
                                                className="absolute inset-0 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-[10px] sm:rounded-xl border border-emerald-500/20"
                                                initial={false}
                                                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                            />
                                        )}
                                        <Icon className={cn("w-4 h-4 sm:w-3.5 sm:h-3.5 xl:w-[18px] xl:h-[18px] relative z-10", isActive && "text-emerald-600 dark:text-emerald-500")} />
                                        <span className="relative z-10 truncate w-full sm:w-auto text-center sm:whitespace-nowrap max-w-[70px] xl:max-w-none">{tab.label}</span>
                                    </button>
                                );
                            })}
                        </motion.div>

                        <AnimatePresence mode="popLayout">
                            {activeTab === 'budget' && showCompactMinis && (
                                <motion.div
                                    layout
                                    initial={{ opacity: 0, scale: 0.9, filter: 'blur(4px)' }}
                                    animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                                    exit={{ opacity: 0, scale: 0.9, filter: 'blur(4px)' }}
                                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                    className="flex w-full sm:w-auto shrink"
                                >
                                    <div className="flex items-center justify-between sm:justify-start gap-2 md:gap-3 xl:gap-6 px-2 sm:px-3 md:px-3 xl:px-4 py-2 sm:py-0 w-full sm:w-auto sm:border-l border-border/50 dark:border-border/30 mt-1 sm:mt-0 border-t sm:border-t-0 bg-background/50 sm:bg-transparent rounded-xl sm:rounded-none overflow-hidden text-ellipsis">
                                        {/* Compact TBB */}
                                        <div className="flex flex-col whitespace-nowrap hidden min-[350px]:flex shrink-0">
                                            <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">
                                                <span className="hidden xl:inline">Remaining</span>
                                                <span className="inline xl:hidden">Left</span>
                                            </span>
                                            <span className={cn("text-xs md:text-sm xl:text-lg font-bold leading-none mt-0.5", toBeBudgeted && toBeBudgeted < 0 ? "text-destructive" : toBeBudgeted && toBeBudgeted > 0 ? "text-success" : "text-foreground")}>
                                                ${(toBeBudgeted || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                            </span>
                                        </div>

                                        {/* Compact Month Nav */}
                                        <div className="flex items-center gap-1 xl:gap-2 ml-auto sm:ml-0 whitespace-nowrap shrink-0">
                                            <button onClick={handlePrevMonth} className="p-1 xl:p-1.5 bg-accent hover:bg-accent/80 md:bg-accent/50 md:hover:bg-accent rounded-lg text-muted-foreground md:text-foreground transition-colors shrink-0"><ChevronLeft className="w-4 h-4 sm:w-3.5 sm:h-3.5 xl:w-4 xl:h-4" /></button>
                                            <span className="text-[11px] md:text-xs xl:text-sm font-bold tracking-tight min-w-[50px] xl:min-w-[80px] text-center">
                                                <span className="hidden xl:inline">{displayMonth}</span>
                                                <span className="inline xl:hidden">{displayMonthShort}</span>
                                            </span>
                                            <button onClick={handleNextMonth} className="p-1 xl:p-1.5 bg-accent hover:bg-accent/80 md:bg-accent/50 md:hover:bg-accent rounded-lg text-muted-foreground md:text-foreground transition-colors shrink-0"><ChevronRight className="w-4 h-4 sm:w-3.5 sm:h-3.5 xl:w-4 xl:h-4" /></button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </div>
            </div>

            {/* Main Content Area */}
            <main className="max-w-5xl mx-auto px-4 mt-8 flex flex-col w-full">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        transition={{ duration: 0.3, ease: 'backOut' }}
                    >
                        <Suspense fallback={<TabLoading />}>
                            {activeTab === 'dashboard' && <DashboardOverview />}
                            {activeTab === 'accounts' && <AccountsList />}
                            {activeTab === 'budget' && <BudgetGrid month={currentMonth} />}
                            {activeTab === 'transactions' && <TransactionsTable />}
                        </Suspense>
                    </motion.div>
                </AnimatePresence>
            </main >

            {/* Global Quick Add (Transactions) */}
            < TransactionFab />
        </div >
    );
}

export default FinanceDashboard;
