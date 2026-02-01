import { useState } from 'react';
import { useCalendar } from '../../hooks/use-calendar';
import { useBills } from '../../hooks/use-organizer';
import { format, startOfWeek, addDays, startOfDay, isSameDay } from 'date-fns';
import { ChevronLeft, ChevronRight, Lock, Plus, DollarSign } from 'lucide-react';
import { clsx } from 'clsx';

export function SmartPlanner() {
    const { events, addEvent } = useCalendar();
    const { items: bills } = useBills();
    const [currentDate, setCurrentDate] = useState(new Date());

    const startOfCurrentWeek = startOfWeek(currentDate, { weekStartsOn: 0 });
    const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(startOfCurrentWeek, i));

    const handleAddEvent = (day: Date) => {
        const title = prompt("Event Title:");
        if (!title) return;

        const start = startOfDay(day).setHours(9, 0, 0, 0); // Default 9 AM
        addEvent({
            title,
            start,
            end: start + 3600000, // 1 hour
            isLocked: false,
            type: 'appointment'
        });
    };

    const getEventsForDay = (day: Date) => {
        return events.filter(e => isSameDay(new Date(e.start), day));
    };

    const getBillsForDay = (day: Date) => {
        return bills.filter(b => isSameDay(new Date(b.dueDate), day) && !b.isPaid);
    };

    return (
        <div className="h-full flex flex-col space-y-6">
            <header className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-foreground">Smart Planner</h2>
                <div className="flex items-center space-x-4 bg-muted rounded-lg p-1 border border-border">
                    <button onClick={() => setCurrentDate(d => addDays(d, -7))} className="p-2 hover:bg-background rounded-md text-muted-foreground hover:text-foreground">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="text-sm font-medium text-foreground w-32 text-center">
                        {format(startOfCurrentWeek, 'MMM d')} - {format(weekDays[6], 'MMM d, yyyy')}
                    </span>
                    <button onClick={() => setCurrentDate(d => addDays(d, 7))} className="p-2 hover:bg-background rounded-md text-muted-foreground hover:text-foreground">
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </header>

            <div className="flex-1 grid grid-cols-7 gap-px bg-border rounded-2xl overflow-hidden border border-border shadow-xl">
                {weekDays.map((day) => {
                    const dayEvents = getEventsForDay(day);
                    const dayBills = getBillsForDay(day);
                    const isToday = isSameDay(day, new Date());

                    return (
                        <div key={day.toISOString()} className="bg-card min-h-[150px] flex flex-col hover:bg-muted/50 transition-colors group relative">
                            <div className={clsx(
                                "text-center py-2 text-sm font-medium border-b border-border/50",
                                isToday ? "bg-primary/10 text-primary" : "text-muted-foreground"
                            )}>
                                <div className="text-[10px] uppercase tracking-wider">{format(day, 'EEE')}</div>
                                <div className="text-lg">{format(day, 'd')}</div>
                            </div>

                            <div className="flex-1 p-2 space-y-2 overflow-y-auto">
                                {/* Bill Markers */}
                                {dayBills.map(bill => (
                                    <div key={bill.id}
                                        className="bg-destructive/10 border border-destructive/20 text-destructive rounded px-1.5 py-1 text-[10px] flex items-center justify-between hover:bg-destructive/20 cursor-pointer"
                                        title={`Due: $${bill.amount}`}
                                    >
                                        <div className="flex items-center space-x-1 truncate max-w-[80%]">
                                            <DollarSign className="w-3 h-3 flex-shrink-0" />
                                            <span className="truncate font-medium">{bill.name}</span>
                                        </div>
                                        <span>${bill.amount}</span>
                                    </div>
                                ))}

                                {/* Event Markers */}
                                {dayEvents.map(event => (
                                    <div key={event.id} className={clsx(
                                        "text-xs p-2 rounded-md border text-left truncate cursor-pointer transition-all hover:scale-[1.02]",
                                        event.isLocked
                                            ? "bg-muted border-border text-muted-foreground"
                                            : "bg-primary/10 border-primary/20 text-primary hover:bg-primary/20"
                                    )}>
                                        <div className="flex items-center justify-between">
                                            <span className="font-semibold truncate">{event.title}</span>
                                            {event.isLocked && <Lock className="w-3 h-3 flex-shrink-0" />}
                                        </div>
                                        <div className="opacity-70 text-[10px] mt-0.5">
                                            {format(event.start, 'h:mm a')}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Add Button (Desktop Hover) */}
                            <button
                                onClick={() => handleAddEvent(day)}
                                className="absolute bottom-2 right-2 p-1.5 rounded-full bg-primary text-primary-foreground opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-primary/90 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                aria-label="Add event"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
