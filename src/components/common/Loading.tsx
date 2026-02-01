

type LoadingProps = {
    isSyncing: boolean;
};

export function Loading({ isSyncing }: LoadingProps) {
    if (!isSyncing) return null;

    return (
        <div className="fixed top-4 right-4 z-50 animate-in fade-in duration-300">
            <div className="flex items-center gap-2 bg-popover/90 backdrop-blur-sm text-primary px-3 py-1.5 rounded-full shadow-lg border border-primary/30">
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-mono tracking-wider">SYNCING</span>
            </div>
        </div>
    );
}
