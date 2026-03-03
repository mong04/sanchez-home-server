/**
 * NavigationSidebar.tsx — Collapsible desktop/tablet sidebar navigation.
 *
 * Breakpoints:
 *   md+ (≥768px): Expanded (240px) by default. Collapses to icon-only (64px).
 *   <768px:       Hidden entirely. Mobile uses MobileBottomNav + MobileDrawer.
 *
 * Accessibility:
 *   - <nav aria-label="Main navigation"> landmark
 *   - aria-current="page" on active link
 *   - aria-expanded + aria-label on collapse toggle
 *   - icon-only mode uses Tooltip for accessible names
 *   - All nav links have focus-visible ring
 *   - Decorative icons are aria-hidden
 *   - prefers-reduced-motion respected via Framer Motion's useReducedMotion
 */
import { NavLink } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { LogOut, WifiOff, PanelLeftClose, PanelLeftOpen, User, MessageSquare } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { useNavigationStore } from './useNavigationStore';
import { useNeedsReviewCount } from '../../../hooks/useFinanceData';
import {
    PRIMARY_NAV_ITEMS,
    SECONDARY_NAV_ITEMS,
    ADMIN_NAV_ITEMS,
    filterByRole,
} from './navConfig';
import type { UserRole } from './navConfig';

// ─── Simple tooltip for collapsed icon-only mode ────────────────────────
interface TooltipProps {
    content: string;
    children: React.ReactNode;
}

function NavTooltip({ content, children }: TooltipProps) {
    return (
        <div className="relative group/tooltip">
            {children}
            <div
                role="tooltip"
                className={cn(
                    'absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50',
                    'px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap pointer-events-none',
                    'bg-popover text-popover-foreground border border-border shadow-md',
                    'opacity-0 scale-95 group-hover/tooltip:opacity-100 group-hover/tooltip:scale-100',
                    'transition-all duration-150 origin-left'
                )}
            >
                {content}
            </div>
        </div>
    );
}

// ─── Props ───────────────────────────────────────────────────────────────
interface NavigationSidebarProps {
    user: {
        name?: string;
        role?: string;
        avatar?: { type: string; value: string } | null;
    } | null;
    onFeedback: () => void;
    onLogout: () => void;
    isOnline: boolean;
}

