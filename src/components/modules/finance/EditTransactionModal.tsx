import React, { useState, useEffect } from 'react';
import { Modal } from '../../common/Modal';
import { Button } from '../../common/Button';
import { useUpdateTransaction, useAccounts, useCategories } from '../../../hooks/useFinanceData';
import type { TransactionRecord } from '../../../types/pocketbase';
import { AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

interface EditTransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
    transaction: TransactionRecord | null;
}

export const EditTransactionModal: React.FC<EditTransactionModalProps> = ({
    isOpen,
    onClose,
    transaction
}) => {
    const updateTransaction = useUpdateTransaction();
    const { data: accounts } = useAccounts();
    const { data: expenseCategories } = useCategories('expense');
    const { data: incomeCategories } = useCategories('income');

    const [type, setType] = useState<'expense' | 'income'>('expense');
    const [accountId, setAccountId] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [amount, setAmount] = useState('');
    const [payee, setPayee] = useState('');
    const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [notes, setNotes] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen && transaction) {
            setAccountId(transaction.account);
            setCategoryId(transaction.category || '');
            setAmount(Math.abs(transaction.amount || 0).toString());
            setPayee(transaction.payee || '');
            setDate(transaction.date && !isNaN(new Date(transaction.date).getTime())
                ? format(new Date(transaction.date), 'yyyy-MM-dd')
                : format(new Date(), 'yyyy-MM-dd'));
            setNotes(transaction.notes || '');
            setType((transaction.amount || 0) >= 0 ? 'income' : 'expense');
        }
    }, [isOpen, transaction]);

    const availableCategories = type === 'expense' ? expenseCategories : incomeCategories;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!accountId) return setError('Please select an account');
        if (!categoryId) return setError('Please select a category');
        if (!payee.trim()) return setError('Please enter a payee');

        const amountNum = parseFloat(amount);
        if (isNaN(amountNum) || amountNum <= 0) return setError('Please enter a valid positive amount');

        try {
            if (!transaction?.id) throw new Error('No transaction selected');

            await updateTransaction.mutateAsync({
                id: transaction.id,
                data: {
                    account: accountId,
                    category: categoryId,
                    amount: type === 'expense' ? -Math.abs(amountNum) : Math.abs(amountNum),
                    payee: payee.trim(),
                    date: new Date(date).toISOString(),
                    notes: notes.trim(),
                }
            });

            // Reset and close
            onClose();
        } catch (err: any) {
            setError(err?.message || 'Failed to update transaction');
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Edit Transaction"
            description="Update the details of your transaction."
        >
            <form onSubmit={handleSubmit} className="space-y-5 mt-2">
                {error && (
                    <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-start gap-2 animate-in fade-in">
                        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                        <p>{error}</p>
                    </div>
                )}

                {/* Transaction Type Toggle */}
                <div className="flex p-1 bg-muted/50 rounded-lg border border-border">
                    <button
                        type="button"
                        onClick={() => {
                            setType('expense');
                            setCategoryId('');
                        }}
                        className={`flex-1 min-h-[44px] md:min-h-0 py-1.5 text-sm font-medium rounded-md transition-all ${type === 'expense' ? 'bg-background shadow-sm border border-border text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        Expense
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setType('income');
                            setCategoryId('');
                        }}
                        className={`flex-1 min-h-[44px] md:min-h-0 py-1.5 text-sm font-medium rounded-md transition-all ${type === 'income' ? 'bg-background shadow-sm border border-border text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        Income
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {/* Amount */}
                    <div className="space-y-2 col-span-2 sm:col-span-1">
                        <label className="text-sm font-medium text-foreground">Amount</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                $
                            </span>
                            <input
                                required
                                type="number"
                                step="0.01"
                                min="0.01"
                                placeholder="0.00"
                                className="flex min-h-[44px] md:min-h-0 md:h-10 w-full pl-7 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-shadow"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                autoFocus
                            />
                        </div>
                    </div>

                    {/* Date */}
                    <div className="space-y-2 col-span-2 sm:col-span-1">
                        <label className="text-sm font-medium text-foreground">Date</label>
                        <input
                            required
                            type="date"
                            className="flex min-h-[44px] md:min-h-0 md:h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-shadow"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                        />
                    </div>
                </div>

                {/* Payee */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Payee</label>
                    <input
                        required
                        type="text"
                        placeholder="e.g. Target, Amazon, Paycheck"
                        className="flex min-h-[44px] md:min-h-0 md:h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-shadow"
                        value={payee}
                        onChange={(e) => setPayee(e.target.value)}
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Account Dropdown */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Account</label>
                        <select
                            required
                            className="flex min-h-[44px] md:min-h-0 md:h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-shadow appearance-none"
                            value={accountId}
                            onChange={(e) => setAccountId(e.target.value)}
                        >
                            <option value="" disabled>Select account...</option>
                            {accounts?.map(acc => (
                                <option key={acc.id} value={acc.id}>{acc.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Category Dropdown */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Category</label>
                        <select
                            required
                            className="flex min-h-[44px] md:min-h-0 md:h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-shadow appearance-none"
                            value={categoryId}
                            onChange={(e) => setCategoryId(e.target.value)}
                        >
                            <option value="" disabled>Select category...</option>
                            {availableCategories?.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Notes (Optional)</label>
                    <input
                        type="text"
                        placeholder="Add a note..."
                        className="flex min-h-[44px] md:min-h-0 md:h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-shadow"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                    />
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-border mt-6">
                    <Button type="button" variant="ghost" onClick={onClose} disabled={updateTransaction.isPending} className="min-h-[44px] md:min-h-0">
                        Cancel
                    </Button>
                    <Button type="submit" disabled={updateTransaction.isPending || !accountId || !categoryId || !amount || !payee} className="min-h-[44px] md:min-h-0">
                        {updateTransaction.isPending ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};
