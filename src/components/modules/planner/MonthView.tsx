import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    isToday
} from 'date-fns';
import { cn } from '../../../lib/utils';
import type { CalendarEvent, Bill } from '../../../types/schema';
import { getTypeColor } from './utils';
import { DollarSign, Plus, MapPin, Clock } from 'lucide-react';
import { Button } from '../../common/Button';
import { useState } from 'react';

interface MonthViewProps {
    currentDate: Date;
    events: CalendarEvent[];
    bills: Bill[];
    onAddEvent: (date: Date) => void;
    onViewDay: (date: Date) => void;
    onEditEvent: (event: CalendarEvent) => void;
}

export function MonthView({
    currentDate,
    events,
    bills,
    onAddEvent,
    onViewDay,
    onEditEvent
}: MonthViewProps) {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const matchDays = eachDayOfInterval({ start: startDate, end: endDate });
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // State for Mobile Split View (Selected Day)
    // Default to today if in view, otherwise first day of month
    const [selectedDay, setSelectedDay] = useState<Date>(() => {
        const today = new Date();
        return isSameMonth(today, currentDate) ? today : monthStart;
    });

    // Filter events for the selected day (Mobile)
    const selectedDayEvents = events.filter(e => isSameDay(new Date(e.start), selectedDay))
        .sort((a, b) => a.start - b.start);
    const selectedDayBills = bills.filter(b => isSameDay(new Date(b.dueDate), selectedDay) && !b.isPaid);


    return (
        <div className="flex-1 flex flex-col md:bg-card md:rounded-2xl md:border md:border-border md:shadow-sm overflow-hidden animate-in fade-in duration-500">

            {/* Desktop Headers (Hidden on Mobile) */}
            <div className="hidden md:grid grid-cols-7 border-b border-border bg-muted/40">
                {weekDays.map((day) => (
                    <div key={day} className="py-2 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {day}
                    </div>
                ))}
            </div>

            {/* Mobile Headers (Compact) */}
            <div className="grid grid-cols-7 md:hidden border-b border-border bg-muted/40">
                {weekDays.map((day) => (
                    <div key={day} className="py-2 text-center text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                        {day.charAt(0)}
                    </div>
                ))}
            </div>

            {/* Calendar Grid Container */}
            <div className="flex-1 flex flex-col md:block">

                {/* 
                    Mobile: Split View Top (Grid) 
                    - Shows dots only
                    - Click selects day
                */}
                {/* 
                    Desktop: Full Grid
                    - Shows chips
                    - Click adds event
                 */}

                <div className="grid grid-cols-7 grid-rows-auto md:h-full">
                    {matchDays.map((day) => {
                        const isCurrentMonth = isSameMonth(day, monthStart);
                        const isDayToday = isToday(day);
                        const isSelected = isSameDay(day, selectedDay);

                        // Filter for this specific day
                        const dayEvents = events.filter(e => isSameDay(new Date(e.start), day));
                        const dayBills = bills.filter(b => isSameDay(new Date(b.dueDate), day) && !b.isPaid);
                        const hasBills = dayBills.length > 0;

                        return (
                            <div
                                key={day.toISOString()}
                                onClick={() => {
                                    // Mobile: Select day
                                    setSelectedDay(day);
                                    // Desktop: Add event (default behavior, though maybe we want viewDay?)
                                    // Actually, let's keep desktop behavior as "Add Event" or "View Day" via buttons
                                    // For now, onClick on desktop can also select? No, desktop lists events inside.
                                    // Let's make mobile select, desktop add/view.
                                    if (window.innerWidth >= 768) {
                                        onAddEvent(day);
                                    }
                                }}
                                className={cn(
                                    "relative transition-colors border-b border-r border-border/50 last:border-r-0 md:min-h-[120px] md:p-1 flex flex-col gap-1",
                                    // Mobile Styles
                                    "h-12 md:h-auto items-center justify-start pt-1 cursor-pointer",
                                    !isCurrentMonth && "bg-muted/10 text-muted-foreground/40",
                                    isDayToday && !isSelected && "bg-primary/5",
                                    isSelected && "md:bg-transparent relative z-10", // Mobile highlight handled by pseudo/indicator
                                    // Mobile selection ring
                                    isSelected && "md:ring-0 after:absolute after:inset-1 after:rounded-lg after:ring-2 after:ring-primary/50 after:md:hidden"
                                )}
                            >
                                {/* Date Number */}
                                <div className={cn(
                                    "w-7 h-7 flex items-center justify-center rounded-full text-sm transition-all md:w-6 md:h-6 md:text-sm",
                                    isDayToday
                                        ? "bg-primary text-primary-foreground font-extrabold ring-4 ring-primary/20 shadow-md scale-110 z-20"
                                        : "text-foreground font-medium"
                                )}>
                                    {format(day, 'd')}
                                </div>

                                {/* Mobile Dots */}
                                <div className="flex gap-0.5 md:hidden h-1.5 items-end">
                                    {hasBills && <div className="w-1 h-1 rounded-full bg-rose-500" />}
                                    {dayEvents.slice(0, 3).map((e, i) => {
                                        // Simple color mapping for dots based on type
                                        let dotColor = "bg-sky-500";
                                        if (e.type === 'work') dotColor = "bg-blue-500";
                                        if (e.type === 'family') dotColor = "bg-purple-500";
                                        if (e.type === 'school') dotColor = "bg-orange-500";


                                        return <div key={i} className={cn("w-1 h-1 rounded-full", dotColor)} />;
                                    })}
                                </div>

                                {/* Desktop Content (Hidden on Mobile) */}
                                <div className="hidden md:flex flex-col gap-1 w-full flex-1 overflow-hidden">
                                    {/* Desktop Header Row */}
                                    <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button size="icon" variant="ghost" className="h-5 w-5" onClick={(e) => { e.stopPropagation(); onAddEvent(day); }}>
                                            <Plus className="w-3 h-3" />
                                        </Button>
                                    </div>

                                    {dayBills.map(bill => (
                                        <div
                                            key={bill.id}
                                            className="text-xs px-1.5 py-0.5 rounded-sm bg-rose-500/5 text-foreground border-l-4 border-rose-500 hover:bg-rose-500/10 truncate flex items-center gap-1 font-medium"
                                        >
                                            <DollarSign className="w-2.5 h-2.5" />
                                            <span>{bill.name}</span>
                                        </div>
                                    ))}

                                    {dayEvents.slice(0, 4).map(event => {
                                        const styles = getTypeColor(event.type);
                                        return (
                                            <div
                                                key={event.id}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onEditEvent(event);
                                                }}
                                                className={cn(
                                                    "text-xs px-1.5 py-0.5 rounded-sm truncate cursor-pointer hover:opacity-80 transition-opacity font-medium",
                                                    styles,
                                                    event.isCompleted && "opacity-50 grayscale decoration-slice line-through"
                                                )}
                                            >
                                                <span className="opacity-75 mr-1 text-[9px]">{format(event.start, 'h:mma')}</span>
                                                {event.title}
                                            </div>
                                        )
                                    })}

                                    {dayEvents.length > 4 && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onViewDay(day); }}
                                            className="text-xs text-muted-foreground hover:text-primary text-left px-1 mt-auto"
                                        >
                                            + {dayEvents.length - 4} more...
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Mobile Agenda View (Bottom Half) */}
                <div className="block md:hidden border-t border-border bg-background flex-1 overflow-hidden flex flex-col min-h-[300px]">
                    <div className="p-4 border-b border-border/50 flex justify-between items-center bg-muted/20">
                        <div>
                            <h3 className="text-lg font-bold text-foreground">{format(selectedDay, 'EEEE, MMMM do')}</h3>
                            <p className="text-xs text-muted-foreground">
                                {selectedDayEvents.length} events • {selectedDayBills.length} bills
                            </p>
                        </div>
                        <Button size="sm" onClick={() => onAddEvent(selectedDay)} className="bg-primary/10 text-primary hover:bg-primary/20 border-0">
                            <Plus className="w-4 h-4 mr-1" /> Add
                        </Button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {selectedDayEvents.length === 0 && selectedDayBills.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground opacity-50">
                                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                                    <Clock className="w-6 h-6" />
                                </div>
                                <p className="text-sm font-medium">No events planned</p>
                                <p className="text-xs">Tap "Add" to create one</p>
                            </div>
                        )}

                        {/* Bills First */}
                        {selectedDayBills.map(bill => (
                            <div key={bill.id} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-rose-200/50 shadow-sm relative overflow-hidden group">
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-500" />
                                <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center shrink-0">
                                    <DollarSign className="w-5 h-5 text-rose-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-foreground truncate">{bill.name}</h4>
                                    <p className="text-xs text-rose-600 font-medium">Due Today</p>
                                </div>
                                <div className="text-lg font-bold text-foreground">
                                    ${bill.amount}
                                </div>
                            </div>
                        ))}

                        {/* Events */}
                        {selectedDayEvents.map(event => {
                            // Actually let's use the styles from utils but adapted for card
                            const styles = getTypeColor(event.type);

                            return (
                                <div
                                    key={event.id}
                                    onClick={() => onEditEvent(event)}
                                    className={cn(
                                        "flex gap-3 p-3 rounded-xl bg-card border shadow-sm cursor-pointer active:scale-[0.98] transition-all",
                                        "border-border hover:border-primary/50"
                                    )}
                                >
                                    {/* Time Column */}
                                    <div className="flex flex-col items-center justify-center w-14 shrink-0 text-center">
                                        <span className="text-sm font-bold text-foreground">
                                            {format(event.start, 'h:mm')}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground uppercase font-medium">
                                            {format(event.start, 'a')}
                                        </span>
                                    </div>

                                    {/* Vertical Line Separator */}
                                    <div className={cn("w-1 rounded-full my-1", styles.split(' ')[0].replace('/15', ''))} />

                                    {/* Content */}
                                    <div className="flex-1 min-w-0 py-0.5">
                                        <h4 className="font-semibold text-foreground truncate text-sm md:text-base">
                                            {event.title}
                                        </h4>
                                        <div className="flex items-center gap-2 mt-1">
                                            {event.location && (
                                                <div className="flex items-center text-xs text-muted-foreground truncate">
                                                    <MapPin className="w-3 h-3 mr-0.5" />
                                                    {event.location}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

            </div>
        </div>
    );
}
