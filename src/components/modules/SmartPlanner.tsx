import { useState } from 'react';
import { useCalendar } from '../../hooks/use-calendar';
import { useBills } from '../../hooks/use-organizer';
import type { CalendarEventType } from '../../types/schema';
import {
    format,
    startOfWeek,
    addDays,
    isSameDay,
    startOfMonth,
    endOfMonth,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    addMonths,
    startOfDay,
    endOfDay
} from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, DollarSign, Clock, Trash2, Edit2 } from 'lucide-react';
import { clsx } from 'clsx';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Modal } from '../common/Modal';

type CalendarView = 'month' | 'week' | 'day';

export function SmartPlanner() {
    const { events, addEvent, updateEvent, deleteEvent } = useCalendar();
    const { items: bills } = useBills();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [view, setView] = useState<CalendarView>('month');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false); // Controls View vs Edit mode in modal
    const [newEventTitle, setNewEventTitle] = useState('');
    const [newEventDate, setNewEventDate] = useState('');
    const [newEventStartTime, setNewEventStartTime] = useState('');
    const [newEventEndTime, setNewEventEndTime] = useState('');
    const [newEventDescription, setNewEventDescription] = useState('');

    const [selectedEvent, setSelectedEvent] = useState<any | null>(null); // Type 'any' to avoid import issues for now, or use CalendarEvent if imported

    // Calculate days to display based on view
    const calendarDays = (() => {
        if (view === 'day') {
            return [currentDate];
        } else if (view === 'week') {
            const start = startOfWeek(currentDate, { weekStartsOn: 0 });
            return Array.from({ length: 7 }).map((_, i) => addDays(start, i));
        } else {
            const monthStart = startOfMonth(currentDate);
            const monthEnd = endOfMonth(monthStart);
            const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
            const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });
            return eachDayOfInterval({ start: startDate, end: endDate });
        }
    })();

    const navigate = (direction: 'prev' | 'next') => {
        if (view === 'day') {
            setCurrentDate(d => addDays(d, direction === 'next' ? 1 : -1));
        } else if (view === 'week') {
            setCurrentDate(d => addDays(d, direction === 'next' ? 7 : -7));
        } else {
            setCurrentDate(d => addMonths(d, direction === 'next' ? 1 : -1));
        }
    };

    const [newEventLocation, setNewEventLocation] = useState('');
    const [newEventType, setNewEventType] = useState<CalendarEventType>('appointment');
    const [recurrence, setRecurrence] = useState<'none' | 'daily' | 'weekly' | 'monthly' | 'yearly'>('none');
    const [recurrenceInterval, setRecurrenceInterval] = useState(1);
    const [recurrenceDays, setRecurrenceDays] = useState<number[]>([]);
    const [recurrenceEndType, setRecurrenceEndType] = useState<'never' | 'date' | 'count'>('never');
    const [recurrenceEndDate, setRecurrenceEndDate] = useState('');
    const [recurrenceCount, setRecurrenceCount] = useState<number | ''>('');
    const [editScope, setEditScope] = useState<'this' | 'all'>('all');

    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilters, setActiveFilters] = useState<CalendarEventType[]>([]);

    // Helper to get color based on type
    const getTypeColor = (type: string) => {
        // ... (existing switch case)
        switch (type) {
            case 'work': return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-800';
            case 'family': return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-200 dark:border-purple-800';
            case 'school': return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-200 dark:border-orange-800';
            case 'sports': return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-200 dark:border-green-800';
            case 'reminder': return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-200 dark:border-yellow-800';
            case 'chore': return 'bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-900/30 dark:text-pink-200 dark:border-pink-800';
            case 'meal': return 'bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-900/30 dark:text-teal-200 dark:border-teal-800';
            default: return 'bg-primary/10 text-primary border-primary/20';
        }
    };



    const openAddEventModal = (day: Date, e?: React.MouseEvent) => {
        e?.stopPropagation();
        setSelectedEvent(null);

        // Initialize fields
        setNewEventTitle('');
        setNewEventDate(format(day, 'yyyy-MM-dd'));
        setNewEventStartTime('09:00');
        setNewEventEndTime('10:00');
        setNewEventDescription('');
        setNewEventLocation('');
        setNewEventType('appointment');
        setNewEventType('appointment');
        setRecurrence('none');
        setRecurrenceInterval(1);
        setRecurrenceDays([]);
        setRecurrenceEndType('never');
        setRecurrenceEndDate('');
        setRecurrenceCount('');

        setIsEditing(true); // New events start in edit mode
        setIsModalOpen(true);
    };

    const handleEventClick = (event: any, e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedEvent(event);

        // Initialize fields for editing
        setNewEventTitle(event.title);
        const start = new Date(event.start);
        const end = new Date(event.end);
        setNewEventDate(format(start, 'yyyy-MM-dd'));
        setNewEventStartTime(format(start, 'HH:mm'));
        setNewEventEndTime(format(end, 'HH:mm'));
        setNewEventDescription(event.description || '');
        setNewEventLocation(event.location || '');
        setNewEventType(event.type || 'appointment');

        // Handle recurrence values
        if (event.recurrence) {
            setRecurrence(event.recurrence.frequency);
            setRecurrenceInterval(event.recurrence.interval || 1);
            setRecurrenceDays(event.recurrence.daysOfWeek || []);

            if (event.recurrence.endDate) {
                setRecurrenceEndType('date');
                setRecurrenceEndDate(format(new Date(event.recurrence.endDate), 'yyyy-MM-dd'));
                setRecurrenceCount('');
            } else if (event.recurrence.count) {
                setRecurrenceEndType('count');
                setRecurrenceCount(event.recurrence.count);
                setRecurrenceEndDate('');
            } else {
                setRecurrenceEndType('never');
                setRecurrenceEndDate('');
                setRecurrenceCount('');
            }
        } else {
            setRecurrence('none');
            setRecurrenceInterval(1);
            setRecurrenceDays([]);
            setRecurrenceEndType('never');
            setRecurrenceEndDate('');
            setRecurrenceCount('');
        }

        setIsEditing(false); // Existing events start in view mode
        setIsModalOpen(true);
        setEditScope('all'); // Default to all when opening
    };

    const handleAddEventSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newEventTitle.trim() || !newEventDate || !newEventStartTime || !newEventEndTime) return;

        // Construct Date objects
        const start = new Date(`${newEventDate}T${newEventStartTime}`);
        const end = new Date(`${newEventDate}T${newEventEndTime}`);

        // Validation
        if (end <= start) {
            alert("End time must be after start time.");
            return;
        }

        const recurrenceRule = recurrence !== 'none' ? {
            frequency: recurrence as any,
            interval: Math.max(1, recurrenceInterval),
            daysOfWeek: recurrence === 'weekly' && recurrenceDays.length > 0 ? recurrenceDays : undefined,
            endDate: recurrenceEndType === 'date' && recurrenceEndDate ? new Date(recurrenceEndDate).getTime() : undefined,
            count: recurrenceEndType === 'count' && recurrenceCount ? Number(recurrenceCount) : undefined
        } : undefined;

        if (selectedEvent) {
            const originalId = selectedEvent.id.includes('_recur_') ? selectedEvent.id.split('_recur_')[0] : selectedEvent.id;

            if (editScope === 'this' && selectedEvent.recurrence) {
                // Formatting "This Event Only" exception logic
                // 1. Add exception to the original series
                const originalEvent = events.find(e => e.id === originalId);
                if (originalEvent && originalEvent.recurrence) {
                    const exceptionTimestamp = selectedEvent.start; // The timestamp of the instance
                    const updatedExceptions = [...(originalEvent.recurrence.exceptions || []), exceptionTimestamp];

                    updateEvent(originalId, {
                        ...originalEvent,
                        recurrence: {
                            ...originalEvent.recurrence,
                            exceptions: updatedExceptions
                        }
                    });
                }

                // 2. Create a new standalone event for this instance
                addEvent({
                    title: newEventTitle,
                    start: start.getTime(),
                    end: end.getTime(),
                    isLocked: false,
                    type: newEventType,
                    description: newEventDescription,
                    location: newEventLocation,
                    recurrence: undefined // Detached from series
                });

            } else {
                // Edit Series or Single Non-Recurring Event
                updateEvent(originalId, {
                    title: newEventTitle,
                    start: start.getTime(),
                    end: end.getTime(),
                    description: newEventDescription,
                    location: newEventLocation,
                    type: newEventType,
                    recurrence: recurrenceRule
                });
            }

            setIsEditing(false);
        } else {
            addEvent({
                title: newEventTitle,
                start: start.getTime(),
                end: end.getTime(),
                isLocked: false,
                type: newEventType,
                description: newEventDescription,
                location: newEventLocation,
                recurrence: recurrenceRule
            });
            setIsModalOpen(false); // Close after creating new
        }
    };

    const handleDelete = () => {
        if (selectedEvent) {
            const originalId = selectedEvent.id.includes('_recur_') ? selectedEvent.id.split('_recur_')[0] : selectedEvent.id;
            deleteEvent(originalId);
            setIsModalOpen(false);
        }
    };

    // Recurrence Expansion Logic
    const expandRecurringEvents = (baseEvents: any[], startRange: Date, endRange: Date) => {
        const expanded: any[] = [];

        baseEvents.forEach(event => {
            if (!event.recurrence) {
                if (event.start <= endRange.getTime() && event.end >= startRange.getTime()) {
                    expanded.push(event);
                }
                return;
            }

            const { frequency, interval = 1, endDate, count, daysOfWeek, exceptions } = event.recurrence;
            const eventStart = new Date(event.start);
            const eventDuration = event.end - event.start;

            let current = new Date(eventStart);
            let index = 0; // Total occurrence index


            // Safety break
            let iterations = 0;
            const MAX_ITERATIONS = 2000;

            // We iterate until we pass the range end, OR pass the endDate, OR hit the count.
            // Since we can start "before" the view range, we need to iterate from the beginning of the series
            // (or intelligently calculate the start point, but iterating is safer for complex rules like Monthly-on-weekday).

            // Optimization: For daily/weekly/monthly, if 'count' is NOT set, we could jump to startRange.
            // But if 'count' IS set, we MUST count from the beginning.
            // Let's stick to safe iteration for now, optimization later if slow.

            while (
                (endDate ? current.getTime() <= endDate : true) &&
                (count ? index < count : true)
            ) {
                iterations++;
                if (iterations > MAX_ITERATIONS) break;  // Failsafe

                // If current is past endRange and we don't need to count anymore, we can stop?
                if (current.getTime() > endRange.getTime()) break;

                // Check if valid day for Weekly
                let isValidInstance = true;
                if (frequency === 'weekly' && daysOfWeek && daysOfWeek.length > 0) {
                    // daysOfWeek is 0-6 (Sun-Sat).
                    // date-fns getDay() returns 0-6.
                    if (!daysOfWeek.includes(current.getDay())) {
                        isValidInstance = false;
                    }
                }

                // Check exceptions
                if (isValidInstance && exceptions && exceptions.some((ex: number) => isSameDay(new Date(ex), current))) {
                    isValidInstance = false;
                }

                if (isValidInstance) {
                    const instanceEnd = new Date(current.getTime() + eventDuration);

                    // Only add if it overlaps with view range
                    if (instanceEnd.getTime() >= startRange.getTime() && current.getTime() <= endRange.getTime()) {
                        expanded.push({
                            ...event,
                            id: `${event.id}_recur_${index}`,
                            start: current.getTime(),
                            end: instanceEnd.getTime(),
                        });
                    }
                    index++; // Only increment index if it was a valid instance (e.g. matched day of week)
                }

                // Advance
                switch (frequency) {
                    case 'daily':
                        current.setDate(current.getDate() + interval);
                        break;
                    case 'weekly':
                        // If we are using specific days of week, we shouldn't just jump by interval weeks if we are checking daily?
                        // Actually, standard Weekly recurrence means "Every N weeks".
                        // Within that week, it happens on Days X, Y, Z.
                        // Logic:
                        // If daysOfWeek is present:
                        // We are at a specific date. We should move to the NEXT day in the list.
                        // If we run out of days in this week, jump to the first day in the next interval.

                        if (daysOfWeek && daysOfWeek.length > 0) {
                            // Find next day in current week
                            // current day index
                            const currentDayIdx = current.getDay();
                            // sorted days
                            const sortedDays = [...daysOfWeek].sort((a, b) => a - b);

                            // Find first day > currentDayIdx
                            const nextDayInWeek = sortedDays.find(d => d > currentDayIdx);

                            if (nextDayInWeek !== undefined) {
                                // Move to that day in same week
                                const diff = nextDayInWeek - currentDayIdx;
                                current.setDate(current.getDate() + diff);
                            } else {
                                // Move to first day of next interval week
                                // Distance to end of week (Saturday = 6)
                                const firstDayOfNext = sortedDays[0];
                                // Add dist to end + (interval-1)*7 + (firstDay of next week from Sunday) + 1 (Sunday itself)
                                // Simpler: Move to next Sunday, add (interval-1) weeks, add firstDayOfNext.

                                // Move to next Sunday
                                current.setDate(current.getDate() + (7 - current.getDay()));
                                // Add (interval-1) weeks
                                current.setDate(current.getDate() + (interval - 1) * 7);
                                // Move to first target day
                                current.setDate(current.getDate() + firstDayOfNext);
                            }
                        } else {
                            // Simple weekly (same day next week)
                            current.setDate(current.getDate() + (interval * 7));
                        }
                        break;
                    case 'monthly':
                        current.setMonth(current.getMonth() + interval);
                        break;
                    case 'yearly':
                        current.setFullYear(current.getFullYear() + interval);
                        break;
                    default:
                        current = new Date(endRange.getTime() + 1000); // Break
                        break;
                }
            }
        });
        return expanded;
    };

    // Filter Logic
    const getFilteredEvents = (day?: Date) => {
        // First expand events for the relevant view range
        // For efficiency, we should determine the range of the current view (Month or Week or Day)
        // But 'events' doesn't change that often, so let's just do it for the whole currently active view range.

        // This is a bit inefficient to run on every render if we don't memoize.
        // But for < 100 events it's fine.

        let rangeStart = startOfMonth(currentDate);
        let rangeEnd = endOfMonth(currentDate);

        if (view === 'week') {
            rangeStart = startOfWeek(currentDate);
            rangeEnd = endOfWeek(currentDate);
        } else if (view === 'day') {
            rangeStart = startOfDay(currentDate);
            rangeEnd = endOfDay(currentDate);
        }

        // Expand
        let processedEvents = expandRecurringEvents(events, rangeStart, rangeEnd);

        // Then Filter
        // 1. Text Search
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            processedEvents = processedEvents.filter(e =>
                e.title.toLowerCase().includes(query) ||
                e.description?.toLowerCase().includes(query) ||
                e.location?.toLowerCase().includes(query)
            );
        }

        // 2. Type Filter
        if (activeFilters.length > 0) {
            processedEvents = processedEvents.filter(e => activeFilters.includes(e.type));
        }

        // 3. Day Filter
        if (day) {
            processedEvents = processedEvents.filter(e => isSameDay(new Date(e.start), day));
        }

        return processedEvents;
    };



    const getBillsForDay = (day: Date) => {
        return bills.filter(b => isSameDay(new Date(b.dueDate), day) && !b.isPaid);
    };

    // Helper for header text
    const getHeaderText = () => {
        if (view === 'day') return format(currentDate, 'EEEE, MMMM do, yyyy');
        if (view === 'week') {
            const start = startOfWeek(currentDate, { weekStartsOn: 0 });
            const end = addDays(start, 6);
            return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
        }
        return format(currentDate, 'MMMM yyyy');
    };

    return (
        <div className="h-full flex flex-col space-y-4 animate-in fade-in duration-500">
            {/* Header */}
            <header className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <h2 className="text-xl sm:text-2xl font-bold text-foreground truncate min-w-[200px]">
                        {getHeaderText()}
                    </h2>
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex items-center bg-muted rounded-lg p-1 border border-border shadow-sm">
                        <Button
                            variant={view === 'month' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setView('month')}
                            className="h-8 px-3 text-xs"
                        >
                            Month
                        </Button>
                        <Button
                            variant={view === 'week' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setView('week')}
                            className="h-8 px-3 text-xs"
                        >
                            Week
                        </Button>
                        <Button
                            variant={view === 'day' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setView('day')}
                            className="h-8 px-3 text-xs"
                        >
                            Day
                        </Button>
                    </div>

                    <div className="flex items-center space-x-1 bg-muted rounded-lg p-1 border border-border shadow-sm">
                        <Button variant="ghost" size="icon" onClick={() => navigate('prev')} className="h-8 w-8">
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => navigate('next')} className="h-8 w-8">
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </header>


            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4 p-2 bg-muted/20 rounded-lg">
                <div className="flex-1">
                    <Input
                        placeholder="Search events..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-card w-full"
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
                    {['all', 'appointment', 'family', 'work', 'school', 'sports', 'chore', 'meal'].map(type => (
                        <Button
                            key={type}
                            variant={activeFilters.includes(type as CalendarEventType) || (type === 'all' && activeFilters.length === 0) ? "secondary" : "outline"}
                            size="sm"
                            onClick={() => {
                                if (type === 'all') {
                                    setActiveFilters([]);
                                } else {
                                    setActiveFilters(prev =>
                                        prev.includes(type as CalendarEventType)
                                            ? prev.filter(t => t !== type)
                                            : [...prev, type as CalendarEventType]
                                    );
                                }
                            }}
                            className={clsx(
                                "capitalize whitespace-nowrap",
                                (type === 'all' && activeFilters.length === 0) && "bg-primary text-primary-foreground hover:bg-primary/90"
                            )}
                        >
                            {type}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Calendar Grid/List */}
            <div className={clsx(
                "flex-1 bg-border rounded-lg overflow-hidden shadow-sm border border-border",
                view === 'month'
                    ? "grid gap-px grid-cols-7 grid-rows-[auto_1fr]"
                    : view === 'week'
                        ? "grid gap-px grid-cols-1 sm:grid-cols-7"
                        : "flex flex-col bg-card" // Day view container
            )}>
                {/* Weekday Headers (Month View Only) */}
                {view === 'month' && ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="bg-muted/50 p-2 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {day}
                    </div>
                ))}

                {/* Days Loop */}
                {calendarDays.map((day) => {
                    const dayEvents = getFilteredEvents(day);
                    const dayBills = getBillsForDay(day);
                    const isToday = isSameDay(day, new Date());
                    const isCurrentMonth = isSameMonth(day, currentDate);

                    // Day View Render
                    if (view === 'day') {
                        return (
                            <div key={day.toISOString()} className="flex-1 flex flex-col h-full overflow-hidden bg-card">
                                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                    {/* Day View Content */}
                                    {dayBills.length > 0 && (
                                        <div className="space-y-2">
                                            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Bills Due</h3>
                                            <div className="grid gap-2 sm:grid-cols-2">
                                                {dayBills.map(bill => (
                                                    <div key={bill.id} className="flex items-center justify-between p-3 bg-destructive/5 border border-destructive/20 rounded-lg">
                                                        <div className="flex items-center gap-2">
                                                            <div className="p-2 bg-destructive/10 rounded-full">
                                                                <DollarSign className="w-4 h-4 text-destructive" />
                                                            </div>
                                                            <span className="font-medium text-destructive-foreground">{bill.name}</span>
                                                        </div>
                                                        <span className="text-lg font-bold text-destructive">${bill.amount}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Schedule</h3>
                                            <Button size="sm" variant="ghost" className="h-6 gap-1" onClick={(e) => openAddEventModal(day, e)}>
                                                <Plus className="w-3 h-3" /> Add Event
                                            </Button>
                                        </div>

                                        {dayEvents.length === 0 ? (
                                            <div className="text-center py-12 border-2 border-dashed border-muted rounded-xl">
                                                <p className="text-muted-foreground">No events found for this filter</p>
                                                <Button variant="link" onClick={(e) => openAddEventModal(day, e)}>Add generic event</Button>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                {dayEvents.map(event => (
                                                    <div key={event.id}
                                                        onClick={(e) => handleEventClick(event, e)}
                                                        className={clsx(
                                                            "flex gap-4 p-3 border rounded-lg transition-colors cursor-pointer hover:opacity-80",
                                                            getTypeColor(event.type)
                                                        )}
                                                    >
                                                        <div className="flex-none flex flex-col items-center justify-center w-16 border-r border-border/50 pr-4">
                                                            <span className="text-sm font-bold">{format(event.start, 'h:mm')}</span>
                                                            <span className="text-xs opacity-70">{format(event.start, 'a')}</span>
                                                        </div>
                                                        <div className="flex-1">
                                                            <h4 className="font-semibold">{event.title}</h4>
                                                            <div className="flex items-center gap-2 text-xs opacity-70 mt-1">
                                                                <span className="capitalize px-1.5 py-0.5 bg-background/50 rounded-full">{event.type}</span>
                                                                {event.location && <span>📍 {event.location}</span>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    }

                    // Month/Week View Render
                    return (
                        <div key={day.toISOString()}
                            onClick={() => openAddEventModal(day)}
                            className={clsx(
                                "bg-card relative group transition-colors cursor-pointer min-h-[100px] flex flex-col",
                                !isCurrentMonth && view === 'month' && "bg-muted/10 text-muted-foreground/50",
                                isToday && "bg-primary/5",
                                view === 'week' && "min-h-[150px] sm:h-auto border-b sm:border-b-0"
                            )}
                        >
                            {/* Day Header */}
                            <div className={clsx(
                                "flex items-center justify-between p-2 sticky top-0 bg-inherit z-10",
                                view === 'week' && "border-b border-border/50"
                            )}>
                                <span className={clsx(
                                    "text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full",
                                    isToday ? "bg-primary text-primary-foreground" : "text-foreground"
                                )}>
                                    {format(day, 'd')}
                                </span>
                                {view === 'week' && (
                                    <span className="text-xs text-muted-foreground uppercase font-bold">
                                        {format(day, 'EEE')}
                                    </span>
                                )}
                            </div>

                            {/* Events List */}
                            <div className="flex-1 p-1 space-y-1 overflow-y-auto max-h-[120px] scrollbar-none">
                                {dayBills.map(bill => (
                                    <div key={bill.id}
                                        className="bg-destructive/10 text-destructive text-[10px] px-1.5 py-0.5 rounded border border-destructive/20 flex items-center justify-between truncate"
                                        title={`Due: ${bill.name} ($${bill.amount})`}
                                    >
                                        <div className="flex items-center gap-1 truncate">
                                            <DollarSign className="w-3 h-3" />
                                            <span className="truncate">{bill.name}</span>
                                        </div>
                                    </div>
                                ))}

                                {dayEvents.map(event => (
                                    <div key={event.id}
                                        onClick={(e) => handleEventClick(event, e)}
                                        className={clsx(
                                            "text-[10px] px-1.5 py-0.5 rounded border truncate transition-colors hover:opacity-80 font-medium",
                                            getTypeColor(event.type)
                                        )}
                                    >
                                        {event.title}
                                    </div>
                                ))}
                            </div>

                            {/* Add Button Overlay (appear on hover) */}
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-6 w-6 rounded-full hover:bg-primary hover:text-primary-foreground"
                                    onClick={(e) => openAddEventModal(day, e)}
                                >
                                    <Plus className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    );
                })}
            </div>



            {/* Event Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={
                    isEditing
                        ? (selectedEvent ? 'Edit Event' : 'New Event')
                        : 'Event Details'
                }
            >
                {isEditing ? (
                    <form onSubmit={handleAddEventSubmit} className="space-y-4">
                        <Input
                            autoFocus
                            label="Event Title"
                            placeholder="e.g. Doctor Appointment"
                            value={newEventTitle}
                            onChange={(e) => setNewEventTitle(e.target.value)}
                            required
                        />

                        {selectedEvent && selectedEvent.recurrence && (
                            <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-md">
                                <label className="text-sm font-medium mb-2 block text-yellow-600 dark:text-yellow-400">Edit Options</label>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 text-sm cursor-pointer font-medium">
                                        <input
                                            type="radio"
                                            name="editScope"
                                            checked={editScope === 'this'}
                                            onChange={() => setEditScope('this')}
                                            className="accent-yellow-500"
                                        />
                                        This event only
                                    </label>
                                    <label className="flex items-center gap-2 text-sm cursor-pointer font-medium">
                                        <input
                                            type="radio"
                                            name="editScope"
                                            checked={editScope === 'all'}
                                            onChange={() => setEditScope('all')}
                                            className="accent-yellow-500"
                                        />
                                        Entire series
                                    </label>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium mb-1 block">Type</label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={newEventType}
                                    onChange={(e) => setNewEventType(e.target.value as CalendarEventType)}
                                >
                                    <option value="appointment">Appointment</option>
                                    <option value="family">Family</option>
                                    <option value="work">Work</option>
                                    <option value="school">School</option>
                                    <option value="sports">Sports</option>
                                    <option value="reminder">Reminder</option>
                                    <option value="chore">Chore</option>
                                    <option value="meal">Meal</option>
                                </select>
                            </div>
                            <Input
                                label="Location (Optional)"
                                placeholder="e.g. 123 Main St"
                                value={newEventLocation}
                                onChange={(e) => setNewEventLocation(e.target.value)}
                            />
                        </div>

                        <div className="space-y-4 border border-border rounded-lg p-4 bg-muted/20">
                            <div>
                                <label className="text-sm font-medium mb-1 block">Repeat</label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={recurrence}
                                    onChange={(e) => setRecurrence(e.target.value as any)}
                                >
                                    <option value="none">Does not repeat</option>
                                    <option value="daily">Daily</option>
                                    <option value="weekly">Weekly</option>
                                    <option value="monthly">Monthly</option>
                                    <option value="yearly">Yearly</option>
                                </select>
                            </div>

                            {recurrence !== 'none' && (
                                <div className="space-y-4 pt-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm min-w-[40px]">Every</span>
                                        <Input
                                            type="number"
                                            min="1"
                                            value={recurrenceInterval}
                                            onChange={(e) => setRecurrenceInterval(Number(e.target.value))}
                                            className="w-20 h-9"
                                        />
                                        <span className="text-sm">
                                            {recurrence === 'daily' && (recurrenceInterval === 1 ? 'day' : 'days')}
                                            {recurrence === 'weekly' && (recurrenceInterval === 1 ? 'week' : 'weeks')}
                                            {recurrence === 'monthly' && (recurrenceInterval === 1 ? 'month' : 'months')}
                                            {recurrence === 'yearly' && (recurrenceInterval === 1 ? 'year' : 'years')}
                                        </span>
                                    </div>

                                    {recurrence === 'weekly' && (
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Repeat on</label>
                                            <div className="flex gap-1 justify-between">
                                                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
                                                    <button
                                                        key={idx}
                                                        type="button"
                                                        onClick={() => {
                                                            setRecurrenceDays(prev =>
                                                                prev.includes(idx) ? prev.filter(d => d !== idx) : [...prev, idx]
                                                            );
                                                        }}
                                                        className={clsx(
                                                            "w-8 h-8 rounded-full text-xs font-bold transition-colors flex items-center justify-center",
                                                            recurrenceDays.includes(idx)
                                                                ? "bg-primary text-primary-foreground"
                                                                : "bg-background border border-border hover:bg-muted text-muted-foreground"
                                                        )}
                                                    >
                                                        {day}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-2 pt-2 border-t border-border/50">
                                        <label className="text-sm font-medium block">Ends</label>
                                        <div className="space-y-2">
                                            <label className="flex items-center gap-2 text-sm cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="recurrenceEnd"
                                                    checked={recurrenceEndType === 'never'}
                                                    onChange={() => setRecurrenceEndType('never')}
                                                    className="accent-primary"
                                                />
                                                Never
                                            </label>
                                            <div className="flex items-center gap-2 text-sm">
                                                <input
                                                    type="radio"
                                                    name="recurrenceEnd"
                                                    checked={recurrenceEndType === 'date'}
                                                    onChange={() => setRecurrenceEndType('date')}
                                                    className="accent-primary"
                                                />
                                                <span>On</span>
                                                <Input
                                                    type="date"
                                                    className="w-auto h-8 px-2 py-1 ml-1"
                                                    value={recurrenceEndDate}
                                                    disabled={recurrenceEndType !== 'date'}
                                                    onChange={(e) => setRecurrenceEndDate(e.target.value)}
                                                />
                                            </div>
                                            <div className="flex items-center gap-2 text-sm">
                                                <input
                                                    type="radio"
                                                    name="recurrenceEnd"
                                                    checked={recurrenceEndType === 'count'}
                                                    onChange={() => setRecurrenceEndType('count')}
                                                    className="accent-primary"
                                                />
                                                <span>After</span>
                                                <Input
                                                    type="number"
                                                    className="w-16 h-8 px-2 py-1 mx-1"
                                                    min="1"
                                                    value={recurrenceCount}
                                                    disabled={recurrenceEndType !== 'count'}
                                                    onChange={(e) => setRecurrenceCount(Number(e.target.value))}
                                                />
                                                occurrences
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                type="date"
                                label="Date"
                                value={newEventDate}
                                onChange={(e) => setNewEventDate(e.target.value)}
                                required
                            />
                            <Input
                                type="time"
                                label="Start Time"
                                value={newEventStartTime}
                                onChange={(e) => setNewEventStartTime(e.target.value)}
                                required
                            />
                        </div>

                        <Input
                            type="time"
                            label="End Time"
                            value={newEventEndTime}
                            onChange={(e) => setNewEventEndTime(e.target.value)}
                            required
                        />

                        <Input
                            label="Description (Optional)"
                            placeholder="Add details, notes, or agenda..."
                            value={newEventDescription}
                            onChange={(e) => setNewEventDescription(e.target.value)}
                        />

                        <div className="flex justify-end gap-2 pt-4 border-t border-border mt-6">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => {
                                    if (selectedEvent) {
                                        setIsEditing(false); // Go back to view mode
                                    } else {
                                        setIsModalOpen(false); // Close if canceling new event
                                    }
                                }}
                            >
                                Cancel
                            </Button>
                            <Button type="submit">
                                {selectedEvent ? 'Save Changes' : 'Create Event'}
                            </Button>
                        </div>
                    </form>
                ) : (
                    selectedEvent && (
                        <div className="space-y-6">
                            <div className="space-y-4">
                                <div>
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-2xl font-bold text-foreground">{selectedEvent.title}</h3>
                                        <span className={clsx(
                                            "text-xs px-2 py-1 rounded-full capitalize font-medium",
                                            getTypeColor(selectedEvent.type)
                                        )}>
                                            {selectedEvent.type}
                                        </span>
                                    </div>
                                    {selectedEvent.location && (
                                        <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                                            📍 {selectedEvent.location}
                                        </p>
                                    )}
                                    {selectedEvent.recurrence && (
                                        <p className="text-sm text-blue-500 mt-1 flex items-center gap-1 font-medium">
                                            🔄 Repeats {selectedEvent.recurrence.frequency}
                                        </p>
                                    )}
                                </div>

                                <div className="flex items-center text-muted-foreground space-x-2 p-3 bg-muted/30 rounded-lg border border-border/50">
                                    <div className="p-2 bg-background rounded-md shadow-sm">
                                        <Clock className="w-5 h-5 text-primary" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-medium text-foreground">
                                            {format(selectedEvent.start, 'EEEE, MMMM do, yyyy')}
                                        </span>
                                        <span className="text-sm">
                                            {format(selectedEvent.start, 'h:mm a')} - {format(selectedEvent.end, 'h:mm a')}
                                        </span>
                                    </div>
                                </div>

                                {selectedEvent.description && (
                                    <div className="p-4 bg-muted/30 rounded-lg text-sm text-foreground/80 border border-border/50 whitespace-pre-wrap">
                                        {selectedEvent.description}
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-border">
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    className="gap-2"
                                    onClick={handleDelete}
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Delete
                                </Button>
                                <div className="flex gap-2">
                                    <Button
                                        variant="secondary"
                                        onClick={() => setIsModalOpen(false)}
                                    >
                                        Close
                                    </Button>
                                    <Button
                                        onClick={() => setIsEditing(true)}
                                        className="gap-2"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                        Edit
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )
                )}
            </Modal>
        </div>
    );
}
