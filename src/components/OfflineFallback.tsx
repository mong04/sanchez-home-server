import { motion } from 'framer-motion';
import { WifiOff, RefreshCw } from 'lucide-react';
import { Button } from './common/Button';

export function OfflineFallback() {
    const handleRetry = () => window.location.reload();

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="min-h-screen bg-background flex items-center justify-center p-6"
        >
            <div className="max-w-md text-center space-y-6">
                <div className="mx-auto w-20 h-20 rounded-2xl bg-card border shadow-sm flex items-center justify-center">
                    <WifiOff className="w-10 h-10 text-card-foreground/70" />
                </div>

                <div>
                    <h2 className="text-2xl font-bold text-foreground">You’re offline</h2>
                    <p className="text-muted-foreground mt-2">
                        No internet connection detected. All your changes are saved locally and will sync automatically when you’re back online.
                    </p>
                </div>

                <Button onClick={handleRetry} variant="outline" className="gap-2">
                    <RefreshCw className="w-4 h-4" />
                    Retry Connection
                </Button>
            </div>
        </motion.div>
    );
}
