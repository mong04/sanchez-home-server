import { useState, useEffect } from 'react';
import { AlertCircle, Save } from 'lucide-react';
import type { EnvelopeRecord } from '../../../../types/pocketbase';
import { cn } from '../../../../lib/utils';
import { Button } from '../../../common/Button';
import { useBulkUpdateEnvelopes } from '../hooks/useBulkUpdateEnvelopes';

interface BudgetAllocationProps {
    envelopes: EnvelopeRecord[];
    onClose?: () => void;
}

export function BudgetAllocation({ envelopes, onClose }: BudgetAllocationProps) {
    const [localEnvelopes, setLocalEnvelopes] = useState(envelopes);
    const [hasChanges, setHasChanges] = useState(false);
    const updateEnvelopesMutation = useBulkUpdateEnvelopes();

    // Sync local state when props change
    useEffect(() => {
        setLocalEnvelopes(envelopes);
    }, [envelopes]);

    const handleLimitChange = (id: string, newLimit: string) => {
        const limit = parseFloat(newLimit) || 0;
        setLocalEnvelopes(prev => prev.map(env =>
            env.id === id ? { ...env, budget_limit: limit } : env
        ));
        setHasChanges(true);
    };

    const handleSave = async () => {
        const updates = localEnvelopes
            .filter(local => {
                const original = envelopes.find(e => e.id === local.id);
                return original && original.budget_limit !== local.budget_limit;
            })
            .map(updated => ({
                id: updated.id,
                data: { budget_limit: updated.budget_limit }
            }));

        if (updates.length > 0) {
            await updateEnvelopesMutation.mutateAsync({ updates });
            setHasChanges(false);
            if (onClose) onClose();
        }
    };

    const totalAllocation = localEnvelopes.reduce((sum, env) => sum + (env.budget_limit || 0), 0);
    const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

    return (
        <div className="space-y-4">
            {/* Header / Actions */}
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border">
                <div>
                    <h3 className="text-lg font-semibold">Budget Allocation</h3>
                    <p className="text-sm text-muted-foreground">Total Budget: <span className="font-bold text-foreground">{formatCurrency(totalAllocation)}</span></p>
                </div>
                <div className="flex gap-2">
                    <Button variant="ghost" onClick={onClose} disabled={updateEnvelopesMutation.isPending}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={!hasChanges || updateEnvelopesMutation.isPending}
                        className="gap-2"
                    >
                        {updateEnvelopesMutation.isPending ? 'Saving...' : <><Save className="w-4 h-4" /> Save Changes</>}
                    </Button>
                </div>
            </div>

            {/* Allocation Grid */}
            <div className="rounded-md border border-border bg-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full caption-bottom text-sm text-left">
                        <thead className="[&_tr]:border-b bg-muted/50">
                            <tr className="border-b transition-colors data-[state=selected]:bg-muted">
                                <th className="h-10 px-4 align-middle font-medium text-muted-foreground w-[200px]">Category</th>
                                <th className="h-10 px-4 align-middle font-medium text-muted-foreground">Current Balance</th>
                                <th className="h-10 px-4 align-middle font-medium text-muted-foreground w-[150px]">New Limit</th>
                                <th className="h-10 px-4 align-middle font-medium text-muted-foreground w-[100px]">Rollover</th>
                            </tr>
                        </thead>
                        <tbody className="[&_tr:last-child]:border-0">
                            {localEnvelopes.map((env) => (
                                <tr key={env.id} className="border-b border-border/50 transition-colors hover:bg-muted/50">
                                    {/* Category Name */}
                                    <td className="p-4 align-middle font-medium text-foreground">
                                        {env.name}
                                    </td>

                                    {/* Balance with Over Budget Indicator */}
                                    <td className="p-4 align-middle">
                                        <span className={cn(
                                            "font-variant-numeric: tabular-nums",
                                            (env.current_balance || 0) < 0 ? "text-destructive font-bold" : "text-foreground"
                                        )}>
                                            {formatCurrency(env.current_balance || 0)}
                                            {(env.current_balance || 0) < 0 && <AlertCircle className="inline ml-2 w-4 h-4" />}
                                        </span>
                                    </td>

                                    {/* Editable Limit Input */}
                                    <td className="p-4 align-middle">
                                        <input
                                            type="number"
                                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 text-right font-mono"
                                            value={env.budget_limit || ''}
                                            onChange={(e) => handleLimitChange(env.id, e.target.value)}
                                        />
                                    </td>

                                    {/* Rollover Toggle (Mock for now) */}
                                    <td className="p-4 align-middle text-center">
                                        <div className="inline-flex items-center justify-center w-4 h-4 rounded border border-primary bg-primary text-primary-foreground">
                                            <span className="text-[10px] font-bold">✓</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
