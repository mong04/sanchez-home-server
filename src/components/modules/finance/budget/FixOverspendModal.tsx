// src/components/modules/finance/budget/FixOverspendModal.tsx
// Self-contained modal for covering overspent categories.
// Owns zero state — pure presentation + callbacks.

import { Modal } from '../../../common/Modal';
import { formatCurrency } from '../../../../lib/utils';
import type { CategoryRecord } from '../../../../types/pocketbase';

interface FixOverspendModalProps {
    isOpen: boolean;
    onClose: () => void;
    overspentCat: CategoryRecord | null;
    categories: CategoryRecord[];
    localAllocations: Record<string, number>;
    spentByCategory: Record<string, number>;
    onCover: (donorCatId: string, amount: number) => void;
}

export function FixOverspendModal({
    isOpen,
    onClose,
    overspentCat,
    categories,
    localAllocations,
    spentByCategory,
    onCover,
}: FixOverspendModalProps) {
    if (!overspentCat) return null;

    const overspentAmount = Math.abs(
        (localAllocations[overspentCat.id] || 0) -
        Math.abs(spentByCategory[overspentCat.id] || 0)
    );

    const donors = categories
        .filter((c) => c.id !== overspentCat.id)
        .map((c) => {
            const avail = (localAllocations[c.id] || 0) - Math.abs(spentByCategory[c.id] || 0);
            return { cat: c, avail };
        })
        .filter((d) => d.avail > 0)
        .sort((a, b) => b.avail - a.avail)
        .slice(0, 5);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Fix: ${overspentCat.name}`}
        >
            {donors.length === 0 ? (
                <div className="p-4 text-sm text-muted-foreground text-center">
                    No categories with available funds to cover this.
                </div>
            ) : (
                <div className="space-y-1">
                    <p className="text-xs text-muted-foreground pb-1 font-medium">
                        Move money from another category to cover the {formatCurrency(overspentAmount)} overspend:
                    </p>
                    {donors.map(({ cat, avail }) => {
                        const coverAmount = Math.min(avail, overspentAmount);
                        return (
                            <button
                                key={cat.id}
                                onClick={() => { onCover(cat.id, coverAmount); onClose(); }}
                                className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl hover:bg-accent/60 transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring group"
                            >
                                <div className="flex items-center gap-2 min-w-0">
                                    <span className="text-sm">{cat.icon || '📝'}</span>
                                    <span className="text-sm font-medium text-foreground truncate">{cat.name}</span>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <span className="text-xs text-success font-semibold tabular-nums">{formatCurrency(avail)}</span>
                                    <span className="text-[10px] bg-primary text-primary-foreground px-2 py-0.5 rounded-full font-semibold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                        Cover {formatCurrency(coverAmount)}
                                    </span>
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}
        </Modal>
    );
}
