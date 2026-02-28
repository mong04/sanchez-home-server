/**
 * TopBar.tsx — Slim top bar present on all breakpoints.
 *
 * Desktop: Logo (collapsed sidebar only) | Breadcrumb | [Sync] [Search ⌘K] [🔔] [👤]
 * Mobile:  Logo | [Sync] [Search ⌘K] [🔔] [👤]
 *
 * Accessibility:
 *  - <header> landmark wraps the bar
 *  - All icon-only buttons have aria-label
 *  - Dropdown uses Radix patterns (keyboard navigable)
 *  - Notification badge has aria-label with count
 *  - prefers-reduced-motion on sync dot pulse
 */
import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
    Search,
    Bell,
    ChevronDown,
    User,
    LogOut,
    MessageSquare,
    Moon,
    Sun,
    Monitor,
    WifiOff,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { useNavigationStore } from './useNavigationStore';
import { useTheme } from '../../../context/ThemeContext';
import { Avatar } from './NavigationSidebar';
import { Breadcrumbs } from './Breadcrumbs';

// ─── Props ────────────────────────────────────────────────────────────────
interface TopBarProps {
    user: {
        name?: string;
        role?: string;
        avatar?: { type: string; value: string } | null;
    } | null;
    onFeedback: () => void;
    onLogout: () => void;
    isOnline: boolean;
    /** Whether the Yjs doc is currently syncing */
    isSyncing: boolean;
    /** Notification count badge (0 = no badge) */
    notificationCount?: number;
}

// ─── Sync Indicator ───────────────────────────────────────────────────────
function SyncDot({ isSyncing, isOnline }: { isSyncing: boolean; isOnline: boolean }) {
    const prefersReduced = useReducedMotion();

    if (!isOnline) {
        return (
            <div
                className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-rose-500/10 border border-rose-500/20"
                role="status"
                aria-label="Offline mode"
            >
                <WifiOff className="w-3 h-3 text-rose-500" aria-hidden="true" />
                <span className="text-[10px] font-medium text-rose-500 hidden sm:inline">Offline</span>
            </div>
        );
    }

    if (!isSyncing) return null;

    return (
        <div
            className="flex items-center gap-1.5"
            role="status"
            aria-label="Syncing"
            aria-live="polite"
        >
            <div
                className={cn(
                    'w-1.5 h-1.5 rounded-full bg-emerald-400',
                    !prefersReduced && 'animate-pulse'
                )}
                aria-hidden="true"
            />
            <span className="text-[10px] text-muted-foreground hidden sm:inline">Syncing…</span>
        </div>
    );
}

// ─── Theme toggle cycle ───────────────────────────────────────────────────
const THEME_ICONS = {
    light: Sun,
    dark: Moon,
    system: Monitor,
} as const;

// ─── User Dropdown ────────────────────────────────────────────────────────
interface UserMenuProps {
    user: TopBarProps['user'];
    onFeedback: () => void;
    onLogout: () => void;
}

