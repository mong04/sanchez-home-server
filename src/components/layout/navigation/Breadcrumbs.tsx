/**
 * Breadcrumbs.tsx — Route-aware breadcrumb trail.
 * Uses React Router's useMatches() to build a path from the current URL.
 * Shown on desktop/tablet only (hidden on mobile).
 */
import { useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { ALL_NAV_ITEMS } from './navConfig';

interface Crumb {
    label: string;
    path: string;
    isCurrent: boolean;
}

/**
 * Builds a breadcrumb array from the current pathname.
 * Matches against navConfig to humanize path segments.
 */
function useBreadcrumbs(): Crumb[] {
    const { pathname } = useLocation();

    if (pathname === '/') {
        return [{ label: 'Home', path: '/', isCurrent: true }];
    }

    const segments = pathname.split('/').filter(Boolean);
    const crumbs: Crumb[] = [{ label: 'Home', path: '/', isCurrent: false }];

    let builtPath = '';
    segments.forEach((segment, index) => {
        builtPath += `/${segment}`;
        const isLast = index === segments.length - 1;

        // Try to match against navConfig for a human-readable label
        const matchedItem = ALL_NAV_ITEMS.find(item => item.path === builtPath);
        const label = matchedItem?.label ?? capitalize(segment.replace(/-/g, ' '));

        crumbs.push({ label, path: builtPath, isCurrent: isLast });
    });

    return crumbs;
}

function capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

interface BreadcrumbsProps {
    className?: string;
}

export function Breadcrumbs({ className }: BreadcrumbsProps) {
    const crumbs = useBreadcrumbs();

    // Don't render if we're just at root — no trail worth showing
    if (crumbs.length <= 1) return null;

    return (
        <nav aria-label="Breadcrumb" className={cn('hidden md:flex items-center gap-1', className)}>
            <ol className="flex items-center gap-1 list-none">
                {crumbs.map((crumb, index) => (
                    <li key={crumb.path} className="flex items-center gap-1">
                        {index > 0 && (
                            <ChevronRight
                                className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0"
                                aria-hidden="true"
                            />
                        )}
                        {crumb.isCurrent ? (
                            <span
                                className="text-sm font-medium text-foreground"
                                aria-current="page"
                            >
                                {crumb.label}
                            </span>
                        ) : (
                            <a
                                href={crumb.path}
                                className={cn(
                                    'text-sm text-muted-foreground transition-colors',
                                    'hover:text-foreground focus-visible:outline-none',
                                    'focus-visible:ring-2 focus-visible:ring-ring rounded-sm'
                                )}
                            >
                                {crumb.label}
                            </a>
                        )}
                    </li>
                ))}
            </ol>
        </nav>
    );
}
