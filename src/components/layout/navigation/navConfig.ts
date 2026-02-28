/**
 * navConfig.ts — Single source of truth for all navigation items.
 * Role-gated items are filtered at render time, not here.
 */
import type { LucideIcon } from 'lucide-react';
import {
    LayoutDashboard,
    CreditCard,
    Calendar,
    MessageSquare,
    CheckSquare,
    Heart,
    InfinityIcon,
    Shield,
} from 'lucide-react';

export type UserRole = 'admin' | 'parent' | 'child';

export interface NavItem {
    /** Route path (react-router-dom href) */
    path: string;
    /** Full display label */
    label: string;
    /** Compact label for icon-only or very small tabs */
    shortLabel: string;
    /** Lucide icon component */
    icon: LucideIcon;
    /**
     * If defined, item is only visible to users with one of these roles.
     * If undefined, item is visible to all authenticated users.
     */
    roles?: UserRole[];
    /**
     * If true, NavLink is matched exactly (end=true in react-router).
     * Only needed for the root "/" path.
     */
    exact?: boolean;
    /** Optional quick-action label for command palette */
    paletteLabel?: string;
}

/**
 * PRIMARY NAV ITEMS
 * These appear in the sidebar (tier 1 section) and the mobile bottom tab bar.
 * Keep this list to exactly 5 for mobile bottom nav to work cleanly.
 */
export const PRIMARY_NAV_ITEMS: NavItem[] = [
    {
        path: '/',
        label: 'Home',
        shortLabel: 'Home',
        icon: LayoutDashboard,
        exact: true,
        paletteLabel: 'Go to Home',
    },
    {
        path: '/finance',
        label: 'Finance',
        shortLabel: 'Finance',
        icon: CreditCard,
        paletteLabel: 'Go to Finance',
    },
    {
        path: '/planner',
        label: 'Planner',
        shortLabel: 'Planner',
        icon: Calendar,
        paletteLabel: 'Go to Planner',
    },
    {
        path: '/messenger',
        label: 'Messenger',
        shortLabel: 'Chat',
        icon: MessageSquare,
        paletteLabel: 'Go to Messenger',
    },
    {
        path: '/organizer',
        label: 'Organizer',
        shortLabel: 'Organize',
        icon: CheckSquare,
        paletteLabel: 'Go to Organizer',
    },
];

/**
 * SECONDARY NAV ITEMS
 * These appear in the sidebar below a divider.
 * On mobile they appear inside the "More" bottom sheet drawer.
 */
export const SECONDARY_NAV_ITEMS: NavItem[] = [
    {
        path: '/wellness',
        label: 'Wellness',
        shortLabel: 'Wellness',
        icon: Heart,
        paletteLabel: 'Go to Wellness',
    },
    {
        path: '/infinity-log',
        label: 'Infinity Log',
        shortLabel: 'Log',
        icon: InfinityIcon,
        paletteLabel: 'Go to Infinity Log',
    },
];

/**
 * ADMIN NAV ITEMS
 * Only shown to users with role 'admin' or 'parent'.
 */
export const ADMIN_NAV_ITEMS: NavItem[] = [
    {
        path: '/admin',
        label: 'Admin',
        shortLabel: 'Admin',
        icon: Shield,
        roles: ['admin', 'parent'],
        paletteLabel: 'Go to Admin',
    },
];

/**
 * ALL_NAV_ITEMS for command palette — flattened list, role filtering happens at runtime.
 */
export const ALL_NAV_ITEMS: NavItem[] = [
    ...PRIMARY_NAV_ITEMS,
    ...SECONDARY_NAV_ITEMS,
    ...ADMIN_NAV_ITEMS,
];

/**
 * QUICK ACTIONS for command palette — not routes, but direct actions.
 */
export const QUICK_ACTIONS = [
    { id: 'new-transaction', label: 'New Transaction', icon: CreditCard, shortcut: undefined },
    { id: 'new-event', label: 'Add Calendar Event', icon: Calendar, shortcut: undefined },
    { id: 'new-message', label: 'Send Message', icon: MessageSquare, shortcut: undefined },
] as const;

export type QuickActionId = (typeof QUICK_ACTIONS)[number]['id'];

/**
 * Helper: filter nav items by user role.
 */
export function filterByRole(items: NavItem[], role: UserRole | undefined): NavItem[] {
    return items.filter(item => {
        if (!item.roles) return true; // visible to all
        if (!role) return false; // no role → hide gated items
        return item.roles.includes(role);
    });
}
