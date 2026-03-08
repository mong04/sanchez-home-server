import { useState, useEffect } from 'react';
import { Repeat, Calendar as CalendarIcon, Bell } from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';
import { cn } from '../../../../lib/utils';
import { Modal } from '../../../common/Modal';
import { Button } from '../../../common/Button';
import { useUpdateRecurringTransaction } from '../../../../hooks/useFinanceData';
import type { RecurringTransactionRecord, TransactionRecord } from '../../../../types/pocketbase';

interface EditTemplateModalProps {
    isOpen: boolean;
    onClose: () => void;
    template: RecurringTransactionRecord | null;
}

export function EditTemplateModal({ isOpen, onClose, template }: EditTemplateModalProps) {
    const updateTemplate = useUpdateRecurringTransaction();

    const [frequency, setFrequency] = useState<RecurringTransactionRecord['frequency']>('monthly');
    const [nextDateStr, setNextDateStr] = useState<string>('');
    const [autoApply, setAutoApply] = useState(false);
    const [notes, setNotes] = useState('');
    const [error, setError] = useState<string | null>(null);

    // Reset local state when modal opens or template changes
    useEffect(() => {
        if (template && isOpen) {
            setFrequency(template.frequency || 'monthly');
            setNextDateStr(template.nextDate ? format(parseISO(template.nextDate), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'));
            setAutoApply(!!template.autoApply);
            setNotes(template.notes || '');
            setError(null);
        }
    }, [template, isOpen]);

    const handleSave = async () => {
        if (!template) return;

        // Basic validation
        const parsedDate = new Date(nextDateStr);
        if (!isValid(parsedDate)) {
            setError('Please select a valid next due date.');
            return;
        }

        try {
            await updateTemplate.mutateAsync({
                id: template.id,
                data: {
                    frequency,
                    nextDate: parsedDate.toISOString(),
                    autoApply,
                    notes: notes.trim()
                }
            });
            onClose();
        } catch (error) {
            console.error('Failed to update template', error);
        }
    };

    if (!template) return null;

    // Derived info for display
    const sourceTx = template.expand?.templateTransactionId as TransactionRecord | undefined;
    const payeeName = sourceTx?.payee || 'Unknown Payee';
    const amount = sourceTx?.amount || 0;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Edit Recurring Template"
            description="Update the schedule or auto-apply settings for this template."
            footer={
                <>
                    <Button variant="ghost" onClick={onClose} disabled={updateTemplate.isPending}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={updateTemplate.isPending}>
                        {updateTemplate.isPending ? 'Saving...' : 'Save Changes'}
                    </Button>
                </>
            }
        >
            <div className="space-y-6 mt-2">
                {/* Header Context (Read-Only) */}
                <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 flex items-center justify-between">
                    <div>
                        <div className="text-sm font-medium text-foreground">{payeeName}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">Template Source Transaction</div>
                    </div>
                    <div className={cn("font-bold text-base", amount > 0 ? "text-success" : "text-foreground")}>
                        {amount < 0 ? '-' : ''}${Math.abs(amount).toFixed(2)}
                    </div>
                </div>

                {error && (
                    <div className="p-3 rounded-xl bg-destructive/10 text-destructive border border-destructive/20 text-sm font-medium animate-in fade-in slide-in-from-top-2">
                        {error}
                    </div>
                )}

                <div className="space-y-4">
                    {/* Frequency */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground flex items-center gap-2">
                            <Repeat className="w-4 h-4 text-primary" />
                            Repeat Frequency
                        </label>
                        <select
                            value={frequency}
                            onChange={(e) => setFrequency(e.target.value as any)}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-shadow"
                        >
                            <option value="weekly">Weekly</option>
                            <option value="biweekly">Every 2 Weeks</option>
                            <option value="monthly">Monthly</option>
                            <option value="yearly">Yearly</option>
                        </select>
                    </div>

                    {/* Next Date */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground flex items-center gap-2">
                            <CalendarIcon className="w-4 h-4 text-primary" />
                            Next Due Date
                        </label>
                        <input
                            type="date"
                            value={nextDateStr}
                            onChange={(e) => {
                                setNextDateStr(e.target.value);
                                setError(null);
                            }}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-shadow"
                        />
                    </div>

                    {/* Auto-Apply Toggle */}
                    <div className="flex items-center justify-between pt-4 border-t border-border/50">
                        <div className="space-y-0.5 pr-4">
                            <div className="text-sm font-medium text-foreground flex items-center gap-2">
                                <Bell className="w-4 h-4 text-primary" />
                                Auto-Apply Automatically
                            </div>
                            <div className="text-xs text-muted-foreground">
                                If enabled, this transaction will automatically write to your ledger on the due date. Otherwise, it will just remind you.
                            </div>
                        </div>
                        <button
                            type="button"
                            className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                            style={{ backgroundColor: autoApply ? 'var(--color-primary)' : 'var(--color-muted)' }}
                            onClick={() => setAutoApply(!autoApply)}
                        >
                            <span className={cn(
                                "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow ring-0 transition duration-200 ease-in-out",
                                autoApply ? "translate-x-5" : "translate-x-0"
                            )} />
                        </button>
                    </div>

                    {/* Notes */}
                    <div className="space-y-2 pt-2">
                        <label className="text-sm font-medium text-foreground">
                            Notes (Optional)
                        </label>
                        <input
                            type="text"
                            placeholder="Add a note for this template..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-shadow"
                        />
                    </div>
                </div>
            </div>
        </Modal>
    );
}
