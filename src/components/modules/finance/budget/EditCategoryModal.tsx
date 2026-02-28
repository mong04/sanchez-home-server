// src/components/modules/finance/budget/EditCategoryModal.tsx
// Self-contained modal for editing a category's name, icon, and group.
// Owns: editing form state (name, icon, group).

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
    onCommit: (categoryId: string, name: string, icon: string, groupId: string) => void;
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

    // Sync local state when category changes
    useEffect(() => {
        if (category) {
            setName(category.name);
            setIcon(category.icon || '📝');
            setGroup(getEffectiveGroupId(category));
        }
    }, [category?.id]);

    const handleCommit = () => {
        if (!category || !name.trim()) return;
        onCommit(category.id, name.trim(), icon, group);
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
                <div className="space-y-1.5">
                    <Label htmlFor="editCatGroup">Budget Group</Label>
                    <p className="text-xs text-muted-foreground -mt-0.5">Move this category to a different group.</p>
                    <Select value={group} onChange={(e) => setGroup(e.target.value)} options={DEFAULT_GROUPS.map((g) => ({ value: g.id, label: g.icon + '  ' + g.label }))} />
                </div>
            </div>
        </Modal>
    );
}
