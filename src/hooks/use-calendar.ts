import { useState, useEffect, useCallback } from 'react';
import { calendar } from '../lib/yjs-provider';
import type { CalendarEvent } from '../types/schema';
import { v4 as uuidv4 } from 'uuid';

export function useCalendar() {
    const [events, setEvents] = useState<CalendarEvent[]>(calendar.toArray());

    useEffect(() => {
        const handleChange = () => {
            setEvents(calendar.toArray());
        };

        calendar.observe(handleChange);
        return () => calendar.unobserve(handleChange);
    }, []);

    const addEvent = useCallback((event: Omit<CalendarEvent, 'id'>) => {
        const newEvent: CalendarEvent = {
            ...event,
            id: uuidv4(),
        };
        calendar.push([newEvent]);
    }, []);

    const updateEvent = useCallback((id: string, updates: Partial<CalendarEvent>) => {
        const index = calendar.toArray().findIndex((e) => e.id === id);
        if (index !== -1) {
            // Y.Array doesn't support partial updates easily without replacing or using Y.Map.
            // For simplicity in this array structure, we delete and re-insert or use delete/insert.
            // A better schema might be a Y.Map of events, but we defined it as an Array.
            // Let's replace the item.

            // Transaction to ensure atomicity
            calendar.doc?.transact(() => {
                const current = calendar.get(index);
                const updated = { ...current, ...updates };
                calendar.delete(index, 1);
                calendar.insert(index, [updated]);
            });
        }
    }, []);

    const deleteEvent = useCallback((id: string) => {
        const index = calendar.toArray().findIndex((e) => e.id === id);
        if (index !== -1) {
            calendar.delete(index, 1);
        }
    }, []);

    const lockEvent = useCallback((id: string) => {
        updateEvent(id, { isLocked: true });
    }, [updateEvent]);

    return {
        events,
        addEvent,
        updateEvent,
        deleteEvent,
        lockEvent
    };
}
