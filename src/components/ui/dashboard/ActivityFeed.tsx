import { cn } from '../../../lib/utils';
import { Activity, CheckCircle2, AlertCircle, User, DollarSign } from 'lucide-react';

// --- Types ---
export interface ActivityItem {
    id: string;
    type: 'chore' | 'finance' | 'system' | 'user' | 'wellness';
    title: string;
    description?: string;
    timestamp: number; // Unix timestamp
    userAvatar?: string; // URL or emoji
    userName?: string;
}

interface ActivityFeedProps extends React.HTMLAttributes<HTMLDivElement> {
    items: ActivityItem[];
    users?: any[]; // Pass users list for avatar lookup
    emptyMessage?: string;
}

// --- Icons Helper ---
const getTypeIcon = (type: ActivityItem['type']) => {
    switch (type) {
        case 'chore': return CheckCircle2;
        case 'finance': return DollarSign;
        case 'system': return AlertCircle;
        case 'user': return User;
        case 'wellness': return Activity;
        default: return Activity;
    }
};

const getTypeColor = (type: ActivityItem['type']) => {
    switch (type) {
        case 'chore': return 'text-success bg-success/10';
        case 'finance': return 'text-warning bg-warning/10';
        case 'system': return 'text-destructive bg-destructive/10';
        case 'user': return 'text-primary bg-primary/10';
        case 'wellness': return 'text-info bg-info/10';
        default: return 'text-muted-foreground bg-muted';
    }
};

// --- Component ---
export function ActivityFeed({ className, items, users = [], emptyMessage = "No recent activity", ...props }: ActivityFeedProps) {

    // Time formatter
    const formatTime = (timestamp: number) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = (now.getTime() - date.getTime()) / 1000; // seconds

        if (diff < 60) return 'Just now';
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return date.toLocaleDateString();
    };

    const getUserAvatar = (userName?: string) => {
        if (!userName) return null;
        const user = users.find(u => u.name === userName || u.id === userName);
        return user?.emoji || user?.name?.[0]?.toUpperCase() || '?';
    };

    return (
        <div className={cn("space-y-4", className)} role="feed" aria-busy={false} {...props}>
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold tracking-tight">Recent Activity</h3>
            </div>

            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {items.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm border-2 border-dashed rounded-xl">
                        {emptyMessage}
                    </div>
                ) : (
                    <div className="space-y-3">
                        {items.map((item) => {
                            const Icon = getTypeIcon(item.type);
                            const colorClass = getTypeColor(item.type);
                            const avatarEmoji = getUserAvatar(item.userName);
                            const isUserActivity = item.type === 'user' || item.type === 'chore';

                            return (
                                <article key={item.id} className="group flex items-start gap-4 p-3 rounded-xl bg-card/50 border border-border/50 hover:bg-muted/50 transition-colors animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    {/* Icon / Avatar */}
                                    <div className={cn("mt-0.5 relative shrink-0")}>
                                        {isUserActivity && avatarEmoji ? (
                                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm border border-border shadow-sm">
                                                {avatarEmoji}
                                            </div>
                                        ) : (
                                            <div className={cn("p-2 rounded-full", colorClass)}>
                                                <Icon className="w-4 h-4" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 space-y-1 min-w-0">
                                        <p className="text-sm font-medium leading-none truncate">
                                            {item.userName && <span className="text-muted-foreground font-normal">{item.userName} </span>}
                                            {item.title}
                                        </p>
                                        {item.description && (
                                            <p className="text-xs text-muted-foreground line-clamp-1">
                                                {item.description}
                                            </p>
                                        )}
                                    </div>

                                    {/* Time */}
                                    <time className="text-xs text-muted-foreground whitespace-nowrap tabular-nums">
                                        {formatTime(item.timestamp)}
                                    </time>
                                </article>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
