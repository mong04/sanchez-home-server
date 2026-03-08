import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { AlertTriangle } from 'lucide-react';

interface AlertModalProps {
    isOpen: boolean;
    title: string;
    description: string;
    buttonText?: string;
    onClose: () => void;
}

export const AlertModal: React.FC<AlertModalProps> = ({
    isOpen,
    title,
    description,
    buttonText = 'Okay',
    onClose,
}) => {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            description={description}
            footer={
                <Button variant="default" onClick={onClose} className="w-full sm:w-auto">
                    {buttonText}
                </Button>
            }
        >
            <div className="flex items-center gap-3 p-4 rounded-xl bg-warning/10 text-warning-foreground border border-warning/20 mt-2">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <p className="text-sm">{description}</p>
            </div>
        </Modal>
    );
};
