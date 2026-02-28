/**
 * CommandPalette.tsx — Global ⌘K command palette.
 *
 * Lazy-loaded (only mounted when first opened). Uses `cmdk` for the
 * accessible combobox pattern (keyboard nav, search, roles, ARIA built-in).
 *
 * Features:
 *  - Navigation items (role-filtered)
 *  - Quick actions (Add Transaction, Add Event, Send Message)
 *  - Keyboard: ↑↓ to navigate, Enter to select, Esc to dismiss
 *
 * Accessibility: cmdk handles role="combobox", aria-activedescendant,
 * aria-expanded natively. We wrap in a Dialog for focus trap + backdrop.
 */
import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Command } from 'cmdk';
import { Search, ArrowRight, Zap } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { useNavigationStore } from './useNavigationStore';
import {
    filterByRole,
    PRIMARY_NAV_ITEMS,
    SECONDARY_NAV_ITEMS,
    ADMIN_NAV_ITEMS,
    QUICK_ACTIONS,
} from './navConfig';
import type { UserRole, QuickActionId } from './navConfig';

// ─── Props ────────────────────────────────────────────────────────────────
interface CommandPaletteProps {
    userRole?: UserRole;
    /** Called when a quick action is selected (parent handles the action) */
    onQuickAction?: (id: QuickActionId) => void;
}

