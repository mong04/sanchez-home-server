import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Trash2, AlertCircle } from 'lucide-react';

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    isDestructive?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    title,
    description,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    isDestructive = true,
    onConfirm,
    onCancel,
}) => {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onCancel}
            title={title}
            description={description}
            footer={
                <>
                    <Button variant="ghost" onClick={onCancel}>
                        {cancelText}
                    </Button>
                    <Button
                        variant={isDestructive ? 'destructive' : 'default'}
                        onClick={() => {
                            onConfirm();
                            onCancel();
                        }}
                    >
                        {isDestructive && <Trash2 className="w-4 h-4 mr-2" />}
                        {confirmText}
                    </Button>
                </>
            }
        >
            {isDestructive && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-destructive/10 text-destructive border border-destructive/20 mt-2">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p className="text-sm font-medium">This action cannot be undone. Are you sure you want to proceed?</p>
                </div>
            )}
        </Modal>
    );
};
