import React, { useState } from 'react';
import { useBills } from '../../../hooks/use-organizer';
import { AccessibleButton } from '../../common/AccessibleButton';

export function FinanceTracker() {
    const { items: bills, addBill, togglePaid, deleteBill } = useBills();

    const [name, setName] = useState('');
    const [amount, setAmount] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [category, setCategory] = useState('Utility');

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !amount || !dueDate) return;

        addBill(name, Number(amount), new Date(dueDate).getTime(), category);
        setName('');
        setAmount('');
        setDueDate('');
    };

    const isOverdue = (dueDate: number) => {
        return dueDate < Date.now();
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString();
    };

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-semibold mb-4">Finance Tracker</h2>

            {/* Add Bill Form */}
            <form onSubmit={handleAdd} className="bg-card p-4 rounded-lg shadow-sm border border-border space-y-4">
                <h3 className="text-lg font-medium text-card-foreground">Add New Bill</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-1">
                        <label htmlFor="bill-name" className="block text-sm font-medium text-muted-foreground">Name</label>
                        <input
                            id="bill-name"
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="mt-1 block w-full rounded-md border-input bg-background text-foreground shadow-sm focus:border-ring focus:ring-ring sm:text-sm"
                            placeholder="e.g. Electric"
                        />
                    </div>
                    <div className="md:col-span-1">
                        <label htmlFor="bill-amount" className="block text-sm font-medium text-muted-foreground">Amount ($)</label>
                        <input
                            id="bill-amount"
                            type="number"
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            className="mt-1 block w-full rounded-md border-input bg-background text-foreground shadow-sm focus:border-ring focus:ring-ring sm:text-sm"
                            min="0"
                            step="0.01"
                        />
                    </div>
                    <div className="md:col-span-1">
                        <label htmlFor="bill-date" className="block text-sm font-medium text-muted-foreground">Due Date</label>
                        <input
                            id="bill-date"
                            type="date"
                            value={dueDate}
                            onChange={e => setDueDate(e.target.value)}
                            className="mt-1 block w-full rounded-md border-input bg-background text-foreground shadow-sm focus:border-ring focus:ring-ring sm:text-sm"
                        />
                    </div>
                    <div className="md:col-span-1">
                        <label htmlFor="bill-category" className="block text-sm font-medium text-muted-foreground">Category</label>
                        <select
                            id="bill-category"
                            value={category}
                            onChange={e => setCategory(e.target.value)}
                            className="mt-1 block w-full rounded-md border-input bg-background text-foreground shadow-sm focus:border-ring focus:ring-ring sm:text-sm"
                        >
                            <option>Utility</option>
                            <option>Subscription</option>
                            <option>Housing</option>
                            <option>Credit</option>
                            <option>Medical</option>
                            <option>Other</option>
                        </select>
                    </div>
                </div>
                <div className="flex justify-end">
                    <AccessibleButton type="submit" label="Add Bill">Add Bill</AccessibleButton>
                </div>
            </form>

            <div className="overflow-x-auto rounded-lg border border-border">
                <table className="min-w-full divide-y divide-border">
                    <caption className="sr-only">List of upcoming bills and their status</caption>
                    <thead className="bg-muted/50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Bill Name</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Amount</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Due Date</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-card divide-y divide-border">
                        {bills.map(bill => {
                            const overdue = !bill.isPaid && isOverdue(bill.dueDate);
                            return (
                                <tr key={bill.id} className={bill.isPaid ? 'bg-muted/30' : ''}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                                        {bill.name}
                                        {overdue && (
                                            <span className="ml-2 inline-flex items-center text-destructive font-bold text-xs uppercase" aria-label="Overdue">
                                                <svg className="h-4 w-4 mr-1 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                </svg>
                                                Overdue
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                        ${bill.amount.toFixed(2)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                        {formatDate(bill.dueDate)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${bill.isPaid
                                            ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                                            : overdue
                                                ? 'bg-destructive/10 text-destructive'
                                                : 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'
                                            }`}>
                                            {bill.isPaid ? 'Paid' : overdue ? 'Past Due' : 'Unpaid'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <AccessibleButton
                                            onClick={() => togglePaid(bill.id)}
                                            label={bill.isPaid ? `Mark ${bill.name} as unpaid` : `Mark ${bill.name} as paid`}
                                            variant={bill.isPaid ? 'secondary' : 'primary'}
                                            className="mr-2 text-xs"
                                        >
                                            {bill.isPaid ? 'Undo' : 'Pay'}
                                        </AccessibleButton>
                                        <button
                                            onClick={() => deleteBill(bill.id)}
                                            className="text-destructive hover:text-destructive/80 text-xs underline"
                                            aria-label={`Delete bill: ${bill.name}`}
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {bills.length === 0 && (
                <div className="text-center text-muted-foreground py-12">
                    <p>No bills tracked yet. Add one above.</p>
                </div>
            )}
        </div>
    );
}
