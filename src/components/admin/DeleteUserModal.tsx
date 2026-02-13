import { useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Trash2, AlertTriangle } from 'lucide-react';

interface DeleteUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    userName: string;
    isDeleting: boolean;
}

export function DeleteUserModal({ isOpen, onClose, onConfirm, userName, isDeleting }: DeleteUserModalProps) {
    const cancelRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (isOpen) {
            cancelRef.current?.focus();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
                onClick={!isDeleting ? onClose : undefined}
                aria-hidden="true"
            />

            {/* Modal Content */}
            <div
                className="relative bg-background w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-border"
                role="dialog"
                aria-modal="true"
                aria-labelledby="delete-user-title"
            >
                <div className="p-6 text-center space-y-4">
                    <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center">
                        <AlertTriangle className="w-6 h-6 text-destructive" aria-hidden="true" />
                    </div>

                    <div>
                        <h3 id="delete-user-title" className="text-lg font-bold text-foreground">Delete User?</h3>
                        <p className="text-sm text-muted-foreground mt-2">
                            Are you sure you want to remove <span className="font-semibold text-foreground">{userName}</span>? This action cannot be undone.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-6">
                        <button
                            ref={cancelRef}
                            onClick={onClose}
                            disabled={isDeleting}
                            className="w-full py-2.5 px-4 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-xl font-medium transition-colors disabled:opacity-50 focus:ring-2 focus:ring-ring outline-none"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={isDeleting}
                            className="w-full py-2.5 px-4 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2 focus:ring-2 focus:ring-destructive focus:ring-offset-2 outline-none"
                        >
                            {isDeleting ? (
                                <span className="animate-pulse">Deleting...</span>
                            ) : (
                                <>
                                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                                    Delete
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
