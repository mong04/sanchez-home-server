import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    useTransactions,
    useDeleteTransaction,
    useToggleCleared,
    useCreateRecurringTransaction,
    useUpdateTransaction
} from '../../../hooks/useFinanceData';
import {
    format,
    parseISO,
    addMonths
} from 'date-fns';
import confetti from 'canvas-confetti';
import {
    CheckCircle2,
    Circle,
    ArrowDownRight,
    ArrowUpRight,
    Search,
    Trash2,
    Edit2,
    Upload,
    Repeat,
    Flag,
    MoreHorizontal
} from 'lucide-react';
import { cn, formatCurrency } from '../../../lib/utils';
import { Button } from '../../common/Button';
import { Modal } from '../../common/Modal';
import type { TransactionRecord } from '../../../types/pocketbase';
import { EditTransactionModal } from './EditTransactionModal';

interface TransactionsTableProps {
    accountId?: string;
    onImportCSV?: () => void;
    onEditTransaction?: (transaction: TransactionRecord) => void;
}

export const TransactionsTable: React.FC<TransactionsTableProps> = ({ accountId, onImportCSV, onEditTransaction }) => {
    const { data: transactions, isLoading } = useTransactions({ accountId });
    const toggleCleared = useToggleCleared();
    const deleteTransaction = useDeleteTransaction();
    const [searchTerm, setSearchTerm] = useState('');
    const [editingTransaction, setEditingTransaction] = useState<TransactionRecord | null>(null);
    const [transactionToDelete, setTransactionToDelete] = useState<TransactionRecord | null>(null);
    const [transactionToFlag, setTransactionToFlag] = useState<TransactionRecord | null>(null);
    const [flagNote, setFlagNote] = useState('');
    const updateTransaction = useUpdateTransaction();

    const createTemplate = useCreateRecurringTransaction();
    const [isCreatingTemplate, setIsCreatingTemplate] = useState<string | null>(null);

    const handleCreateTemplate = async (tx: TransactionRecord) => {
        if (isCreatingTemplate) return;
        setIsCreatingTemplate(tx.id);

        try {
            await createTemplate.mutateAsync({
                templateTransactionId: tx.id,
                frequency: 'monthly',
                nextDate: addMonths(new Date(), 1).toISOString(),
                autoApply: false,
            });

            // Trigger Confetti
            const end = Date.now() + 1.0 * 1000;
            const colors = ['#10b981', '#3b82f6'];
            (function frame() {
                confetti({
                    particleCount: 5, angle: 60, spread: 55, origin: { x: 0 }, colors
                });
                confetti({
                    particleCount: 5, angle: 120, spread: 55, origin: { x: 1 }, colors
                });
                if (Date.now() < end) requestAnimationFrame(frame);
            }());
        } catch (e) {
            console.error("Failed to create template", e);
        } finally {
            setIsCreatingTemplate(null);
        }
    };

    const handleEdit = (tx: TransactionRecord) => {
        if (onEditTransaction) {
            onEditTransaction(tx);
        } else {
            setEditingTransaction(tx);
        }
    };

    const handleToggleFlag = (tx: TransactionRecord) => {
        const currentlyNeedsReview = !!tx.needsReview;
        if (!currentlyNeedsReview) {
            setTransactionToFlag(tx);
            setFlagNote(tx.reviewNote || '');
        } else {
            // Clearing the flag clears the note too
            updateTransaction.mutate({ id: tx.id, data: { needsReview: false, reviewNote: '' } });
        }
    };

    const filteredTransactions = React.useMemo(() => {
        if (!transactions) return [];
        if (!searchTerm) return transactions;
        const lowerSearch = searchTerm.toLowerCase();
        return transactions.filter(tx =>
            tx.payee?.toLowerCase().includes(lowerSearch) ||
            tx.notes?.toLowerCase().includes(lowerSearch) ||
            tx.expand?.category?.name?.toLowerCase().includes(lowerSearch)
        );
    }, [transactions, searchTerm]);

    if (isLoading) {
        return (
            <div className="w-full space-y-4 py-8">
                <div className="h-10 w-full max-w-sm bg-muted animate-pulse rounded-lg"></div>
                <div className="space-y-2">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="h-16 w-full bg-muted animate-pulse rounded-xl"></div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 pt-4 pb-24 md:pb-6">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="relative w-full sm:w-80 group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <input
                        type="text"
                        placeholder="Search transactions..."
                        className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-shadow text-sm min-h-[44px] md:min-h-0"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={onImportCSV} className="shadow-sm min-h-[44px] md:min-h-0">
                        <Upload className="w-4 h-4 mr-2" />
                        Import CSV
                    </Button>
                </div>
            </div>

            {/* Table Container */}
            <div className="border border-border bg-card rounded-2xl shadow-sm flex flex-col h-[calc(100dvh-200px)] lg:h-[calc(100dvh-160px)] overflow-hidden">
                <div className="hidden lg:block overflow-y-auto w-full !scrollbar-hide [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden flex-1 min-h-[400px] relative">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-muted-foreground uppercase bg-muted/95 backdrop-blur-md sticky top-0 z-20 shadow-sm">
                            <tr>
                                <th className="px-6 py-4 font-medium tracking-wider w-12 text-center">Clr</th>
                                <th className="px-6 py-4 font-medium tracking-wider w-32">Date</th>
                                <th className="px-6 py-4 font-medium tracking-wider">Payee & Category</th>
                                <th className="px-6 py-4 font-medium tracking-wider hidden lg:table-cell">Account</th>
                                <th className="px-6 py-4 font-medium tracking-wider text-right">Amount</th>
                                <th className="px-6 py-4 font-medium tracking-wider w-16"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            <AnimatePresence initial={false}>
                                {filteredTransactions.length === 0 ? (
                                    <tr className="bg-transparent">
                                        <td colSpan={6} className="px-6 py-16 text-center text-muted-foreground text-sm">
                                            {searchTerm ? 'No transactions match your search.' : 'No transactions found.'}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredTransactions.map((tx) => (
                                        <motion.tr
                                            key={tx.id}
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            transition={{ duration: 0.2 }}
                                            className="group hover:bg-muted/20 transition-colors bg-card"
                                        >
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => toggleCleared.mutate({ id: tx.id, cleared: !tx.cleared })}
                                                    className="flex items-center justify-center w-full min-h-[44px] md:min-h-0 focus:outline-none focus:ring-2 focus:ring-primary/50 rounded-full transition-transform active:scale-90"
                                                >
                                                    {tx.cleared ? (
                                                        <CheckCircle2 className="w-5 h-5 text-success" />
                                                    ) : (
                                                        <Circle className="w-5 h-5 text-muted-foreground/30 group-hover:text-muted-foreground/60" />
                                                    )}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                                                {tx.date && !isNaN(parseISO(tx.date).getTime())
                                                    ? format(parseISO(tx.date), 'MMM d, yyyy')
                                                    : 'Unknown Date'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-foreground">{tx.payee}</div>
                                                <div className="text-xs text-muted-foreground mt-0.5 flex flex-wrap items-center gap-1.5">
                                                    <span className="bg-muted px-2 py-0.5 rounded-md inline-block">
                                                        {tx.expand?.category?.name || 'Uncategorized'}
                                                    </span>
                                                    {tx.needsReview && (
                                                        <span className="bg-destructive/10 text-destructive font-semibold px-1.5 py-0.5 rounded flex items-center gap-1 shrink-0">
                                                            <Flag className="w-3 h-3 fill-destructive" /> Needs Review
                                                        </span>
                                                    )}
                                                </div>
                                                {(tx.reviewNote || tx.notes) && (
                                                    <div className="text-xs text-muted-foreground mt-1.5 line-clamp-2 max-w-[300px] xl:max-w-md">
                                                        {tx.reviewNote && <span className="text-foreground/80 font-medium mr-1 border-l-2 border-destructive pl-1.5">Review: {tx.reviewNote}</span>}
                                                        {tx.notes && <span className="opacity-70">{tx.needsReview && tx.reviewNote ? ' • ' : ''}{tx.notes}</span>}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 hidden lg:table-cell">
                                                <div className="flex items-center text-muted-foreground text-sm">
                                                    {tx.expand?.account?.name || 'Unknown Account'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right whitespace-nowrap">
                                                <div className={cn(
                                                    "font-medium flex items-center justify-end gap-1.5",
                                                    (tx.amount || 0) < 0 ? "text-foreground" : "text-success"
                                                )}>
                                                    {(tx.amount || 0) < 0 ? <ArrowDownRight className="w-3.5 h-3.5 opacity-70" /> : <ArrowUpRight className="w-3.5 h-3.5 opacity-70" />}
                                                    {formatCurrency(tx.amount || 0)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-11 w-11 lg:h-8 lg:w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full"
                                                        onClick={() => handleCreateTemplate(tx)}
                                                        disabled={isCreatingTemplate === tx.id}
                                                    >
                                                        <Repeat className={cn("w-4 h-4 lg:w-4 lg:h-4", isCreatingTemplate === tx.id && "animate-spin")} />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className={cn("h-11 w-11 lg:h-8 lg:w-8 hover:text-destructive hover:bg-destructive/10 rounded-full", tx.needsReview ? "text-destructive bg-destructive/10" : "text-muted-foreground")}
                                                        onClick={() => handleToggleFlag(tx)}
                                                    >
                                                        <Flag className={cn("w-4 h-4 lg:w-4 lg:h-4", tx.needsReview && "fill-destructive")} />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-11 w-11 lg:h-8 lg:w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full"
                                                        onClick={() => handleEdit(tx)}
                                                    >
                                                        <Edit2 className="w-4 h-4 lg:w-4 lg:h-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-11 w-11 lg:h-8 lg:w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full"
                                                        onClick={() => setTransactionToDelete(tx)}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))
                                )}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>

                {/* Mobile Card List View */}
                <div className="lg:hidden flex-1 overflow-y-auto w-full pb-20 mt-4 space-y-3">
                    <AnimatePresence initial={false}>
                        {filteredTransactions.length === 0 ? (
                            <div className="p-16 text-center text-muted-foreground text-sm">
                                {searchTerm ? 'No transactions match your search.' : 'No transactions found.'}
                            </div>
                        ) : (
                            filteredTransactions.map((tx) => (
                                <MobileCard
                                    key={`mobile-${tx.id}`}
                                    tx={tx}
                                    toggleCleared={toggleCleared}
                                    handleEdit={handleEdit}
                                    handleCreateTemplate={handleCreateTemplate}
                                    handleToggleFlag={handleToggleFlag}
                                    setTransactionToDelete={setTransactionToDelete}
                                    isCreatingTemplate={isCreatingTemplate === tx.id}
                                />
                            ))
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <EditTransactionModal
                isOpen={!!editingTransaction}
                onClose={() => setEditingTransaction(null)}
                transaction={editingTransaction}
            />

            <Modal
                isOpen={!!transactionToDelete}
                onClose={() => setTransactionToDelete(null)}
                title="Delete Transaction"
                description="Are you sure you want to delete this transaction? This action cannot be undone."
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setTransactionToDelete(null)}>Cancel</Button>
                        <Button
                            variant="destructive"
                            onClick={() => {
                                if (transactionToDelete) {
                                    deleteTransaction.mutate(transactionToDelete.id, {
                                        onSettled: () => setTransactionToDelete(null)
                                    });
                                }
                            }}
                            disabled={deleteTransaction.isPending}
                        >
                            {deleteTransaction.isPending ? 'Deleting...' : 'Delete'}
                        </Button>
                    </>
                }
            >
                {transactionToDelete && (
                    <div className="bg-muted/50 p-4 rounded-xl space-y-2 border border-border">
                        <div className="flex justify-between items-start">
                            <span className="font-semibold text-foreground">{transactionToDelete.payee}</span>
                            <span className={cn(
                                "font-bold",
                                (transactionToDelete.amount || 0) < 0 ? "text-foreground" : "text-success"
                            )}>
                                {formatCurrency(transactionToDelete.amount || 0)}
                            </span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                            {transactionToDelete.date && !isNaN(parseISO(transactionToDelete.date).getTime())
                                ? format(parseISO(transactionToDelete.date), 'MMM d, yyyy')
                                : 'Unknown Date'} • {transactionToDelete.expand?.category?.name || 'Uncategorized'}
                        </div>
                    </div>
                )}
            </Modal>

            <Modal
                isOpen={!!transactionToFlag}
                onClose={() => {
                    setTransactionToFlag(null);
                    setFlagNote('');
                }}
                title="Flag Needs Review"
                description={`Are you sure you want to flag "${transactionToFlag?.payee}" for review?`}
                footer={
                    <>
                        <Button variant="ghost" onClick={() => {
                            setTransactionToFlag(null);
                            setFlagNote('');
                        }}>Cancel</Button>
                        <Button
                            variant="default"
                            onClick={() => {
                                if (transactionToFlag) {
                                    updateTransaction.mutate({
                                        id: transactionToFlag.id,
                                        data: { needsReview: true, reviewNote: flagNote.trim() }
                                    }, {
                                        onSettled: () => {
                                            setTransactionToFlag(null);
                                            setFlagNote('');
                                        }
                                    });
                                }
                            }}
                            disabled={updateTransaction.isPending}
                        >
                            {updateTransaction.isPending ? 'Flagging...' : 'Flag Transaction'}
                        </Button>
                    </>
                }
            >
                <div className="space-y-4 mt-2">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Optional Note</label>
                        <input
                            type="text"
                            placeholder="Why does this need review?"
                            className="flex min-h-[44px] md:min-h-0 md:h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-shadow"
                            value={flagNote}
                            onChange={(e) => setFlagNote(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && transactionToFlag && !updateTransaction.isPending) {
                                    updateTransaction.mutate({
                                        id: transactionToFlag.id,
                                        data: { needsReview: true, reviewNote: flagNote.trim() }
                                    }, {
                                        onSettled: () => {
                                            setTransactionToFlag(null);
                                            setFlagNote('');
                                        }
                                    });
                                }
                            }}
                            autoFocus
                        />
                    </div>
                </div>
            </Modal>
        </div>
    );
};

const MobileCard = ({ tx, toggleCleared, handleEdit, handleCreateTemplate, handleToggleFlag, setTransactionToDelete, isCreatingTemplate }: any) => {
    const [menuOpen, setMenuOpen] = useState(false);
    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="p-4 bg-card border border-border rounded-xl shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] active:bg-muted/30 transition-colors flex flex-col gap-3 relative mx-1"
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            toggleCleared.mutate({ id: tx.id, cleared: !tx.cleared });
                        }}
                        className="flex items-center justify-center shrink-0 w-10 h-10 -ml-2 focus:outline-none focus:ring-2 focus:ring-primary/50 rounded-full transition-transform active:scale-90"
                    >
                        {tx.cleared ? (
                            <CheckCircle2 className="w-6 h-6 text-success" />
                        ) : (
                            <Circle className="w-6 h-6 text-muted-foreground/30" />
                        )}
                    </button>
                    <div className="flex-1 min-w-0 pt-0.5 cursor-pointer" onClick={() => handleEdit(tx)}>
                        <div className="font-semibold text-foreground truncate text-base">{tx.payee}</div>
                        <div className="text-xs mt-1 flex flex-wrap items-center gap-2 text-muted-foreground">
                            <span>
                                {tx.date && !isNaN(parseISO(tx.date).getTime())
                                    ? format(parseISO(tx.date), 'MMM d, yyyy')
                                    : 'Unknown Date'}
                            </span>
                            {tx.expand?.category?.name && (
                                <span className="bg-muted/80 px-1.5 py-0.5 rounded-md truncate max-w-[120px]">
                                    {tx.expand.category.name}
                                </span>
                            )}
                            {tx.needsReview && (
                                <span className="bg-destructive/10 text-destructive font-semibold px-1.5 py-0.5 rounded flex items-center gap-1">
                                    <Flag className="w-2.5 h-2.5 fill-destructive" /> Needs Review
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex flex-col items-end shrink-0 gap-1 pt-0.5 cursor-pointer" onClick={() => handleEdit(tx)}>
                    <div className={cn(
                        "font-bold text-base whitespace-nowrap",
                        (tx.amount || 0) < 0 ? "text-foreground" : "text-success"
                    )}>
                        {(tx.amount || 0) < 0 ? <ArrowDownRight className="inline w-3.5 h-3.5 mr-0.5 opacity-70" /> : <ArrowUpRight className="inline w-3.5 h-3.5 mr-0.5 opacity-70" />}
                        {formatCurrency(tx.amount || 0)}
                    </div>
                </div>
            </div>

            {(tx.reviewNote || tx.notes) && (
                <div className="text-sm text-muted-foreground bg-muted/30 p-2.5 rounded-lg border border-border/50 ml-[42px] cursor-pointer" onClick={() => handleEdit(tx)}>
                    {tx.reviewNote && <div className="text-foreground/90 font-medium mb-0.5 flex flex-col gap-0.5"><span className="text-[10px] uppercase font-bold text-destructive">Review Note</span>{tx.reviewNote}</div>}
                    {tx.notes && <div className={cn("opacity-80 leading-snug", tx.reviewNote && "mt-1.5 pt-1.5 border-t border-border/50")}>{tx.notes}</div>}
                </div>
            )}

            <div className="flex justify-end ml-[42px] mt-1 relative z-10 h-8">
                <AnimatePresence mode="wait">
                    {menuOpen ? (
                        <motion.div
                            key="menu"
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: 'auto', opacity: 1 }}
                            exit={{ width: 0, opacity: 0 }}
                            className="flex bg-muted rounded-full border border-border shadow-sm p-[2px] overflow-hidden absolute right-0 bottom-0"
                        >
                            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full hover:bg-background text-muted-foreground" onClick={() => { handleCreateTemplate(tx); setMenuOpen(false); }} disabled={isCreatingTemplate}>
                                <Repeat className={cn("w-3.5 h-3.5", isCreatingTemplate && "animate-spin")} />
                            </Button>
                            <Button variant="ghost" size="icon" className={cn("h-7 w-7 rounded-full hover:bg-background mx-0.5", tx.needsReview ? "text-destructive" : "text-muted-foreground")} onClick={() => { handleToggleFlag(tx); setMenuOpen(false); }}>
                                <Flag className={cn("w-3.5 h-3.5", tx.needsReview && "fill-destructive")} />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full hover:bg-background text-muted-foreground mr-0.5" onClick={() => { handleEdit(tx); setMenuOpen(false); }}>
                                <Edit2 className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full hover:bg-background text-destructive" onClick={() => { setTransactionToDelete(tx); setMenuOpen(false); }}>
                                <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                            <div className="w-[1px] bg-border/50 mx-1 my-1"></div>
                            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full bg-background border border-border shadow-sm text-foreground active:scale-95 transition-transform" onClick={() => setMenuOpen(false)}>
                                <MoreHorizontal className="w-4 h-4" />
                            </Button>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="toggle"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute right-0 bottom-0"
                        >
                            <Button variant="ghost" size="sm" className="h-8 px-2.5 rounded-full text-muted-foreground active:bg-muted border border-transparent hover:border-border hover:bg-muted/50" onClick={(e) => { e.stopPropagation(); setMenuOpen(true); }}>
                                <MoreHorizontal className="w-4 h-4" />
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};

export default TransactionsTable;
