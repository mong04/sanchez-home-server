import { motion } from 'framer-motion';
import { Lock, Wallet } from 'lucide-react';
import * as Icons from 'lucide-react';
import { useState } from 'react';
import { Card, CardContent } from '../../common/Card';
import { cn } from '../../../lib/utils';
import type { EnvelopeRecord } from '../../../types/pocketbase';

interface EnvelopeCardProps {
    envelope: EnvelopeRecord;
    spent: number;
    onClick?: () => void;
}

export function EnvelopeCard({ envelope, spent, onClick }: EnvelopeCardProps) {
    const limit = envelope.budget_limit || 0;
    const safeToSpend = limit - spent;
    // Cap progress at 100 visually, or let it overflow if design permits. Agent logic said cap at 100.
    const progress = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;

    // Check if private/hidden. logic: 'private' OR 'hidden'.
    const isPrivate = envelope.visibility === 'private' || envelope.visibility === 'hidden';
    const [isRevealed, setIsRevealed] = useState(false);

    // Dynamic Icon
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const IconComponent = (Icons as any)[envelope.icon || 'Wallet'] || Wallet;

    const handleReveal = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsRevealed(true);
    };

    if (isPrivate && !isRevealed) {
        return (
            <Card
                className="cursor-pointer bg-card/50 border-dashed hover:bg-accent/50 transition-colors"
                onClick={handleReveal}
            >
                <CardContent className="flex items-center justify-center gap-3 p-6 text-muted-foreground">
                    <Lock className="w-5 h-5" />
                    <span className="italic font-medium">Hidden Envelope</span>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card
            className="cursor-pointer hover:shadow-md transition-shadow active:scale-[0.99] duration-200"
            onClick={onClick}
        >
            <CardContent className="p-4 space-y-4">
                {/* Header */}
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                            <IconComponent className="w-5 h-5" />
                        </div>
                        <h3 className="font-semibold text-lg leading-none">{envelope.name}</h3>
                    </div>
                    <div className={cn(
                        "text-xl font-bold tabular-nums",
                        safeToSpend >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                    )}>
                        ${safeToSpend.toFixed(2)}
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="relative pt-2">
                    <div className="h-3 w-full bg-secondary rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                            className={cn(
                                "h-full rounded-full",
                                progress < 80 ? "bg-primary" :
                                    progress < 100 ? "bg-amber-500" :
                                        "bg-rose-500"
                            )}
                        />
                    </div>
                </div>

                {/* Footer Meta */}
                <div className="flex justify-between text-xs text-muted-foreground font-medium uppercase tracking-wider">
                    <span>Spent: ${spent.toFixed(2)}</span>
                    <span>Limit: ${limit.toFixed(2)}</span>
                </div>
            </CardContent>
        </Card>
    );
}
