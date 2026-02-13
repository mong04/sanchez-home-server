import React, { useState } from 'react';
import { Modal } from '../../common/Modal';
import { Button } from '../../common/Button';
import { useCreateEnvelope } from '../../../hooks/useFinanceData';
import { EnvelopeVisibilityOptions } from '../../../types/pocketbase';
import { useAuth } from '../../../context/AuthContext';

interface CreateEnvelopeModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function CreateEnvelopeModal({ isOpen, onClose }: CreateEnvelopeModalProps) {
    const { user } = useAuth();
    const [name, setName] = useState('');
    const [limit, setLimit] = useState('');
    const [visibility, setVisibility] = useState<EnvelopeVisibilityOptions>(EnvelopeVisibilityOptions.public);
    const createMutation = useCreateEnvelope();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !user) return;

        createMutation.mutate({
            name,
            budget_limit: parseFloat(limit) || 0,
            current_balance: parseFloat(limit) || 0, // Initial balance matches limit
            visibility,
            owner: user.id,
        }, {
            onSuccess: () => {
                onClose();
                setName('');
                setLimit('');
            }
        });
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Create New Envelope"
            description="Set up a new category for your family budget."
            footer={
                <div className="flex gap-2 justify-end w-full">
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={!name || createMutation.isPending}
                    >
                        {createMutation.isPending ? 'Creating...' : 'Create Envelope'}
                    </Button>
                </div>
            }
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium">Category Name</label>
                    <input
                        type="text"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="e.g. Groceries, Rent, Fun"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">Monthly Budget ($)</label>
                    <input
                        type="number"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="0.00"
                        value={limit}
                        onChange={(e) => setLimit(e.target.value)}
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">Visibility</label>
                    <div className="flex p-1 bg-muted rounded-lg">
                        {(['public', 'private', 'hidden'] as EnvelopeVisibilityOptions[]).map((opt) => (
                            <button
                                key={opt}
                                type="button"
                                onClick={() => setVisibility(opt)}
                                className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-all capitalize ${visibility === opt ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                {opt}
                            </button>
                        ))}
                    </div>
                </div>
            </form>
        </Modal>
    );
}
