import { format, isSameDay, isToday } from 'date-fns';
import type { CalendarEvent, Bill } from '../../../types/schema';
import { cn } from '../../../lib/utils';
import { getTypeColor } from './utils';
import { DollarSign, Clock, Plus, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '../../common/Button';

interface DayViewProps {
    currentDate: Date;
    events: CalendarEvent[];
    bills: Bill[];
    onAddEvent: (date: Date) => void;
    onEditEvent: (event: CalendarEvent) => void;
}

export function DayView({ currentDate, events, bills, onAddEvent, onEditEvent }: DayViewProps) {
    // Filter for current day
    const dayEvents = events.filter(e => isSameDay(new Date(e.start), currentDate));
    const dayBills = bills.filter(b => isSameDay(new Date(b.dueDate), currentDate) && !b.isPaid);

    // Sort events by time
    const sortedEvents = [...dayEvents].sort((a, b) => a.start - b.start);

    // Separate All Day / Timed
    // For now assuming all events have times, but we could add all-day logic later.
    // Treating Bills as "All Day" items at the top.

    const isEmpty = dayEvents.length === 0 && dayBills.length === 0;

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-card rounded-2xl border border-border mt-4 shadow-sm animate-in fade-in duration-500">
            {/* Header / Info for Day */}
            <div className="p-4 border-b border-border bg-muted/20 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <span className={cn(
                        "text-lg font-bold w-10 h-10 flex items-center justify-center rounded-full border",
                        isToday(currentDate)
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background text-foreground border-border"
                    )}>
                        {format(currentDate, 'd')}
                    </span>
                    <div className="flex flex-col">
                        <span className="text-sm font-semibold uppercase text-muted-foreground tracking-wide">
                            {format(currentDate, 'EEEE')}
                        </span>
                        <span className="text-xs text-muted-foreground">
                            {dayEvents.length} events • {dayBills.length} bills
                        </span>
                    </div>
                </div>
                <Button size="sm" onClick={() => onAddEvent(currentDate)} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add Event
                </Button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">

                {/* Empty State Pattern */}
                {isEmpty && (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-80 min-h-[300px]">
                        <div className="p-4 rounded-full bg-sky-500/10 mb-4">
                            <CalendarIcon className="w-8 h-8 text-sky-500" />
                        </div>
                        <h3 className="text-lg font-bold text-foreground">All clear!</h3>
                        <p className="text-sm text-muted-foreground max-w-[200px]">
                            No events or bills scheduled for today. Enjoy the free time!
                        </p>
                        <Button variant="link" onClick={() => onAddEvent(currentDate)} className="mt-2 text-sky-500">
                            Plan something?
                        </Button>
                    </div>
                )}

                {/* 1. Use Case: Bills (Unified Timeline Top) */}
                {dayBills.length > 0 && (
                    <div className="space-y-3">
                        <h3 className="text-xs font-bold text-rose-500 uppercase tracking-widest flex items-center gap-2">
                            <DollarSign className="w-3 h-3" />
                            Bills Due
                        </h3>
                        <div className="grid gap-3 sm:grid-cols-2">
                            {dayBills.map(bill => (
                                <div key={bill.id} className="group relative overflow-hidden rounded-xl border border-rose-200 bg-rose-50/50 dark:bg-rose-950/10 dark:border-rose-900/50 p-3 flex items-center justify-between transition-all hover:shadow-md hover:border-rose-300">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-rose-500/10 text-rose-600">
                                            <DollarSign className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-foreground">{bill.name}</p>
                                            <p className="text-xs text-muted-foreground">Auto-pay recommended</p>
                                        </div>
                                    </div>
                                    <span className="text-lg font-bold text-foreground">
                                        ${bill.amount}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 2. Use Case: Schedule (Timeline) */}
                {sortedEvents.length > 0 && (
                    <div className="space-y-3">
                        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                            <Clock className="w-3 h-3" />
                            Schedule
                        </h3>
                        <div className="space-y-2">
                            {sortedEvents.map((event) => {
                                const styles = getTypeColor(event.type);

                                return (
                                    <div
                                        key={event.id}
                                        onClick={() => onEditEvent(event)}
                                        className={cn(
                                            "group flex gap-4 p-4 rounded-xl bg-card border-l-4 shadow-sm cursor-pointer transition-all active:scale-[0.99] hover:shadow-md hover:translate-x-1",
                                            // Extract border color from utils style string or just used fixed styles?
                                            // Actually let's use the exact style string from utils but apply it carefully
                                            styles,
                                            "border-y border-r border-border/50", // Add back standard borders but keeping the colored left border
                                            event.isCompleted && "opacity-50 grayscale decoration-slice line-through"
                                        )}
                                    >
                                        <div className="flex flex-col items-center justify-center shrink-0">
                                            <span className="text-sm font-bold text-foreground">
                                                {format(event.start, 'h:mm')}
                                            </span>
                                            <span className="text-xs text-muted-foreground uppercase">
                                                {format(event.start, 'a')}
                                            </span>
                                        </div>

                                        {/* Card */}
                                        <div className={cn(
                                            "flex-1 p-3 rounded-lg border border-l-4 transition-all hover:translate-x-1",
                                            styles
                                        )}>
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h4 className="font-semibold text-sm md:text-base">{event.title}</h4>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-xs opacity-80 capitalize">{event.type}</span>
                                                        {event.location && (
                                                            <>
                                                                <span className="text-xs opacity-50">•</span>
                                                                <span className="text-xs opacity-80 truncate max-w-[150px]">{event.location}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