function UserMenu({ user, onFeedback, onLogout }: UserMenuProps) {
    const [open, setOpen] = useState(false);
    const { theme, setTheme } = useTheme();
    const ThemeIcon = THEME_ICONS[theme as keyof typeof THEME_ICONS] ?? Monitor;

    const cycleTheme = () => {
        const order = ['light', 'dark', 'system'] as const;
        const next = order[(order.indexOf(theme as typeof order[number]) + 1) % order.length];
        setTheme(next);
    };

    return (
        <div className="relative">
            <button
                onClick={() => setOpen(v => !v)}
                aria-expanded={open}
                aria-haspopup="menu"
                aria-label={`User menu for ${user?.name ?? 'User'}`}
                className={cn(
                    'flex items-center gap-2 rounded-xl px-2 py-1.5 transition-all',
                    'hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    open && 'bg-accent'
                )}
            >
                <Avatar user={user} size="sm" />
                {/* Show name only on md+ */}
                <span className="hidden md:block text-sm font-medium text-foreground max-w-[120px] truncate">
                    {user?.name ?? 'User'}
                </span>
                <ChevronDown
                    className={cn(
                        'w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 hidden md:block',
                        open && 'rotate-180'
                    )}
                    aria-hidden="true"
                />
            </button>

            <AnimatePresence>
                {open && (
                    <>
                        {/* Backdrop to close */}
                        <div
                            className="fixed inset-0 z-40"
                            onClick={() => setOpen(false)}
                            aria-hidden="true"
                        />
                        {/* Dropdown */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -4 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -4 }}
                            transition={{ duration: 0.12 }}
                            role="menu"
                            aria-label="User menu"
                            className={cn(
                                'absolute right-0 top-full mt-2 w-52 z-50',
                                'bg-card border border-border rounded-2xl shadow-xl',
                                'py-1.5 overflow-hidden'
                            )}
                        >
                            {/* Identity */}
                            <div className="px-3 py-2 border-b border-border mb-1">
                                <p className="text-sm font-semibold text-foreground truncate">
                                    {user?.name ?? 'Family Member'}
                                </p>
                                <p className="text-xs text-muted-foreground capitalize">
                                    {user?.role ?? 'Member'}
                                </p>
                            </div>

                            <NavLink
                                to="/profile"
                                onClick={() => setOpen(false)}
                                role="menuitem"
                                className={cn(
                                    'flex items-center gap-2.5 w-full px-3 py-2 text-sm',
                                    'text-foreground hover:bg-accent transition-colors',
                                    'focus-visible:outline-none focus-visible:bg-accent'
                                )}
                            >
                                <User className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                                View Profile
                            </NavLink>

                            {/* Theme toggle */}
                            <button
                                onClick={cycleTheme}
                                role="menuitem"
                                className={cn(
                                    'flex items-center gap-2.5 w-full px-3 py-2 text-sm',
                                    'text-foreground hover:bg-accent transition-colors',
                                    'focus-visible:outline-none focus-visible:bg-accent'
                                )}
                            >
                                <ThemeIcon className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                                <span>Theme: {(theme.charAt(0).toUpperCase() + theme.slice(1))}</span>
                            </button>

                            <button
                                onClick={() => { setOpen(false); onFeedback(); }}
                                role="menuitem"
                                className={cn(
                                    'flex items-center gap-2.5 w-full px-3 py-2 text-sm',
                                    'text-foreground hover:bg-accent transition-colors',
                                    'focus-visible:outline-none focus-visible:bg-accent'
                                )}
                            >
                                <MessageSquare className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                                Send Feedback
                            </button>

                            <div className="border-t border-border mt-1 pt-1">
                                <button
                                    onClick={() => { setOpen(false); onLogout(); }}
                                    role="menuitem"
                                    className={cn(
                                        'flex items-center gap-2.5 w-full px-3 py-2 text-sm',
                                        'text-red-500 hover:bg-red-500/10 transition-colors',
                                        'focus-visible:outline-none focus-visible:bg-red-500/10'
                                    )}
                                >
                                    <LogOut className="w-4 h-4" aria-hidden="true" />
                                    Log Out
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}

// ─── NotificationBell ─────────────────────────────────────────────────────
interface NotificationBellProps {
    count: number;
}

function NotificationBell({ count }: NotificationBellProps) {
    return (
        <button
            aria-label={count > 0 ? `${count} notification${count !== 1 ? 's' : ''}` : 'Notifications (none)'}
            className={cn(
                'relative flex items-center justify-center w-9 h-9 rounded-xl',
                'text-muted-foreground hover:bg-accent hover:text-foreground',
                'transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
            )}
        >
            <Bell className="w-4 h-4" aria-hidden="true" />
            {count > 0 && (
                <span
                    className={cn(
                        'absolute top-1.5 right-1.5 flex items-center justify-center',
                        'min-w-[14px] h-[14px] rounded-full bg-primary text-primary-foreground',
                        'text-[9px] font-bold leading-none px-[3px]'
                    )}
                    aria-hidden="true"
                >
                    {count > 99 ? '99+' : count}
                </span>
            )}
        </button>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────
export function TopBar({
    user,
    onFeedback,
    onLogout,
    isOnline,
    isSyncing,
    notificationCount = 0,
}: TopBarProps) {
    const { openCommandPalette, isSidebarCollapsed } = useNavigationStore();

    return (
        <header
            className={cn(
                'h-14 shrink-0 flex items-center gap-3 px-4',
                'bg-card/80 backdrop-blur-sm border-b border-border',
                'z-50 sticky top-0'
            )}
        >
            {/* Logo — shown on mobile always; on desktop only when sidebar is collapsed */}
            <div className={cn('flex items-center gap-2', 'md:hidden', isSidebarCollapsed ? 'md:flex' : 'md:hidden')}>
                <div className="w-7 h-7 rounded-lg bg-linear-to-br from-sky-400 to-indigo-500 flex items-center justify-center shrink-0">
                    <span className="text-white text-xs font-bold">S</span>
                </div>
                <span className="font-bold text-sm bg-linear-to-r from-sky-400 to-indigo-500 bg-clip-text text-transparent hidden sm:block">
                    SFOS
                </span>
            </div>

            {/* Breadcrumbs — desktop/tablet, center */}
            <Breadcrumbs className="flex-1" />

            {/* Spacer on mobile (push actions right) */}
            <div className="flex-1 md:hidden" />

            {/* ── Right-side actions ── */}
            <div className="flex items-center gap-1.5 shrink-0">
                {/* Sync status */}
                <SyncDot isSyncing={isSyncing} isOnline={isOnline} />

                {/* Search / ⌘K */}
                <button
                    onClick={openCommandPalette}
                    aria-label="Open command palette (⌘K)"
                    className={cn(
                        'flex items-center gap-2 rounded-xl transition-all',
                        'text-muted-foreground hover:bg-accent hover:text-foreground',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                        // On desktop, show the hint text
                        'h-9 px-2.5 md:px-3'
                    )}
                >
                    <Search className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span className="hidden lg:flex items-center gap-1 text-xs text-muted-foreground/70">
                        Search
                        <kbd className="ml-1 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-muted border border-border text-[10px] font-mono font-medium">
                            ⌘K
                        </kbd>
                    </span>
                </button>

                {/* Notifications */}
                <NotificationBell count={notificationCount} />

                {/* User menu */}
                <UserMenu user={user} onFeedback={onFeedback} onLogout={onLogout} />
            </div>
        </header>
    );
}