// ─── Component ────────────────────────────────────────────────────────────
export function CommandPalette({ userRole, onQuickAction }: CommandPaletteProps) {
    const { isCommandPaletteOpen, closeCommandPalette, openCommandPalette } = useNavigationStore();
    const navigate = useNavigate();
    const prefersReduced = useReducedMotion();

    // Global ⌘K / Ctrl+K listener
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                isCommandPaletteOpen ? closeCommandPalette() : openCommandPalette();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isCommandPaletteOpen, closeCommandPalette, openCommandPalette]);

    const handleNavigate = useCallback(
        (path: string) => {
            navigate(path);
            closeCommandPalette();
        },
        [navigate, closeCommandPalette]
    );

    const handleQuickAction = useCallback(
        (id: QuickActionId) => {
            onQuickAction?.(id);
            closeCommandPalette();
        },
        [onQuickAction, closeCommandPalette]
    );

    // Build filtered nav items
    const primaryItems = filterByRole(PRIMARY_NAV_ITEMS, userRole);
    const secondaryItems = filterByRole(SECONDARY_NAV_ITEMS, userRole);
    const adminItems = filterByRole(ADMIN_NAV_ITEMS, userRole);
    const allNavItems = [...primaryItems, ...secondaryItems, ...adminItems];

    return (
        <AnimatePresence>
            {isCommandPaletteOpen && (
                <>
                    {/* ── Backdrop ── */}
                    <motion.div
                        key="cp-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={prefersReduced ? { duration: 0 } : { duration: 0.15 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                        onClick={closeCommandPalette}
                        aria-hidden="true"
                    />

                    {/* ── Panel ── */}
                    <motion.div
                        key="cp-panel"
                        role="dialog"
                        aria-label="Command palette"
                        aria-modal="true"
                        initial={{ opacity: 0, scale: 0.97, y: -8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.97, y: -8 }}
                        transition={
                            prefersReduced
                                ? { duration: 0 }
                                : { type: 'spring', damping: 30, stiffness: 380, mass: 0.8 }
                        }
                        className={cn(
                            'fixed top-[12vh] left-1/2 -translate-x-1/2 z-50',
                            'w-[92vw] max-w-lg',
                            'bg-card border border-border rounded-2xl shadow-2xl overflow-hidden'
                        )}
                    >
                        <Command
                            className="w-full"
                            onKeyDown={(e) => {
                                if (e.key === 'Escape') closeCommandPalette();
                            }}
                        >
                            {/* Search input */}
                            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border">
                                <Search
                                    className="w-4 h-4 text-muted-foreground shrink-0"
                                    aria-hidden="true"
                                />
                                <Command.Input
                                    placeholder="Search pages, actions…"
                                    className={cn(
                                        'flex-1 bg-transparent text-sm text-foreground',
                                        'placeholder:text-muted-foreground outline-none'
                                    )}
                                    autoFocus
                                />
                                <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded bg-muted border border-border text-[10px] font-mono text-muted-foreground shrink-0">
                                    ESC
                                </kbd>
                            </div>

                            <Command.List
                                className="max-h-[50vh] overflow-y-auto py-2"
                                aria-label="Search results"
                            >
                                <Command.Empty className="py-8 text-center text-sm text-muted-foreground">
                                    No results found.
                                </Command.Empty>

                                {/* ── Navigation ── */}
                                <Command.Group
                                    heading="Navigation"
                                    className={cn(
                                        'px-2',
                                        '[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5',
                                        '[&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold',
                                        '[&_[cmdk-group-heading]]:text-muted-foreground/70',
                                        '[&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider'
                                    )}
                                >
                                    {allNavItems.map(item => {
                                        const Icon = item.icon;
                                        return (
                                            <Command.Item
                                                key={item.path}
                                                value={`${item.label} ${item.paletteLabel ?? ''}`}
                                                onSelect={() => handleNavigate(item.path)}
                                                className={cn(
                                                    'flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer',
                                                    'text-sm text-foreground transition-colors',
                                                    'data-[selected=true]:bg-accent',
                                                    'aria-selected:bg-accent'
                                                )}
                                            >
                                                <span className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center shrink-0">
                                                    <Icon className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
                                                </span>
                                                <span className="flex-1">{item.label}</span>
                                                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" aria-hidden="true" />
                                            </Command.Item>
                                        );
                                    })}
                                </Command.Group>

                                {/* ── Quick Actions ── */}
                                {onQuickAction && (
                                    <>
                                        <div className="my-1 mx-2 border-t border-border/60" aria-hidden="true" />
                                        <Command.Group
                                            heading="Quick Actions"
                                            className={cn(
                                                'px-2',
                                                '[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5',
                                                '[&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold',
                                                '[&_[cmdk-group-heading]]:text-muted-foreground/70',
                                                '[&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider'
                                            )}
                                        >
                                            {QUICK_ACTIONS.map(action => {
                                                const Icon = action.icon;
                                                return (
                                                    <Command.Item
                                                        key={action.id}
                                                        value={action.label}
                                                        onSelect={() => handleQuickAction(action.id)}
                                                        className={cn(
                                                            'flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer',
                                                            'text-sm text-foreground transition-colors',
                                                            'data-[selected=true]:bg-accent',
                                                            'aria-selected:bg-accent'
                                                        )}
                                                    >
                                                        <span className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                                            <Zap className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
                                                        </span>
                                                        <span className="flex-1">{action.label}</span>
                                                        <Icon className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" aria-hidden="true" />
                                                    </Command.Item>
                                                );
                                            })}
                                        </Command.Group>
                                    </>
                                )}
                            </Command.List>

                            {/* Footer hint */}
                            <div className="border-t border-border px-4 py-2 flex items-center gap-4">
                                <span className="flex items-center gap-1 text-[10px] text-muted-foreground/60">
                                    <kbd className="px-1 py-0.5 rounded bg-muted border border-border font-mono">↑↓</kbd> navigate
                                </span>
                                <span className="flex items-center gap-1 text-[10px] text-muted-foreground/60">
                                    <kbd className="px-1 py-0.5 rounded bg-muted border border-border font-mono">↵</kbd> select
                                </span>
                                <span className="flex items-center gap-1 text-[10px] text-muted-foreground/60">
                                    <kbd className="px-1 py-0.5 rounded bg-muted border border-border font-mono">esc</kbd> close
                                </span>
                            </div>
                        </Command>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
