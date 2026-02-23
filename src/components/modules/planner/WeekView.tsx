import {
    format,
    startOfWeek,
    addDays,
    isSameDay,
    isToday
} from 'date-fns';
import { cn } from '../../../lib/utils';
import type { CalendarEvent, Bill } from '../../../types/schema';
import { getTypeColor } from './utils';
import { Plus } from 'lucide-react';
import { Button } from '../../common/Button';

interface WeekViewProps {
    currentDate: Date;
    events: CalendarEvent[];
    bills: Bill[];
    onAddEvent: (date: Date) => void;
    onEditEvent: (event: CalendarEvent) => void;
}

export function WeekView({
    currentDate,
    events,
    bills,
    onAddEvent,
    onEditEvent
}: WeekViewProps) {
    const startDate = startOfWeek(currentDate, { weekStartsOn: 0 });
    const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(startDate, i));

    return (
        <div className="flex-1 grid grid-cols-1 md:grid-cols-7 gap-4 md:gap-px md:bg-border md:border md:border-border rounded-2xl overflow-hidden animate-in fade-in duration-500">
            {weekDays.map((day) => {
                const isDayToday = isToday(day);

                // Filter Events
                const dayEvents = events
                    .filter(e => isSameDay(new Date(e.start), day))
                    .sort((a, b) => a.start - b.start);

                const dayBills = bills.filter(b => isSameDay(new Date(b.dueDate), day) && !b.isPaid);

                return (
                    <div
                        key={day.toISOString()}
                        className={cn(
                            "flex flex-col gap-2 min-h-[150px] md:min-h-[400px] bg-card p-3 md:p-2",
                            "rounded-xl border border-border md:rounded-none md:border-0",
                            isDayToday && "bg-primary/5"
                        )}
                        onClick={() => onAddEvent(day)}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between md:flex-col md:items-start md:gap-1 border-b border-border/50 pb-2 md:pb-0 md:border-0">
                            <div className="flex items-center gap-2 md:block">
                                <span className={cn(
                                    "text-sm font-semibold uppercase text-muted-foreground",
                                    isDayToday && "text-primary"
                                )}>
                                    {format(day, 'EEE')}
                                </span>
                                <span className={cn(
                                    "text-lg transition-all w-8 h-8 flex items-center justify-center rounded-full md:mt-1",
                                    isDayToday ? "bg-primary text-primary-foreground font-extrabold ring-4 ring-primary/20 shadow-md scale-110" : "text-foreground font-bold"
                                )}>
                                    {format(day, 'd')}
                                </span>
                            </div>

                            <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6 md:hidden"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onAddEvent(day);
                                }}
                            >
                                <Plus className="w-4 h-4" />
                            </Button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 space-y-1.5 overflow-y-auto max-h-[300px] md:max-h-none scrollbar-hide">
                            {/* Bills */}
                            {dayBills.map(bill => (
                                <div
                                    key={bill.id}
                                    className="text-xs px-2 py-1 rounded-md bg-rose-500/5 text-foreground border-l-4 border-rose-500 hover:bg-rose-500/10 flex items-center justify-between"
                                >
                                    <span className="truncate flex-1">{bill.name}</span>
                                    <span className="font-bold ml-1">${bill.amount}</span>
                                </div>
                            ))}

                            {/* Events */}
                            {dayEvents.map(event => {
                                const styles = getTypeColor(event.type);
                                return (
                                    <div
                                        key={event.id}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onEditEvent(event);
                                        }}
                                        className={cn(
                                            "group p-2 rounded-lg cursor-pointer transition-all hover:scale-[1.01] shadow-sm",
                                            styles,
                                            // Override utils border if needed for card look? No, utils has border-l-4 which is good.
                                            // We want background opacity to be slightly higher for cards? utils has /15.
                                            "border-y-0 border-r-0",
                                            event.isCompleted && "opacity-50 grayscale decoration-slice line-through"
                                        )}
                                    >
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-xs font-bold opacity-75">
                                                {format(event.start, 'h:mm a')}
                                            </span>
                                            <span className="font-semibold text-sm leading-tight truncate">
                                                {event.title}
                                            </span>
                                            {event.location && (
                                                <span className="text-[10px] opacity-70 truncate mt-0.5">
                                                    {event.location}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}

                            {dayEvents.length === 0 && dayBills.length === 0 && (
                                <div className="flex-1 flex items-center justify-center text-muted-foreground/20 text-xs md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                    Empty
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
