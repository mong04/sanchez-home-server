import { format, startOfWeek, endOfWeek } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../../common/Button';
import { cn } from '../../../lib/utils';

type CalendarView = 'month' | 'week' | 'day';

interface PlannerHeaderProps {
    currentDate: Date;
    view: CalendarView;
    onViewChange: (view: CalendarView) => void;
    onNavigate: (direction: 'prev' | 'next' | 'today') => void;
    className?: string;
}

export function PlannerHeader({
    currentDate,
    view,
    onViewChange,
    onNavigate,
    className
}: PlannerHeaderProps) {

    // Helper for header text logic
    const getHeaderText = () => {
        if (view === 'day') return format(currentDate, 'MMMM do, yyyy');
        if (view === 'week') {
            const start = startOfWeek(currentDate, { weekStartsOn: 0 });
            const end = endOfWeek(currentDate, { weekStartsOn: 0 });

            // If same month
            if (start.getMonth() === end.getMonth()) {
                return `${format(start, 'MMM d')} - ${format(end, 'd, yyyy')}`;
            }
            // Different months
            return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
        }
        return format(currentDate, 'MMMM yyyy');
    };

    const getSubtitleText = () => {
        if (view === 'day') return format(currentDate, 'EEEE');
        if (view === 'week') return 'Week View';
        return format(currentDate, 'yyyy');
    };

    return (
        <header className={cn(
            "relative overflow-hidden rounded-2xl border border-border p-5 md:p-6",
            "bg-gradient-to-br from-primary/5 via-card to-card",
            "flex flex-col md:flex-row items-start md:items-center justify-between gap-6",
            className
        )}>
            {/* Decorative blob per guidelines */}
            <div className="absolute -top-20 -right-20 w-60 h-60 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />

            {/* Title Section */}
            <div className="relative z-10">
                <p className="text-sm text-muted-foreground font-medium mb-1 uppercase tracking-wider">
                    {getSubtitleText()}
                </p>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                    {getHeaderText()}
                </h2>
            </div>

            {/* Controls Section */}
            <div className="relative z-10 flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">

                {/* View Switcher */}
                <div className="flex items-center bg-muted/50 rounded-lg p-1 border border-border/50 shadow-sm w-full sm:w-auto">
                    {(['month', 'week', 'day'] as CalendarView[]).map((v) => (
                        <Button
                            key={v}
                            variant={view === v ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => onViewChange(v)}
                            className={cn(
                                "flex-1 sm:flex-none capitalize h-8 text-xs font-medium",
                                view === v && "bg-background shadow-sm text-foreground"
                            )}
                        >
                            {v}
                        </Button>
                    ))}
                </div>

                {/* divider for desktop */}
                <div className="hidden sm:block w-px h-8 bg-border/50" />

                {/* Navigation */}
                <div className="flex items-center gap-1 w-full sm:w-auto justify-between sm:justify-start">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onNavigate('today')}
                        className="h-9 mr-2 text-xs"
                    >
                        Today
                    </Button>

                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => onNavigate('prev')} className="h-9 w-9">
                            <ChevronLeft className="w-5 h-5 text-muted-foreground" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => onNavigate('next')} className="h-9 w-9">
                            <ChevronRight className="w-5 h-5 text-muted-foreground" />
                        </Button>
                    </div>
                </div>
            </div>
        </header>
    );
}
