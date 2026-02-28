// src/components/modules/finance/budget/MarkPaidModal.tsx
// Self-contained modal for marking a recurring bill as paid.
// Owns: split state, validation logic, confirm handler.

import { useState, useEffect } from 'react';
import { Modal } from '../../../common/Modal';
import { Button } from '../../../common/Button';
import { Input } from '../../../common/Input';
import { Select } from '../../../common/Select';
import { AlertTriangle } from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { formatCurrency } from '../../../../lib/utils';
import type { RecurringConfig } from '../../../../store/useRecurringStore';

interface AccountRecord {
    id: string;
    name: string;
    currentBalance: number;
}

interface MarkPaidModalProps {
    isOpen: boolean;
    onClose: () => void;
    categoryId: string;
    categoryName: string;
    recurringConfig: RecurringConfig | null;
    categoryAmount: number;
    accounts: AccountRecord[] | undefined;
    onConfirm: (categoryId: string, splits: { accountId: string; amount: number }[]) => Promise<void>;
}

export function MarkPaidModal({
    isOpen,
    onClose,
    categoryId,
    categoryName,
    recurringConfig,
    categoryAmount,
    accounts,
    onConfirm,
}: MarkPaidModalProps) {
    const [splits, setSplits] = useState<{ id: string; accountId: string; amount: number }[]>([]);
    const [isPending, setIsPending] = useState(false);

    // Initialize splits when modal opens
    useEffect(() => {
        if (isOpen) {
            const defaultAmount = recurringConfig?.amount || categoryAmount || 0;
            const defaultAccountId = accounts && accounts.length > 0 ? accounts[0].id : '';
            setSplits([{ id: crypto.randomUUID(), accountId: defaultAccountId, amount: defaultAmount }]);
            setIsPending(false);
        }
    }, [isOpen, categoryId]);

    const targetGoal = recurringConfig?.amount || categoryAmount || 0;
    const currentSplitTotal = splits.reduce((sum, s) => sum + s.amount, 0);
    const remainingToAssign = targetGoal - currentSplitTotal;
    const isSplitValid = Math.abs(remainingToAssign) < 0.01;
    const splitValidationError = !isSplitValid
        ? (remainingToAssign > 0
            ? `${formatCurrency(remainingToAssign)} remaining`
            : `${formatCurrency(Math.abs(remainingToAssign))} over`)
        : null;

    const handleConfirm = async () => {
        if (!isSplitValid || splits.some((s) => !s.accountId)) return;
        setIsPending(true);
        try {
            await onConfirm(categoryId, splits.map((s) => ({ accountId: s.accountId, amount: s.amount })));
            onClose();
        } catch (err) {
            console.error('Failed to log split transactions', err);
        } finally {
            setIsPending(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Mark ${categoryName} Paid`}
            footer={
                <>
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={isPending || !isSplitValid || splits.some((s) => !s.accountId)}
                        className="bg-success hover:bg-success/90 text-success-foreground"
                    >
                        {isPending ? 'Logging...' : 'Confirm'}
                    </Button>
                </>
            }
        >
            <div className="space-y-4">
                <div className="bg-muted/50 p-4 rounded-xl flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">Target Amount</span>
                    <div className="text-right">
                        <span className="text-lg font-bold text-foreground block">{formatCurrency(targetGoal)}</span>
                        {splitValidationError && (
                            <span className={cn('text-xs', remainingToAssign > 0 ? 'text-primary' : 'text-destructive')}>
                                {splitValidationError}
                            </span>
                        )}
                    </div>
                </div>

                <div className="space-y-3">
                    <h4 className="text-sm font-medium text-muted-foreground">Payment Accounts</h4>
                    <div className="space-y-2">
                        {splits.map((split, index) => (
                            <div key={split.id} className="flex items-center gap-2 group">
                                <div className="flex-1">
                                    <Select
                                        value={split.accountId}
                                        onChange={(e) => {
                                            const newSplits = [...splits];
                                            newSplits[index].accountId = e.target.value;
                                            setSplits(newSplits);
                                        }}
                                        options={accounts?.map((a) => ({ value: a.id, label: `${a.name} (${formatCurrency(a.currentBalance)})` })) || []}
                                    />
                                </div>
                                <div className="w-28 relative">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</div>
                                    <Input
                                        type="number"
                                        value={split.amount || ''}
                                        onChange={(e) => {
                                            const newSplits = [...splits];
                                            newSplits[index].amount = parseFloat(e.target.value) || 0;
                                            setSplits(newSplits);
                                        }}
                                        className="pl-6 h-11 text-right"
                                        placeholder="0.00"
                                    />
                                </div>
                                {splits.length > 1 && (
                                    <button
                                        onClick={() => setSplits(splits.filter((s) => s.id !== split.id))}
                                        className="p-2 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                        aria-label="Remove split"
                                    >
                                        <AlertTriangle className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    {splits.length < 5 && (
                        <button
                            onClick={() => setSplits([...splits, {
                                id: crypto.randomUUID(),
                                accountId: accounts && accounts.length > 0 ? accounts[0].id : '',
                                amount: remainingToAssign > 0 ? remainingToAssign : 0,
                            }])}
                            className="text-sm font-medium text-primary hover:text-primary/80 transition-colors flex items-center gap-1 py-1"
                        >
                            + Add Split
                        </button>
                    )}
                </div>
            </div>
        </Modal>
    );
}
