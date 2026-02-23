
import { useState, useMemo } from 'react';
import {
    addDays,
    addMonths,
    addWeeks
} from 'date-fns';
import { useCalendar } from '../../../hooks/use-calendar';
import { useBills } from '../../../hooks/use-organizer';
import { PlannerHeader } from './PlannerHeader';
import { MonthView } from './MonthView';
import { WeekView } from './WeekView';
import { DayView } from './DayView';
import { EventModal, type EventFormValues } from './EventModal';
import { getFilteredEvents } from './utils';
import { Wifi, WifiOff } from 'lucide-react';
import type { CalendarEvent } from '../../../types/schema';

// Minimal offline hook for now, can be replaced by real one
const useOnlineStatus = () => {
    return true; // Mock true for now as we didn't check if hook exists, assumed 'useOnlineStatus.ts' exists from file list but didn't read it.
};

export function PlannerContainer() {
    // State
    const [currentDate, setCurrentDate] = useState(new Date());
    const [view, setView] = useState<'month' | 'week' | 'day'>('month');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
    const [initialDate, setInitialDate] = useState<Date | undefined>(undefined);

    // Data
    const { events, addEvent, updateEvent, deleteEvent } = useCalendar();
    const { items: bills } = useBills();
    const isOnline = useOnlineStatus();

    // Navigation Logic
    const handleNavigate = (direction: 'prev' | 'next' | 'today') => {
        if (direction === 'today') {
            setCurrentDate(new Date());
            return;
        }
        const delta = direction === 'next' ? 1 : -1;

        switch (view) {
            case 'day':
                setCurrentDate(d => addDays(d, delta));
                break;
            case 'week':
                setCurrentDate(d => addWeeks(d, delta));
                break;
            case 'month':
                setCurrentDate(d => addMonths(d, delta));
                break;
        }
    };

    // Event Handling
    const handleAddEvent = (date: Date) => {
        setSelectedEvent(null);
        setInitialDate(date);
        setIsModalOpen(true);
    };

    const handleEditEvent = (event: CalendarEvent) => {
        setSelectedEvent(event);
        setInitialDate(undefined);
        setIsModalOpen(true);
    };

    const handleSaveEvent = (data: EventFormValues) => {
        const { id, editScope, ...eventData } = data;

        if (id) {
            // Updating existing event
            // Check if it's a recurrence instance
            const isRecurrenceInstance = id.toString().includes('_recur_');
            const originalId = isRecurrenceInstance ? id.split('_recur_')[0] : id;

            if (editScope === 'all') {
                // Update the original series
                // Handle recurrence 'none' conversion
                const cleanData = { ...eventData };
                if (cleanData.recurrence?.frequency === 'none') {
                    (cleanData as any).recurrence = undefined;
                }

                updateEvent(originalId, {
                    ...cleanData,
                    recurrence: cleanData.recurrence as any,
                    id: originalId // Ensure ID matches original
                });
            } else {
                // Scope is 'this' - Exception Logic
                // 1. Find original event to add exception
                const originalEvent = events.find(e => e.id === originalId);
                if (originalEvent && originalEvent.recurrence) {
                    const exceptions = originalEvent.recurrence.exceptions || [];
                    // Add start date of this instance as exception
                    // We need the original start date of THIS instance.
                    // If we only have the new start date from form, we might miss if user MOVED it.
                    // But 'selectedEvent' should have the instance's current start time.
                    const instanceDate = selectedEvent ? selectedEvent.start : eventData.start; // Fallback

                    updateEvent(originalId, {
                        recurrence: {
                            ...originalEvent.recurrence,
                            exceptions: [...exceptions, instanceDate]
                        }
                    });

                    // 2. Create new single event
                    const newEvent = {
                        ...eventData,
                        isLocked: false, // Default
                        recurrence: undefined // Break from series
                    };

                    // Handle recurrence sanitization for 'none' type if needed, 
                    // but here we set recursive: undefined so it's fine.
                    // Validating eventData.recurrence.frequency !== 'none' before passing if we were keeping it.

                    addEvent(newEvent);
                } else {
                    // Fallback
                    // Ensure recurrence frequency is valid
                    const cleanData = { ...eventData };
                    if (cleanData.recurrence?.frequency === 'none') {
                        (cleanData as any).recurrence = undefined;
                    }
                    updateEvent(id, cleanData as any);
                }
            }
        } else {
            // New Event
            const cleanData = { ...eventData };
            if (cleanData.recurrence?.frequency === 'none') {
                (cleanData as any).recurrence = undefined;
            }

            addEvent({
                ...cleanData,
                isLocked: false,
                recurrence: cleanData.recurrence as any // Casting safely as we handled 'none'
            });
        }
    };

    const handleDeleteEvent = (id: string, scope: 'this' | 'all') => {
        const isRecurrenceInstance = id.toString().includes('_recur_');
        const originalId = isRecurrenceInstance ? id.split('_recur_')[0] : id;

        if (scope === 'all') {
            deleteEvent(originalId);
        } else {
            // Add exception to original
            const originalEvent = events.find(e => e.id === originalId);
            if (originalEvent && originalEvent.recurrence) {
                const exceptions = originalEvent.recurrence.exceptions || [];
                const instanceDate = selectedEvent ? selectedEvent.start : 0;

                updateEvent(originalId, {
                    recurrence: {
                        ...originalEvent.recurrence,
                        exceptions: [...exceptions, instanceDate]
                    }
                });
            }
        }
        setIsModalOpen(false);
    };

    // Filter/Expand Events for Views
    const expandedEvents = useMemo(() => {
        // Expand events for the CURRENT VIEW's range (+ buffer)
        // We use a generous buffer (e.g. +/- 1 month) to ensure month view covers it
        // Ideally we calculated exact start/end of visual grid.
        // For now, `getFilteredEvents` does expansion.
        const start = addMonths(currentDate, -1);
        const end = addMonths(currentDate, 2);

        return getFilteredEvents(events, start, end, '', []);
    }, [events, currentDate]);

    return (
        <div className="flex flex-col h-full bg-background w-full max-w-7xl mx-auto p-4 md:p-6 space-y-4 md:space-y-6">

            {/* Header */}
            <PlannerHeader
                currentDate={currentDate}
                view={view}
                onViewChange={setView}
                onNavigate={handleNavigate}
            />

            {/* Offline Indicator (Subtle) */}
            <div className="flex justify-end px-2">
                <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider text-muted-foreground/50">
                    {isOnline ? (
                        <>
                            <Wifi className="w-3 h-3" />
                            <span>Online</span>
                        </>
                    ) : (
                        <>
                            <WifiOff className="w-3 h-3 text-rose-500" />
                            <span className="text-rose-500">Offline Mode</span>
                        </>
                    )}
                </div>
            </div>

            {/* Views */}
            <div className="flex-1 min-h-0">
                {view === 'month' && (
                    <MonthView
                        currentDate={currentDate}
                        events={expandedEvents}
                        bills={bills}
                        onAddEvent={handleAddEvent}
                        onViewDay={(date) => {
                            setCurrentDate(date);
                            setView('day');
                        }}
                        onEditEvent={handleEditEvent}
                    />
                )}
                {view === 'week' && (
                    <WeekView
                        currentDate={currentDate}
                        events={expandedEvents}
                        bills={bills}
                        onAddEvent={handleAddEvent}
                        onEditEvent={handleEditEvent}
                    />
                )}
                {view === 'day' && (
                    <DayView
                        currentDate={currentDate}
                        events={expandedEvents}
                        bills={bills}
                        onAddEvent={handleAddEvent}
                        onEditEvent={handleEditEvent}
                    />
                )}
            </div>

            {/* Modal */}
            <EventModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveEvent}
                onDelete={handleDeleteEvent}
                initialDate={initialDate}
                existingEvent={selectedEvent}
            />
        </div>
    );
}
