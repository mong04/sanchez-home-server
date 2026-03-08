import { useState, useEffect } from 'react';
import { Modal } from '../../../common/Modal';
import { Button } from '../../../common/Button';
import { Input } from '../../../common/Input';
import { Select } from '../../../common/Select';
import { Label } from '../../../common/Label';
import { PredictiveEmojiBar } from '../../../common/PredictiveEmojiBar';
import { DEFAULT_GROUPS } from './BudgetGroupHeader';
import type { CategoryRecord } from '../../../../types/pocketbase';

interface EditCategoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    category: CategoryRecord | null;
    onCommit: (
        categoryId: string,
        name: string,
        icon: string,
        groupId: string,
        isGoal: boolean,
        isRecurring: boolean,
        amount: number,
        frequency: 'monthly' | 'quarterly' | 'yearly' | undefined,
        dueDay: number | undefined,
        startDate: string
    ) => void;
    isPending: boolean;
    getEffectiveGroupId: (cat: CategoryRecord) => string;
}

export function EditCategoryModal({
    isOpen,
    onClose,
    category,
    onCommit,
    isPending,
    getEffectiveGroupId,
}: EditCategoryModalProps) {
    const [name, setName] = useState('');
    const [icon, setIcon] = useState('📝');
    const [group, setGroup] = useState('other');
    const [isGoal, setIsGoal] = useState(false);
    const [isRecurring, setIsRecurring] = useState(false);

    // Shared numeric fields
    const [amount, setAmount] = useState('');
    const [frequency, setFrequency] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');
    const [dueDay, setDueDay] = useState<number>(1);
    const [startDate, setStartDate] = useState('');

    // Sync local state when category changes
    useEffect(() => {
        if (category) {
            setName(category.name);
            setIcon(category.icon || '📝');
            setGroup(getEffectiveGroupId(category));

            const catIsRecurring = !!category.isRecurring;
            setIsRecurring(catIsRecurring);

            const hasGoal = !catIsRecurring && (category.amount || 0) > 0;
            setIsGoal(hasGoal);

            setAmount(category.amount ? category.amount.toString() : '');
            setFrequency(category.frequency || 'monthly');
            setDueDay(category.dueDay || 1);
            setStartDate(category.startDate ? category.startDate.split('T')[0] : '');
        }
    }, [category?.id]);

    const handleCommit = () => {
        if (!category || !name.trim()) return;
        const finalAmount = parseFloat(amount) || 0;
        const finalDate = startDate ? new Date(startDate).toISOString() : '';
        onCommit(
            category.id,
            name.trim(),
            icon,
            group,
            isGoal,
            isRecurring,
            finalAmount,
            frequency,
            dueDay,
            finalDate
        );
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Edit Category"
            footer={
                <>
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleCommit} disabled={isPending || !name.trim()} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                        {isPending ? 'Saving...' : 'Save Changes'}
                    </Button>
                </>
            }
        >
            <div className="space-y-5">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center text-2xl shrink-0 select-none" aria-hidden>{icon}</div>
                    <div className="flex-1 space-y-1">
                        <Label htmlFor="editCatName">Category Name</Label>
                        <Input id="editCatName" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleCommit()} autoFocus />
                    </div>
                </div>
                <div className="space-y-1.5">
                    <Label>Icon</Label>
                    <PredictiveEmojiBar searchTerm={name} currentEmoji={icon} onSelect={(emoji) => setIcon(emoji)} />
                </div>
                <div className="space-y-1.5 pt-2 border-t border-border">
                    <Label htmlFor="editCatGroup">Budget Group</Label>
                    <p className="text-xs text-muted-foreground -mt-0.5">Move this category to a different group.</p>
                    <Select value={group} onChange={(e) => setGroup(e.target.value)} options={DEFAULT_GROUPS.map((g) => ({ value: g.id, label: g.icon + '  ' + g.label }))} />
                </div>
                <div className="pt-2 border-t border-border space-y-4">
                    {/* Goal Toggle */}
                    <label className="flex items-center justify-between cursor-pointer group">
                        <div className="space-y-0.5">
                            <div className="font-medium text-foreground group-hover:text-primary transition-colors">Savings Goal</div>
                            <div className="text-xs text-muted-foreground">Set a target amount (e.g., Vacation Fund).</div>
                        </div>
                        <div className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${isGoal ? 'bg-primary' : 'bg-muted'}`}>
                            <input
                                type="checkbox"
                                className="sr-only"
                                checked={isGoal}
                                onChange={(e) => {
                                    setIsGoal(e.target.checked);
                                    if (e.target.checked) setIsRecurring(false);
                                }}
                            />
                            <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow ring-0 transition duration-200 ease-in-out ${isGoal ? 'translate-x-5' : 'translate-x-0'}`} />
                        </div>
                    </label>

                    {isGoal && (
                        <div className="animate-in fade-in slide-in-from-top-2 duration-200 grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                            <div className="space-y-1">
                                <Label htmlFor="editTargetAmount">Target Amount</Label>
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</div>
                                    <Input id="editTargetAmount" type="number" className="pl-6" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="editTargetDate">Target Date (Optional)</Label>
                                <Input id="editTargetDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="[color-scheme:light] dark:[color-scheme:dark]" />
                            </div>
                        </div>
                    )}

                    {/* Recurring Bill Toggle */}
                    <label className="flex items-center justify-between cursor-pointer group pt-2 border-t border-border/50">
                        <div className="space-y-0.5">
                            <div className="font-medium text-foreground group-hover:text-primary transition-colors">Recurring Bill</div>
                            <div className="text-xs text-muted-foreground">Set a standard monthly amount and frequency.</div>
                        </div>
                        <div className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${isRecurring ? 'bg-primary' : 'bg-muted'}`}>
                            <input
                                type="checkbox"
                                className="sr-only"
                                checked={isRecurring}
                                onChange={(e) => {
                                    setIsRecurring(e.target.checked);
                                    if (e.target.checked) setIsGoal(false);
                                }}
                            />
                            <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow ring-0 transition duration-200 ease-in-out ${isRecurring ? 'translate-x-5' : 'translate-x-0'}`} />
                        </div>
                    </label>

                    {isRecurring && (
                        <div className="animate-in fade-in slide-in-from-top-2 duration-200 space-y-4 pt-2">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label htmlFor="editCatAmount">Goal Amount</Label>
                                    <div className="relative">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</div>
                                        <Input id="editCatAmount" type="number" className="pl-6" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Label>Frequency</Label>
                                    <Select
                                        value={frequency}
                                        onChange={(e) => setFrequency(e.target.value as 'monthly' | 'quarterly' | 'yearly')}
                                        options={[{ value: 'monthly', label: 'Monthly' }, { value: 'quarterly', label: 'Quarterly' }, { value: 'yearly', label: 'Yearly' }]}
                                    />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="editCatStartDate">Next Due Date</Label>
                                <Input id="editCatStartDate" type="date" value={startDate} onChange={(e) => {
                                    const val = e.target.value;
                                    setStartDate(val);
                                    if (val) {
                                        setDueDay(parseInt(val.split('-')[2], 10));
                                    }
                                }} className="[color-scheme:light] dark:[color-scheme:dark]" />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
}
