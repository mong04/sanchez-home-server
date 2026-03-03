/**
 * MobileBottomNav.tsx — Fixed bottom tab bar for mobile (<768px).
 *
 * Shows exactly 5 slots: the 4 primary nav items + a "···More" trigger.
 * "More" opens the MobileDrawer (bottom sheet with secondary + admin items).
 *
 * Accessibility:
 *  - <nav aria-label="Mobile primary navigation"> landmark
 *  - aria-current="page" on active tab
 *  - min 48px touch targets
 *  - Safe-area inset for modern iOS/Android
 *  - aria-expanded on More button
 */
import { NavLink } from 'react-router-dom';
import { MoreHorizontal } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { useNavigationStore } from './useNavigationStore';
import { filterByRole } from './navConfig';
import { PRIMARY_NAV_ITEMS } from './navConfig';
import type { UserRole } from './navConfig';
import { useNeedsReviewCount } from '../../../hooks/useFinanceData';

interface MobileBottomNavProps {
    userRole?: UserRole;
}

export function MobileBottomNav({ userRole }: MobileBottomNavProps) {
    const { isMobileDrawerOpen, openMobileDrawer } = useNavigationStore();
    const { data: needsReviewCount } = useNeedsReviewCount();

    // Show 4 primary items + "More" (keeping bottom bar at exactly 5 tabs)
    const primaryItems = filterByRole(PRIMARY_NAV_ITEMS, userRole).slice(0, 4);

    return (
        <nav
            aria-label="Mobile primary navigation"
            className={cn(
                'md:hidden fixed bottom-0 left-0 right-0 z-40',
                'bg-card/80 backdrop-blur-md border-t border-border',
                // Safe-area for notched phones
                'pb-safe'
            )}
        >
            <div className="flex justify-around items-stretch h-16">
                {primaryItems.map(item => {
                    const Icon = item.icon;
                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.exact}
                            className="flex-1"
                        >
                            {({ isActive }) => (
                                <span
                                    className={cn(
                                        'flex flex-col items-center justify-center gap-1 w-full h-full',
                                        'touch-manipulation select-none',
                                        'transition-colors duration-150'
                                    )}
                                    aria-current={isActive ? 'page' : undefined}
                                >
                                    {/* Active pill indicator above icon */}
                                    <div className="relative">
                                        {isActive && (
                                            <span
                                                className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-primary rounded-full"
                                                aria-hidden="true"
                                            />
                                        )}
                                        <Icon
                                            className={cn(
                                                'w-5 h-5 transition-colors',
                                                isActive ? 'text-primary' : 'text-muted-foreground'
                                            )}
                                            aria-hidden="true"
                                        />
                                        {item.label === 'Finance' && !!needsReviewCount && needsReviewCount > 0 && (
                                            <span className="absolute -top-1 -right-2 w-3 h-3 bg-destructive rounded-full border-2 border-card" />
                                        )}
                                    </div>
                                    <span
                                        className={cn(
                                            'text-[10px] font-medium leading-tight',
                                            isActive ? 'text-primary' : 'text-muted-foreground'
                                        )}
                                    >
                                        {item.shortLabel}
                                    </span>
                                </span>
                            )}
                        </NavLink>
                    );
                })}

                {/* ──── More button ──── */}
                <button
                    onClick={openMobileDrawer}
                    aria-label="More navigation options"
                    aria-expanded={isMobileDrawerOpen}
                    aria-haspopup="dialog"
                    className={cn(
                        'flex-1 flex flex-col items-center justify-center gap-1',
                        'touch-manipulation select-none transition-colors duration-150',
                        isMobileDrawerOpen
                            ? 'text-primary'
                            : 'text-muted-foreground hover:text-foreground'
                    )}
                >
                    <MoreHorizontal className="w-5 h-5" aria-hidden="true" />
                    <span className="text-[10px] font-medium leading-tight">More</span>
                </button>
            </div>
        </nav>
    );
}
