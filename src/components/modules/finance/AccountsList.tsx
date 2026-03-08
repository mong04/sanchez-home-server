import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccounts } from '../../../hooks/useFinanceData';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../../common/Card';
import { Button } from '../../common/Button';
import { Plus, CreditCard, Wallet, ArrowRightLeft, Landmark, Edit2, Trash2 } from 'lucide-react';
import { cn, formatCurrency } from '../../../lib/utils';
import { useDeleteAccount } from '../../../hooks/useFinanceData';
import { CreateAccountModal } from './CreateAccountModal';
import { EditAccountModal } from './EditAccountModal';
import { AddTransactionModal } from './AddTransactionModal';
import { ConfirmModal } from '../../common/ConfirmModal';
import type { AccountRecord } from '../../../types/pocketbase';

interface AccountsListProps {
    onCreateAccount?: () => void;
    onAddTransaction?: (accountId?: string) => void;
}

const getAccountIcon = (type: string) => {
    switch (type.toLowerCase()) {
        case 'checking': return <CreditCard className="w-5 h-5" />;
        case 'savings': return <Landmark className="w-5 h-5" />;
        case 'credit': return <ArrowRightLeft className="w-5 h-5" />;
        default: return <Wallet className="w-5 h-5" />;
    }
};

export const AccountsList: React.FC<AccountsListProps> = ({ onCreateAccount, onAddTransaction }) => {
    const { data: accounts, isLoading, error } = useAccounts();
    const deleteAccount = useDeleteAccount();

    // Local modal states
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingAccount, setEditingAccount] = useState<AccountRecord | null>(null);
    const [accountToDelete, setAccountToDelete] = useState<AccountRecord | null>(null);
    const [addTransactionAccountId, setAddTransactionAccountId] = useState<string | null>(null);

    // Prefer local state if props aren't provided
    const handleCreateAccount = () => {
        if (onCreateAccount) onCreateAccount();
        else setIsCreateOpen(true);
    };

    const handleAddTransaction = (accountId: string) => {
        if (onAddTransaction) onAddTransaction(accountId);
        else setAddTransactionAccountId(accountId);
    };

    if (isLoading) {
        return (
            <div className="flex justify-center py-12">
                <div className="animate-pulse flex space-x-4">
                    <div className="h-12 w-12 bg-muted rounded-full"></div>
                    <div className="space-y-3">
                        <div className="h-4 w-32 bg-muted rounded"></div>
                        <div className="h-4 w-24 bg-muted rounded"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-12 border border-destructive/20 rounded-2xl bg-destructive/5 text-destructive px-4">
                <p>Unable to load accounts. Please try again later.</p>
            </div>
        );
    }

    const totalBalance = accounts?.reduce((sum, acc) => sum + acc.currentBalance, 0) || 0;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header section with total net worth/balances */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h2 className="text-3xl font-semibold tracking-tight">Accounts</h2>
                    <p className="text-muted-foreground text-sm flex items-center gap-2">
                        Total Balance: <span className={cn("font-medium", totalBalance >= 0 ? "text-success" : "text-destructive")}>{formatCurrency(totalBalance)}</span>
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="shadow-sm transition-all hover:bg-muted min-h-[44px] md:min-h-0" onClick={handleCreateAccount}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Account
                    </Button>
                </div>
            </div>

            {/* Grid of Accounts */}
            {accounts?.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center justify-center py-20 px-4 border border-dashed border-border rounded-3xl bg-muted/10"
                >
                    <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
                        <Landmark className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-medium mb-2">No accounts yet</h3>
                    <p className="text-muted-foreground mb-6 max-w-sm text-center text-sm">
                        Create your first account to start tracking your balances, transactions, and taking control of your family's finances.
                    </p>
                    <Button onClick={handleCreateAccount} className="shadow-md">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Your First Account
                    </Button>
                </motion.div>
            ) : (
                <motion.div
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    initial="hidden"
                    animate="show"
                    variants={{
                        hidden: { opacity: 0 },
                        show: {
                            opacity: 1,
                            transition: { staggerChildren: 0.05 }
                        }
                    }}
                >
                    <AnimatePresence>
                        {accounts?.map((account) => (
                            <motion.div
                                key={account.id}
                                variants={{
                                    hidden: { opacity: 0, y: 20 },
                                    show: { opacity: 1, y: 0 }
                                }}
                                layout
                            >
                                <Card className="h-full flex flex-col group overflow-hidden transition-all duration-300 hover:shadow-2xl hover:border-primary/20 dark:hover:border-primary/30 relative bg-gradient-to-br from-card to-card hover:to-muted/30">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-110" />
                                    <CardHeader className="pb-2">
                                        <div className="flex items-start justify-between">
                                            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shadow-inner">
                                                {getAccountIcon(account.type)}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="flex opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-10 w-10 md:h-8 md:w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full"
                                                        onClick={() => setEditingAccount(account)}
                                                    >
                                                        <Edit2 className="w-4 h-4 md:w-3.5 md:h-3.5" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-10 w-10 md:h-8 md:w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full"
                                                        onClick={() => setAccountToDelete(account)}
                                                    >
                                                        <Trash2 className="w-4 h-4 md:w-3.5 md:h-3.5" />
                                                    </Button>
                                                </div>
                                                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground bg-muted px-2 py-1 rounded-full cursor-default">
                                                    {account.type}
                                                </p>
                                            </div>
                                        </div>
                                        <CardTitle className="mt-4 text-xl">{account.name}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="flex-grow space-y-1">
                                        <p className={cn(
                                            "text-3xl font-semibold tracking-tight transition-colors duration-300",
                                            account.currentBalance < 0 ? "text-destructive" : "text-foreground"
                                        )}>
                                            {formatCurrency(account.currentBalance)}
                                        </p>
                                    </CardContent>
                                    <CardFooter className="pt-4 border-t border-border/50 bg-muted/5 flex justify-between items-center group-hover:bg-muted/10 transition-colors">
                                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                                            {account.transactionCount} transactions
                                        </p>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity flex items-center -mr-2 text-primary hover:text-primary hover:bg-primary/10 min-h-[44px] md:min-h-0"
                                            onClick={() => handleAddTransaction(account.id)}
                                        >
                                            <Plus className="w-4 h-4 mr-1" />
                                            <span>Transaction</span>
                                        </Button>
                                    </CardFooter>
                                </Card>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </motion.div>
            )}

            {/* Modals */}
            <CreateAccountModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />

            <EditAccountModal
                isOpen={!!editingAccount}
                onClose={() => setEditingAccount(null)}
                account={editingAccount}
            />

            <AddTransactionModal
                isOpen={!!addTransactionAccountId}
                onClose={() => setAddTransactionAccountId(null)}
                preselectedAccountId={addTransactionAccountId || undefined}
            />

            <ConfirmModal
                isOpen={!!accountToDelete}
                title="Delete Account?"
                description={`This will permanently delete ${accountToDelete?.name} and all associated transactions.`}
                confirmText="Delete Account"
                onConfirm={() => {
                    if (accountToDelete) deleteAccount.mutate(accountToDelete.id);
                }}
                onCancel={() => setAccountToDelete(null)}
            />
        </div>
    );
};

export default AccountsList;
