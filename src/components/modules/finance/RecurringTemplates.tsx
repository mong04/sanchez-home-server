import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Repeat, Calendar, DollarSign, Bell, MoreVertical, Trash } from 'lucide-react';
import confetti from 'canvas-confetti';
import { format, parseISO } from 'date-fns';

import { useRecurringTransactions, useUpdateRecurringTransaction, useDeleteRecurringTransaction, useAddTransaction } from '../../../hooks/useFinanceData';
import { formatCurrency, cn } from '../../../lib/utils';
import type { RecurringTransactionRecord, TransactionRecord } from '../../../types/pocketbase';

export function RecurringTemplates() {
    const { data: templates, isLoading } = useRecurringTransactions();

    if (isLoading) {
        return (
            <div className="w-full h-64 flex flex-col items-center justify-center text-muted-foreground animate-pulse">
                <Repeat className="w-8 h-8 mb-4 opacity-50" />
                <p>Loading templates...</p>
            </div>
        );
    }

    if (!templates || templates.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 md:p-12 text-center h-[50vh] animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                    <Repeat className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-foreground mb-2">No Recurring Templates</h3>
                <p className="text-muted-foreground max-w-sm mx-auto mb-8">
                    To save time, you can create auto-applying templates for subscriptions, paychecks, or regular bills directly from any transaction.
                </p>
                <div className="p-4 bg-muted/50 rounded-2xl border border-border/50 text-left max-w-sm w-full mx-auto shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mt-16 -mr-16 pointer-events-none" />
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-1.5 bg-background rounded-lg border border-border shadow-sm">
                            <Repeat className="w-4 h-4 text-primary" />
                        </div>
                        <span className="text-sm font-semibold">How to create one:</span>
                    </div>
                    <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside px-1">
                        <li>Go to the <span className="font-medium text-foreground">Activity</span> tab</li>
                        <li>Find a transaction you want to repeat</li>
                        <li>Click <span className="font-medium text-foreground">Create Template from This</span></li>
                    </ol>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 pb-24 space-y-4 md:space-y-6">
            <div className="flex items-center justify-between mb-2">
                <div>
                    <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                        Recurring Templates
                    </h2>
                    <p className="text-sm text-muted-foreground">Manage your auto-scheduled transactions</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AnimatePresence>
                    {templates.map((template, index) => (
                        <TemplateCard key={template.id} template={template} index={index} />
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}

function TemplateCard({ template, index }: { template: RecurringTransactionRecord, index: number }) {
    const updateTemplate = useUpdateRecurringTransaction();
    const deleteTemplate = useDeleteRecurringTransaction();
    const addTransaction = useAddTransaction();

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isApplying, setIsApplying] = useState(false);

    // Provide safe fallbacks if relations aren't expanded properly
    const sourceTx = template.expand?.templateTransactionId as TransactionRecord | undefined;
    const payeeName = sourceTx?.payee || 'Unknown Payee';
    const amount = sourceTx?.amount || 0;
    const categoryName = sourceTx?.expand?.category?.name || 'Category';

    const handleApplyNow = async () => {
        if (!sourceTx || isApplying) return;
        setIsApplying(true);

        try {
            await addTransaction.mutateAsync({
                amount: sourceTx.amount,
                category: sourceTx.category,
                account: sourceTx.account,
                date: new Date().toISOString(),
                type: sourceTx.type,
                payee: sourceTx.payee,
                notes: `Auto-applied from template`,
                cleared: false
            });

            // Trigger Confetti
            const end = Date.now() + 1.5 * 1000;
            const colors = ['#10b981', '#3b82f6']; // emerald and blue

            (function frame() {
                confetti({
                    particleCount: 5,
                    angle: 60,
                    spread: 55,
                    origin: { x: 0 },
                    colors: colors
                });
                confetti({
                    particleCount: 5,
                    angle: 120,
                    spread: 55,
                    origin: { x: 1 },
                    colors: colors
                });

                if (Date.now() < end) {
                    requestAnimationFrame(frame);
                }
            }());

            // Quick haptic
            if ('vibrate' in navigator) navigator.vibrate([50, 50, 50]);

            // Update nextDate to roughly next week/month depending on frequency
            // (A more accurate date-fns math would be ideal here)
            const currentNextDate = template.nextDate ? parseISO(template.nextDate) : new Date();
            let newNextDate = new Date(currentNextDate);
            if (template.frequency === 'weekly') newNextDate.setDate(newNextDate.getDate() + 7);
            else if (template.frequency === 'biweekly') newNextDate.setDate(newNextDate.getDate() + 14);
            else if (template.frequency === 'monthly') newNextDate.setMonth(newNextDate.getMonth() + 1);
            else if (template.frequency === 'yearly') newNextDate.setFullYear(newNextDate.getFullYear() + 1);

            await updateTemplate.mutateAsync({
                id: template.id,
                data: { nextDate: newNextDate.toISOString() }
            });

        } catch (error) {
            console.error('Failed to apply template', error);
        } finally {
            setIsApplying(false);
        }
    };

    const toggleAutoApply = () => {
        updateTemplate.mutate({
            id: template.id,
            data: { autoApply: !template.autoApply }
        });
    };

    const handleDelete = () => {
        if (confirm(`Remove template for ${payeeName}?`)) {
            deleteTemplate.mutate(template.id);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ delay: index * 0.05, duration: 0.3 }}
            className="group relative bg-card rounded-2xl p-5 border border-border shadow-sm hover:shadow-md transition-all flex flex-col gap-4 overflow-hidden"
        >
            {/* Header info */}
            <div className="flex justify-between items-start gap-3">
                <div className="flex-1 min-w-0 flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 shrink-0">
                        {amount > 0 ? <DollarSign className="w-5 h-5 text-success" /> : <Repeat className="w-5 h-5 text-primary" />}
                    </div>
                    <div className="min-w-0">
                        <h3 className="font-semibold text-foreground truncate">{payeeName}</h3>
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5 opacity-80 mt-0.5">
                            <span className="capitalize">{template.frequency}</span> • {categoryName}
                        </p>
                    </div>
                </div>

                <div className="text-right shrink-0">
                    <div className={cn("text-lg font-bold leading-none", amount > 0 ? 'text-success' : 'text-foreground')}>
                        {formatCurrency(Math.abs(amount))}
                    </div>
                    {/* Auto apply badge */}
                    {template.autoApply ? (
                        <div className="mt-1.5 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                            Auto
                        </div>
                    ) : (
                        <div className="mt-1.5 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-muted text-muted-foreground border border-border/50">
                            Manual
                        </div>
                    )}
                </div>
            </div>

            {/* Next Due Section */}
            <div className="bg-muted/30 rounded-xl p-3 border border-border/30 flex items-center justify-between gap-4 mt-auto">
                <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground opacity-70" />
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Next Due</span>
                        <span className="text-sm font-medium text-foreground">
                            {template.nextDate ? format(parseISO(template.nextDate), 'MMM do, yyyy') : 'Unscheduled'}
                        </span>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                    <button
                        onClick={handleApplyNow}
                        disabled={isApplying}
                        className="py-1.5 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-bold shadow-sm hover:shadow active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none"
                    >
                        {isApplying ? 'Applying...' : 'Apply Now'}
                    </button>

                    {/* Tiny Menu */}
                    <div className="relative">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors active:scale-95"
                        >
                            <MoreVertical className="w-4 h-4" />
                        </button>

                        <AnimatePresence>
                            {isMenuOpen && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setIsMenuOpen(false)} />
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95, transformOrigin: 'top right' }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="absolute right-0 top-full mt-1 w-48 bg-popover border border-border shadow-xl rounded-xl overflow-hidden z-20 py-1"
                                    >
                                        <button
                                            onClick={() => { toggleAutoApply(); setIsMenuOpen(false); }}
                                            className="w-full text-left px-3 py-2.5 text-sm hover:bg-accent flex items-center gap-2.5 font-medium transition-colors"
                                        >
                                            <Bell className="w-4 h-4 text-muted-foreground" />
                                            {template.autoApply ? 'Disable Auto-Apply' : 'Enable Auto-Apply'}
                                        </button>
                                        <div className="h-px w-full bg-border/50 my-1" />
                                        <button
                                            onClick={() => { handleDelete(); setIsMenuOpen(false); }}
                                            className="w-full text-left px-3 py-2.5 text-sm hover:bg-destructive/10 text-destructive flex items-center gap-2.5 font-medium transition-colors"
                                        >
                                            <Trash className="w-4 h-4" />
                                            Delete Template
                                        </button>
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

        </motion.div>
    );
}

export default RecurringTemplates;
