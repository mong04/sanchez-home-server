import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Button } from './Button';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    description?: string;
    footer?: React.ReactNode;
    className?: string;
    showHeader?: boolean;
}

export function Modal({
    isOpen,
    onClose,
    title,
    children,
    description,
    footer,
    className,
    showHeader = true,
}: ModalProps) {
    const overlayRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    const handleOverlayClick = (e: React.MouseEvent) => {
        if (e.target === overlayRef.current) onClose();
    };

    if (typeof document === 'undefined') return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div
                    className="fixed inset-0 z-50 flex flex-col items-center justify-end sm:justify-center p-0 sm:p-6"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="modal-title"
                >
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                        ref={overlayRef}
                        onClick={handleOverlayClick}
                    />

                    {/* Modal Content */}
                    <motion.div
                        drag="y"
                        dragConstraints={{ top: 0, bottom: 0 }}
                        dragElastic={0.35}
                        onDragEnd={(_e, info) => {
                            if (info.offset.y > 110 || info.velocity.y > 550) onClose();
                        }}
                        initial={{ opacity: 0, scale: 0.96, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: '100%' }}
                        transition={{ duration: 0.22, ease: 'easeOut' }}
                        className={cn(
                            'relative w-full max-w-lg overflow-hidden rounded-2xl mt-auto sm:mt-0 bg-card text-card-foreground border border-border shadow-2xl flex flex-col',
                            className
                        )}
                    >
                        {/* Mobile Drag Handle */}
                        <div className="flex sm:hidden w-full pt-4 pb-2 justify-center cursor-grab active:cursor-grabbing">
                            <div className="w-11 h-1 bg-border rounded-full" />
                        </div>

                        {/* Header */}
                        {showHeader && (
                            <div className="flex items-center justify-between border-b border-border px-6 py-4">
                                <div>
                                    <h3 id="modal-title" className="text-xl font-semibold text-card-foreground">
                                        {title}
                                    </h3>
                                    {description && (
                                        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
                                    )}
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={onClose}
                                    className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground"
                                    aria-label="Close"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        )}

                        {/* Body */}
                        <div className="flex-1 min-h-0 px-6 py-5 text-card-foreground">
                            {children}
                        </div>

                        {/* Footer */}
                        {footer && (
                            <div className="border-t border-border bg-muted/50 px-6 py-4 flex justify-end gap-3">
                                {footer}
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}