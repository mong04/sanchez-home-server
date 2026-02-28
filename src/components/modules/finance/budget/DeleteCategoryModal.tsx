// src/components/modules/finance/budget/DeleteCategoryModal.tsx
// Self-contained confirmation modal for deleting a budget category.
// Pure presentation — no internal state.

import { Modal } from '../../../common/Modal';
import { Button } from '../../../common/Button';
import { Trash2 } from 'lucide-react';
import type { CategoryRecord } from '../../../../types/pocketbase';

interface DeleteCategoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    category: CategoryRecord | null;
    onConfirmDelete: (categoryId: string) => void;
    isPending: boolean;
}

export function DeleteCategoryModal({
    isOpen,
    onClose,
    category,
    onConfirmDelete,
    isPending,
}: DeleteCategoryModalProps) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Delete Category?"
            footer={
                <>
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button
                        onClick={() => { if (category) { onConfirmDelete(category.id); onClose(); } }}
                        disabled={isPending}
                        className="bg-destructive hover:bg-destructive/90 text-destructive-foreground gap-2"
                    >
                        <Trash2 className="w-4 h-4" />
                        {isPending ? 'Deleting...' : 'Yes, Delete'}
                    </Button>
                </>
            }
        >
            <div className="space-y-3">
                <div className="flex items-center gap-3 p-4 bg-destructive/5 border border-destructive/20 rounded-xl">
                    <span className="text-2xl shrink-0" aria-hidden>{category?.icon || 'x'}</span>
                    <div>
                        <div className="font-semibold text-foreground">{category?.name}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">This will permanently delete this category.</div>
                    </div>
                </div>
                <p className="text-sm text-muted-foreground">Any transactions linked to this category will remain but will no longer be categorized. This cannot be undone.</p>
            </div>
        </Modal>
    );
}
