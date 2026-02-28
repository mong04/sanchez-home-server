/**
 * MobileDrawer.tsx — Bottom sheet drawer for mobile "More" overflow navigation.
 *
 * Slides UP from the bottom (thumb-friendly). Contains secondary nav,
 * admin items (role-gated), profile link, theme toggle, feedback, logout.
 *
 * Accessibility:
 *  - role="dialog" aria-modal="true" aria-label="More navigation"
 *  - Focus trap while open (Tab cycles only inside)
 *  - Esc closes drawer, focus returns to the "More" button
 *  - Backdrop tap closes the drawer
 *  - prefers-reduced-motion respected
 */
import { useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
    X,
    MessageSquare,
    LogOut,
    Moon,
    Sun,
    Monitor,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { useNavigationStore } from './useNavigationStore';
import {
    SECONDARY_NAV_ITEMS,
    ADMIN_NAV_ITEMS,
    filterByRole,
} from './navConfig';
import type { UserRole } from './navConfig';
import { useTheme } from '../../../context/ThemeContext';
import { Avatar } from './NavigationSidebar';

const THEME_ICONS = { light: Sun, dark: Moon, system: Monitor } as const;

// ─── Props ────────────────────────────────────────────────────────────────
interface MobileDrawerProps {
    user: {
        name?: string;
        role?: string;
        avatar?: { type: string; value: string } | null;
    } | null;
    onFeedback: () => void;
    onLogout: () => void;
}

// ─── Focus trap utility ────────────────────────────────────────────────────
function useFocusTrap(containerRef: React.RefObject<HTMLElement | null>, active: boolean) {
    useEffect(() => {
        if (!active || !containerRef.current) return;
        const el = containerRef.current;

        // Focus first focusable element on open
        const focusable = el.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length > 0) focusable[0].focus();

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key !== 'Tab') return;
            const items = Array.from(
                el.querySelectorAll<HTMLElement>(
                    'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
                )
            );
            const first = items[0];
            const last = items[items.length - 1];
            if (e.shiftKey) {
                if (document.activeElement === first) {
                    e.preventDefault();
                    last.focus();
                }
            } else {
                if (document.activeElement === last) {
                    e.preventDefault();
                    first.focus();
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [active, containerRef]);
}

// ─── Component ────────────────────────────────────────────────────────────
export function MobileDrawer({ user, onFeedback, onLogout }: MobileDrawerProps) {
    const { isMobileDrawerOpen, closeMobileDrawer } = useNavigationStore();
    const { theme, setTheme } = useTheme();
    const prefersReduced = useReducedMotion();
    const drawerRef = useRef<HTMLDivElement>(null);

    useFocusTrap(drawerRef, isMobileDrawerOpen);

    const userRole = user?.role as UserRole | undefined;
    const secondaryItems = filterByRole(SECONDARY_NAV_ITEMS, userRole);
    const adminItems = filterByRole(ADMIN_NAV_ITEMS, userRole);
    const ThemeIcon = THEME_ICONS[theme as keyof typeof THEME_ICONS] ?? Monitor;

    // Close on Esc
    useEffect(() => {
        if (!isMobileDrawerOpen) return;
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') closeMobileDrawer();
        };
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [isMobileDrawerOpen, closeMobileDrawer]);

    // Prevent body scroll when open
    useEffect(() => {
        if (isMobileDrawerOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isMobileDrawerOpen]);

    const cycleTheme = () => {
        const order = ['light', 'dark', 'system'] as const;
        const next = order[(order.indexOf(theme as typeof order[number]) + 1) % order.length];
        setTheme(next);
    };

    const drawerItemClass = cn(
        'flex items-center gap-3 w-full px-4 py-3.5 rounded-2xl',
        'text-foreground transition-colors',
        'hover:bg-accent active:bg-accent/80',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
    );

    return (
        <AnimatePresence>
            {isMobileDrawerOpen && (
                <>
                    {/* ── Backdrop ── */}
                    <motion.div
                        key="backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={prefersReduced ? { duration: 0 } : { duration: 0.2 }}
                        className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                        onClick={closeMobileDrawer}
                        aria-hidden="true"
                    />

                    {/* ── Drawer ── */}
                    <motion.div
                        key="drawer"
                        ref={drawerRef}
                        role="dialog"
                        aria-modal="true"
                        aria-label="More navigation"
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={
                            prefersReduced
                                ? { duration: 0 }
                                : { type: 'spring', damping: 30, stiffness: 320 }
                        }
                        className={cn(
                            'md:hidden fixed bottom-0 left-0 right-0 z-50',
                            'bg-card border-t border-border rounded-t-3xl shadow-2xl',
                            'pb-safe max-h-[85vh] overflow-y-auto'
                        )}
                    >
                        {/* Handle bar */}
                        <div className="flex justify-center pt-3 pb-1">
                            <div className="w-10 h-1 bg-border rounded-full" aria-hidden="true" />
                        </div>

                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                            <span className="font-semibold text-foreground">More</span>
                            <button
                                onClick={closeMobileDrawer}
                                aria-label="Close menu"
                                className={cn(
                                    'w-8 h-8 rounded-full flex items-center justify-center',
                                    'bg-muted text-muted-foreground hover:bg-accent hover:text-foreground',
                                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                                )}
                            >
                                <X className="w-4 h-4" aria-hidden="true" />
                            </button>
                        </div>

                        <div className="p-3 space-y-1">
                            {/* Secondary nav items */}
                            {secondaryItems.map(item => {
                                const Icon = item.icon;
                                return (
                                    <NavLink
                                        key={item.path}
                                        to={item.path}
                                        end={item.exact}
                                        onClick={closeMobileDrawer}
                                        className={({ isActive }) =>
                                            cn(
                                                drawerItemClass,
                                                isActive && 'bg-accent font-medium'
                                            )
                                        }
                                    >
                                        {({ isActive }) => (
                                            <>
                                                <span
                                                    className={cn(
                                                        'w-9 h-9 rounded-xl flex items-center justify-center shrink-0',
                                                        isActive ? 'bg-primary/10' : 'bg-muted'
                                                    )}
                                                >
                                                    <Icon
                                                        className={cn(
                                                            'w-4.5 h-4.5',
                                                            isActive ? 'text-primary' : 'text-muted-foreground'
                                                        )}
                                                        aria-hidden="true"
                                                    />
                                                </span>
                                                <span
                                                    className="text-sm font-medium"
                                                    {...(isActive ? { 'aria-current': 'page' as const } : {})}
                                                >
                                                    {item.label}
                                                </span>
                                            </>
                                        )}
                                    </NavLink>
                                );
                            })}

                            {/* Admin items */}
                            {adminItems.length > 0 && (
                                <>
                                    <div className="my-2 border-t border-border/60" aria-hidden="true" />
                                    {adminItems.map(item => {
                                        const Icon = item.icon;
                                        return (
                                            <NavLink
                                                key={item.path}
                                                to={item.path}
                                                end={item.exact}
                                                onClick={closeMobileDrawer}
                                                className={({ isActive }) =>
                                                    cn(drawerItemClass, isActive && 'bg-accent font-medium')
                                                }
                                            >
                                                {({ isActive }) => (
                                                    <>
                                                        <span className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', isActive ? 'bg-primary/10' : 'bg-muted')}>
                                                            <Icon className={cn('w-4.5 h-4.5', isActive ? 'text-primary' : 'text-muted-foreground')} aria-hidden="true" />
                                                        </span>
                                                        <span className="text-sm font-medium" {...(isActive ? { 'aria-current': 'page' as const } : {})}>
                                                            {item.label}
                                                        </span>
                                                    </>
                                                )}
                                            </NavLink>
                                        );
                                    })}
                                </>
                            )}

                            {/* ── Divider ── */}
                            <div className="my-2 border-t border-border/60" aria-hidden="true" />

                            {/* Profile */}
                            <NavLink
                                to="/profile"
                                onClick={closeMobileDrawer}
                                className={({ isActive }) => cn(drawerItemClass, isActive && 'bg-accent font-medium')}
                            >
                                {({ isActive }) => (
                                    <>
                                        <Avatar user={user} size="md" />
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-foreground truncate" {...(isActive ? { 'aria-current': 'page' as const } : {})}>
                                                {user?.name ?? 'My Profile'}
                                            </p>
                                            <p className="text-xs text-muted-foreground capitalize">{user?.role ?? 'Member'}</p>
                                        </div>
                                    </>
                                )}
                            </NavLink>

                            {/* Theme */}
                            <button onClick={cycleTheme} className={drawerItemClass}>
                                <span className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center shrink-0">
                                    <ThemeIcon className="w-4.5 h-4.5 text-muted-foreground" aria-hidden="true" />
                                </span>
                                <span className="text-sm font-medium">
                                    Theme: {theme.charAt(0).toUpperCase() + theme.slice(1)}
                                </span>
                            </button>

                            {/* Feedback */}
                            <button
                                onClick={() => { closeMobileDrawer(); onFeedback(); }}
                                className={drawerItemClass}
                            >
                                <span className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center shrink-0">
                                    <MessageSquare className="w-4.5 h-4.5 text-muted-foreground" aria-hidden="true" />
                                </span>
                                <span className="text-sm font-medium">Send Feedback</span>
                            </button>

                            {/* Admin shortcut — shield icon */}
                            {adminItems.length === 0 && userRole && ['admin', 'parent'].includes(userRole) && null}

                            {/* Logout */}
                            <button
                                onClick={() => { closeMobileDrawer(); onLogout(); }}
                                className={cn(drawerItemClass, 'text-red-500 hover:bg-red-500/10 active:bg-red-500/20')}
                            >
                                <span className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
                                    <LogOut className="w-4.5 h-4.5 text-red-500" aria-hidden="true" />
                                </span>
                                <span className="text-sm font-medium">Log Out</span>
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
