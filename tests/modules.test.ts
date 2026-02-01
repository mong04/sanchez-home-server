import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCalendar } from '../src/hooks/use-calendar';
import { useWellness } from '../src/hooks/use-wellness';

import { doc, calendar, wellness } from '../src/lib/yjs-provider';

// Mock YJS persistence to avoid IndexedDB issues in non-browser env if needed, 
// but jsdom should handle it or we relying on in-memory doc for unit tests.
// The provider initializes persistence, but for unit tests we might want to clear the doc.

describe('Module Hooks', () => {
    beforeEach(() => {
        // Clear Yjs arrays between tests
        doc.transact(() => {
            calendar.delete(0, calendar.length);
            wellness.delete(0, wellness.length);
        });
    });

    describe('useCalendar', () => {
        it('should add an event', () => {
            const { result } = renderHook(() => useCalendar());

            act(() => {
                result.current.addEvent({
                    title: 'Test Event',
                    start: 1000,
                    end: 2000,
                    isLocked: false,
                    type: 'appointment'
                });
            });

            expect(result.current.events).toHaveLength(1);
            expect(result.current.events[0].title).toBe('Test Event');
        });

        it('should lock an event', () => {
            const { result } = renderHook(() => useCalendar());

            act(() => {
                result.current.addEvent({
                    title: 'Test Event',
                    start: 1000,
                    end: 2000,
                    isLocked: false,
                    type: 'reminder'
                });
            });

            const eventId = result.current.events[0].id;

            act(() => {
                result.current.lockEvent(eventId);
            });

            expect(result.current.events[0].isLocked).toBe(true);
        });
    });

    describe('useWellness', () => {
        it('should log a meal', () => {
            const { result } = renderHook(() => useWellness());

            act(() => {
                result.current.logEntry({
                    type: 'meal',
                    value: 'Steak',
                    tags: ['carnivore']
                });
            });

            expect(result.current.entries).toHaveLength(1);
            expect(result.current.entries[0].value).toBe('Steak');
            expect(result.current.entries[0].type).toBe('meal');
        });
    });
});
