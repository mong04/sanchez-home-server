import { useState } from 'react';
import { Bell, ShieldCheck, Heart } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';
import { motion } from 'framer-motion';
import { useBackend } from '../../providers/BackendProvider';
import { useAuth } from '../../context/AuthContext';
import { subscribeUserToPush } from '../../lib/push';

interface PushPermissionDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export function PushPermissionDialog({ isOpen, onClose, onSuccess }: PushPermissionDialogProps) {
    const { adapter } = useBackend();
    const { user: profile } = useAuth();
    const [loading, setLoading] = useState(false);

    const handleEnable = async () => {
        setLoading(true);
        try {
            await subscribeUserToPush(adapter, profile?.id);
            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            console.error('Failed to subscribe to push:', error);
            // In a real app, we might show a toast here
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title=""
            showHeader={false}
            className="max-w-md"
        >
            <div className="flex flex-col items-center text-center py-6 px-2">
                <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', damping: 15, stiffness: 200 }}
                    className="p-4 rounded-full bg-primary/10 mb-6"
                >
                    <Bell className="w-12 h-12 text-primary" />
                </motion.div>

                <h3 className="text-2xl font-bold text-foreground mb-3">
                    Stay in the loop
                </h3>

                <p className="text-muted-foreground mb-8 leading-relaxed">
                    Enable notifications to get gentle reminders for bills due, chore rotations, and calendar events. We never spam — you control everything.
                </p>

                <div className="grid grid-cols-1 gap-4 w-full">
                    <div className="flex items-center gap-3 text-sm text-muted-foreground bg-muted/30 p-4 rounded-2xl border border-transparent hover:border-success/20 transition-colors">
                        <div className="p-2 rounded-lg bg-success/10">
                            <ShieldCheck className="w-5 h-5 text-success shrink-0" />
                        </div>
                        <div className="text-left">
                            <p className="font-medium text-foreground">Privacy-first</p>
                            <p className="text-xs">Your data stays in your family backend.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground bg-muted/30 p-4 rounded-2xl border border-transparent hover:border-rose-500/20 transition-colors">
                        <div className="p-2 rounded-lg bg-rose-500/10">
                            <Heart className="w-5 h-5 text-rose-500 shrink-0" />
                        </div>
                        <div className="text-left">
                            <p className="font-medium text-foreground">Spouse-approved</p>
                            <p className="text-xs">Only helpful alerts, zero clutter.</p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-3 w-full mt-10">
                    <Button
                        variant="default"
                        onClick={handleEnable}
                        loading={loading}
                        className="w-full rounded-2xl h-14 text-base font-semibold shadow-lg shadow-primary/20"
                    >
                        Notify Me
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        className="w-full rounded-2xl h-12 text-muted-foreground"
                    >
                        Not Now
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