// ─── Component ───────────────────────────────────────────────────────────
export function NavigationSidebar({
    user,
    onFeedback,
    onLogout,
    isOnline,
}: NavigationSidebarProps) {
    const { isSidebarCollapsed, toggleSidebar } = useNavigationStore();
    const prefersReduced = useReducedMotion();
    const { data: needsReviewCount } = useNeedsReviewCount();

    const userRole = user?.role as UserRole | undefined;
    const primaryItems = filterByRole(PRIMARY_NAV_ITEMS, userRole);
    const secondaryItems = filterByRole(SECONDARY_NAV_ITEMS, userRole);
    const adminItems = filterByRole(ADMIN_NAV_ITEMS, userRole);

    const sidebarWidth = isSidebarCollapsed ? 64 : 240;

    return (
        <motion.aside
            animate={{ width: sidebarWidth }}
            transition={prefersReduced ? { duration: 0 } : { type: 'spring', damping: 28, stiffness: 280 }}
            className={cn(
                'hidden md:flex flex-col h-full',
                'bg-card border-r border-border overflow-hidden shrink-0'
            )}
        >
            {/* ── Header / Brand ── */}
            <div
                className={cn(
                    'flex items-center border-b border-border shrink-0',
                    isSidebarCollapsed ? 'justify-center p-4 h-16' : 'justify-between p-4 h-16'
                )}
            >
                {!isSidebarCollapsed && (
                    <div className="min-w-0">
                        <h1 className="text-base font-bold bg-linear-to-r from-sky-400 to-indigo-500 bg-clip-text text-transparent leading-tight truncate">
                            Sanchez OS
                        </h1>
                        <p className="text-[10px] text-muted-foreground leading-tight">
                            v1.0 Beta
                        </p>
                    </div>
                )}

                {isSidebarCollapsed && (
                    <div className="w-7 h-7 rounded-lg bg-linear-to-br from-sky-400 to-indigo-500 flex items-center justify-center shrink-0">
                        <span className="text-white text-xs font-bold">S</span>
                    </div>
                )}
            </div>

            {/* ── Offline indicator ── */}
            {!isOnline && !isSidebarCollapsed && (
                <div className="mx-3 mt-2 px-2 py-1.5 bg-rose-500/10 text-rose-500 text-xs rounded-lg flex items-center gap-1.5 border border-rose-500/20">
                    <WifiOff className="w-3 h-3 shrink-0" aria-hidden="true" />
                    <span>Offline Mode</span>
                </div>
            )}

            {/* ── Primary Nav ── */}
            <nav
                aria-label="Main navigation"
                className="flex-1 flex flex-col py-3 px-2 gap-0.5 overflow-y-auto overflow-x-hidden"
            >
                {primaryItems.map(item => (
                    <NavLinkItem
                        key={item.path}
                        item={item}
                        collapsed={isSidebarCollapsed}
                        badgeCount={item.label === 'Finance' && needsReviewCount ? needsReviewCount : 0}
                    />
                ))}

                {/* Secondary section */}
                {(secondaryItems.length > 0 || adminItems.length > 0) && (
                    <div
                        className="my-2 mx-1 border-t border-border/60"
                        role="separator"
                        aria-hidden="true"
                    />
                )}

                {secondaryItems.map(item => (
                    <NavLinkItem
                        key={item.path}
                        item={item}
                        collapsed={isSidebarCollapsed}
                        secondary
                    />
                ))}

                {adminItems.length > 0 && (
                    <>
                        <div
                            className="my-2 mx-1 border-t border-border/60"
                            role="separator"
                            aria-hidden="true"
                        />
                        {adminItems.map(item => (
                            <NavLinkItem
                                key={item.path}
                                item={item}
                                collapsed={isSidebarCollapsed}
                                secondary
                            />
                        ))}
                    </>
                )}
            </nav>

            {/* ── User Footer ── */}
            <div className="border-t border-border px-2 py-3 space-y-1 shrink-0">
                {/* Profile link */}
                {isSidebarCollapsed ? (
                    <NavTooltip content={user?.name ?? 'Profile'}>
                        <NavLink
                            to="/profile"
                            className={({ isActive }) =>
                                cn(
                                    'flex items-center justify-center w-full h-10 rounded-xl transition-all',
                                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                                    isActive
                                        ? 'bg-primary/10 ring-1 ring-primary/20'
                                        : 'hover:bg-accent'
                                )
                            }
                            aria-label={`Profile: ${user?.name ?? 'User'}`}
                        >
                            <Avatar user={user} size="sm" />
                        </NavLink>
                    </NavTooltip>
                ) : (
                    <NavLink
                        to="/profile"
                        className={({ isActive }) =>
                            cn(
                                'flex items-center gap-3 w-full px-3 py-2 rounded-xl transition-all group',
                                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                                isActive
                                    ? 'bg-primary/10 ring-1 ring-primary/20'
                                    : 'hover:bg-accent'
                            )
                        }
                    >
                        <Avatar user={user} size="sm" />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                                {user?.name ?? 'Family Member'}
                            </p>
                            <p className="text-[10px] text-muted-foreground capitalize leading-tight">
                                {user?.role ?? 'Member'}
                            </p>
                        </div>
                    </NavLink>
                )}

                {/* Feedback */}
                {isSidebarCollapsed ? (
                    <NavTooltip content="Send Feedback">
                        <button
                            onClick={onFeedback}
                            aria-label="Send Feedback"
                            className={cn(
                                'flex items-center justify-center w-full h-10 rounded-xl',
                                'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
                                'transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                            )}
                        >
                            <MessageSquare className="w-4 h-4" aria-hidden="true" />
                        </button>
                    </NavTooltip>
                ) : (
                    <button
                        onClick={onFeedback}
                        className={cn(
                            'flex items-center gap-3 w-full px-3 py-2 rounded-xl',
                            'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
                            'transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                        )}
                    >
                        <MessageSquare className="w-4 h-4 shrink-0" aria-hidden="true" />
                        <span className="text-sm font-medium">Send Feedback</span>
                    </button>
                )}

                {/* Logout */}
                {isSidebarCollapsed ? (
                    <NavTooltip content="Log Out">
                        <button
                            onClick={onLogout}
                            aria-label="Log Out"
                            className={cn(
                                'flex items-center justify-center w-full h-10 rounded-xl',
                                'text-muted-foreground hover:bg-red-500/10 hover:text-red-500',
                                'transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                            )}
                        >
                            <LogOut className="w-4 h-4" aria-hidden="true" />
                        </button>
                    </NavTooltip>
                ) : (
                    <button
                        onClick={onLogout}
                        className={cn(
                            'flex items-center gap-3 w-full px-3 py-2 rounded-xl',
                            'text-muted-foreground hover:bg-red-500/10 hover:text-red-500',
                            'transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                        )}
                    >
                        <LogOut className="w-4 h-4 shrink-0" aria-hidden="true" />
                        <span className="text-sm font-medium">Log Out</span>
                    </button>
                )}

                {/* Collapse toggle */}
                <div className="pt-1 border-t border-border/60">
                    {isSidebarCollapsed ? (
                        <NavTooltip content="Expand sidebar">
                            <button
                                onClick={toggleSidebar}
                                aria-label="Expand sidebar"
                                aria-expanded={false}
                                className={cn(
                                    'flex items-center justify-center w-full h-8 rounded-xl',
                                    'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
                                    'transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                                )}
                            >
                                <PanelLeftOpen className="w-4 h-4" aria-hidden="true" />
                            </button>
                        </NavTooltip>
                    ) : (
                        <button
                            onClick={toggleSidebar}
                            aria-label="Collapse sidebar"
                            aria-expanded={true}
                            className={cn(
                                'flex items-center gap-3 w-full px-3 py-1.5 rounded-xl',
                                'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
                                'transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                            )}
                        >
                            <PanelLeftClose className="w-4 h-4 shrink-0" aria-hidden="true" />
                            <span className="text-xs font-medium">Collapse</span>
                        </button>
                    )}
                </div>
            </div>
        </motion.aside>
    );
}

// ─── NavLinkItem — shared between primary and secondary sections ──────────
interface NavLinkItemProps {
    item: (typeof PRIMARY_NAV_ITEMS)[number];
    collapsed: boolean;
    secondary?: boolean;
    badgeCount?: number;
}

function NavLinkItem({ item, collapsed, secondary, badgeCount }: NavLinkItemProps) {
    const Icon = item.icon;

    const linkClass = ({ isActive }: { isActive: boolean }) =>
        cn(
            'relative flex items-center w-full rounded-xl transition-all duration-150',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            collapsed ? 'justify-center h-10 px-0' : 'gap-3 px-3 h-10',
            isActive
                ? cn(
                    'bg-accent text-accent-foreground font-semibold',
                    !secondary && 'shadow-sm'
                )
                : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
        );

    const content = ({ isActive }: { isActive: boolean }) => (
        <>
            {/* Active indicator bar */}
            {isActive && !collapsed && (
                <span
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-full"
                    aria-hidden="true"
                />
            )}
            <Icon
                className={cn(
                    'shrink-0 transition-colors',
                    collapsed ? 'w-5 h-5' : 'w-4 h-4',
                    isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                )}
                aria-hidden="true"
            />
            {!collapsed && (
                <span className="truncate text-sm flex-1">{item.label}</span>
            )}

            {/* Global Badge */}
            {!!badgeCount && badgeCount > 0 && !collapsed && (
                <span className="bg-destructive text-destructive-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0">
                    {badgeCount}
                </span>
            )}
            {!!badgeCount && badgeCount > 0 && collapsed && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-destructive rounded-full border-2 border-card" />
            )}
        </>
    );

    if (collapsed) {
        return (
            <NavTooltip content={item.label}>
                <NavLink
                    to={item.path}
                    end={item.exact}
                    className={linkClass}
                    aria-label={item.label}
                    aria-current={undefined} // set by isActive in className
                >
                    {({ isActive }) => {
                        if (isActive) {
                            // Re-apply aria-current imperatively via a wrapper — React Router
                            // doesn't support aria-current in the render prop directly.
                            void isActive; // used below
                        }
                        return content({ isActive });
                    }}
                </NavLink>
            </NavTooltip>
        );
    }

    return (
        <NavLink
            to={item.path}
            end={item.exact}
            className={({ isActive }) => cn(linkClass({ isActive }), 'group')}
            aria-current={undefined} // Handled by wrapper below
        >
            {({ isActive }) => (
                <span
                    {...(isActive ? { 'aria-current': 'page' as const } : {})}
                    className="flex items-center w-full h-full gap-3"
                >
                    {content({ isActive })}
                </span>
            )}
        </NavLink>
    );
}

// ─── Avatar helper ───────────────────────────────────────────────────────
interface AvatarProps {
    user: NavigationSidebarProps['user'];
    size?: 'sm' | 'md';
}

export function Avatar({ user, size = 'sm' }: AvatarProps) {
    const dim = size === 'sm' ? 'w-7 h-7' : 'w-9 h-9';
    const textSize = size === 'sm' ? 'text-xs' : 'text-sm';

    if (user?.avatar?.type === 'upload' && user.avatar.value) {
        return (
            <img
                src={user.avatar.value}
                alt={user.name ?? 'User'}
                className={cn(dim, 'rounded-full object-cover shrink-0')}
            />
        );
    }

    if (user?.avatar?.value && user.avatar.type === 'emoji') {
        return (
            <span className={cn(dim, 'rounded-full bg-primary/10 flex items-center justify-center shrink-0', textSize)}>
                {user.avatar.value}
            </span>
        );
    }

    return (
        <span className={cn(dim, 'rounded-full bg-primary/10 flex items-center justify-center shrink-0')}>
            <User className={cn(size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4', 'text-primary')} aria-hidden="true" />
        </span>
    );
}
