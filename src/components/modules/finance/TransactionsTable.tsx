import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    useTransactions,
    useDeleteTransaction,
    useToggleCleared
} from '../../../hooks/useFinanceData';
import {
    format,
    parseISO
} from 'date-fns';
import {
    CheckCircle2,
    Circle,
    ArrowDownRight,
    ArrowUpRight,
    Search,
    Trash2,
    Edit2,
    Upload
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

    const handleEdit = (tx: TransactionRecord) => {
        if (onEditTransaction) {
            onEditTransaction(tx);
        } else {
            setEditingTransaction(tx);
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
                                                {format(parseISO(tx.date), 'MMM d, yyyy')}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-foreground">{tx.payee}</div>
                                                <div className="text-xs text-muted-foreground mt-0.5 flex items-center">
                                                    <span className="bg-muted px-2 py-0.5 rounded-md inline-block">
                                                        {tx.expand?.category?.name || 'Uncategorized'}
                                                    </span>
                                                    {tx.notes && <span className="ml-2 truncate max-w-[150px] opacity-70"> • {tx.notes}</span>}
                                                </div>
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
                <div className="lg:hidden divide-y divide-border/50 min-h-[400px] flex-1 overflow-y-auto !scrollbar-hide [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                    <AnimatePresence initial={false}>
                        {filteredTransactions.length === 0 ? (
                            <div className="p-16 text-center text-muted-foreground text-sm">
                                {searchTerm ? 'No transactions match your search.' : 'No transactions found.'}
                            </div>
                        ) : (
                            filteredTransactions.map((tx) => (
                                <motion.div
                                    key={`mobile-${tx.id}`}
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.2 }}
                                    className="p-4 bg-card active:bg-muted/20 transition-colors flex items-center justify-between gap-3 relative cursor-pointer"
                                    onClick={() => handleEdit(tx)}
                                >
                                    <div className="flex-shrink-0">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleCleared.mutate({ id: tx.id, cleared: !tx.cleared });
                                            }}
                                            className="flex items-center justify-center w-11 h-11 focus:outline-none focus:ring-2 focus:ring-primary/50 rounded-full transition-transform active:scale-90"
                                        >
                                            {tx.cleared ? (
                                                <CheckCircle2 className="w-6 h-6 text-success" />
                                            ) : (
                                                <Circle className="w-6 h-6 text-muted-foreground/30" />
                                            )}
                                        </button>
                                    </div>
                                    <div className="flex-grow min-w-0">
                                        <div className="font-medium text-foreground truncate">{tx.payee}</div>
                                        <div className="text-xs mt-1 flex items-center gap-2 text-muted-foreground line-clamp-1">
                                            <span>{format(parseISO(tx.date), 'MMM d, yyyy')}</span>
                                            {tx.expand?.category?.name && (
                                                <span className="bg-muted px-1.5 py-0.5 rounded-md truncate max-w-[120px]">
                                                    {tx.expand.category.name}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end flex-shrink-0 gap-2">
                                        <div className={cn(
                                            "font-semibold text-sm",
                                            (tx.amount || 0) < 0 ? "text-foreground" : "text-success"
                                        )}>
                                            {(tx.amount || 0) < 0 ? <ArrowDownRight className="inline w-3 h-3 mr-0.5 opacity-70" /> : <ArrowUpRight className="inline w-3 h-3 mr-0.5 opacity-70" />}
                                            {formatCurrency(tx.amount || 0)}
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setTransactionToDelete(tx);
                                            }}
                                            className="text-muted-foreground text-xs hover:text-destructive flex items-center gap-1 p-2 -mr-2 -mb-2 rounded-full"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </motion.div>
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
                            {format(parseISO(transactionToDelete.date), 'MMM d, yyyy')} • {transactionToDelete.expand?.category?.name || 'Uncategorized'}
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default TransactionsTable;
