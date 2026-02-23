import React, { useState } from 'react';
import { Modal } from '../../common/Modal';
import { Button } from '../../common/Button';
import { useCreateAccount } from '../../../hooks/useFinanceData';
import { Landmark, CreditCard, ArrowRightLeft, Wallet, AlertCircle } from 'lucide-react';
import { cn } from '../../../lib/utils';
import type { AccountRecord } from '../../../types/pocketbase';

interface CreateAccountModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ACCOUNT_TYPES = [
    { id: 'checking', label: 'Checking', icon: CreditCard, description: 'Everyday spending and bills' },
    { id: 'savings', label: 'Savings', icon: Landmark, description: 'Emergency fund and goals' },
    { id: 'credit_card', label: 'Credit Card', icon: ArrowRightLeft, description: 'Pay off in full every month' },
    { id: 'other', label: 'Other', icon: Wallet, description: 'Cash, investments, etc.' },
];

export const CreateAccountModal: React.FC<CreateAccountModalProps> = ({ isOpen, onClose }) => {
    const createAccount = useCreateAccount();
    const [name, setName] = useState('');
    const [type, setType] = useState<AccountRecord['type'] | ''>('');
    const [initialBalance, setInitialBalance] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!name.trim()) return setError('Please enter an account name');
        if (!type) return setError('Please select an account type');

        const balanceNum = parseFloat(initialBalance);
        if (isNaN(balanceNum)) return setError('Please enter a valid initial balance');

        try {
            await createAccount.mutateAsync({
                name: name.trim(),
                type: type as AccountRecord['type'],
                initialBalance: balanceNum
            });

            // Reset and close
            setName('');
            setType('');
            setInitialBalance('');
            onClose();
        } catch (err: any) {
            setError(err?.message || 'Failed to create account');
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Add New Account"
            description="Create a new account to start tracking its balance and transactions."
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                    <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-start gap-2 animate-in fade-in">
                        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                        <p>{error}</p>
                    </div>
                )}

                <div className="space-y-2">
                    <label htmlFor="accountName" className="text-sm font-medium text-foreground">
                        Account Name
                    </label>
                    <input
                        id="accountName"
                        type="text"
                        placeholder="e.g. Chase Sapphire, Joint Checking"
                        className="flex min-h-[44px] md:min-h-0 md:h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-shadow"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        autoFocus
                    />
                </div>

                <div className="space-y-3">
                    <label className="text-sm font-medium text-foreground">
                        Account Type
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {ACCOUNT_TYPES.map((t) => {
                            const Icon = t.icon;
                            const isSelected = type === t.id;
                            return (
                                <button
                                    key={t.id}
                                    type="button"
                                    onClick={() => setType(t.id as AccountRecord['type'])}
                                    className={cn(
                                        "flex flex-col items-start p-4 border rounded-xl transition-all duration-200 text-left focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:ring-offset-background",
                                        isSelected
                                            ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary"
                                            : "border-border bg-card hover:border-border/80 hover:bg-muted/30"
                                    )}
                                >
                                    <div className="flex items-center gap-2 mb-1.5 w-full">
                                        <div className={cn(
                                            "w-8 h-8 rounded-full flex items-center justify-center transition-colors text-primary",
                                            isSelected ? "bg-primary/20" : "bg-primary/10"
                                        )}>
                                            <Icon className="w-4 h-4" />
                                        </div>
                                        <span className={cn(
                                            "font-medium",
                                            isSelected ? "text-primary" : "text-foreground"
                                        )}>
                                            {t.label}
                                        </span>
                                    </div>
                                    <span className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                                        {t.description}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="space-y-2">
                    <label htmlFor="initialBalance" className="text-sm font-medium text-foreground">
                        Current Balance
                    </label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground select-none">
                            $
                        </span>
                        <input
                            id="initialBalance"
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            className="flex min-h-[44px] md:min-h-0 md:h-10 w-full pl-7 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-shadow"
                            value={initialBalance}
                            onChange={(e) => setInitialBalance(e.target.value)}
                        />
                    </div>
                    <p className="text-xs text-muted-foreground">
                        For credit cards, enter a negative number (e.g. -450.00).
                    </p>
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-border mt-6">
                    <Button type="button" variant="ghost" onClick={onClose} disabled={createAccount.isPending} className="min-h-[44px] md:min-h-0">
                        Cancel
                    </Button>
                    <Button type="submit" disabled={createAccount.isPending || !name || !type || !initialBalance} className="min-h-[44px] md:min-h-0">
                        {createAccount.isPending ? 'Creating...' : 'Create Account'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};
