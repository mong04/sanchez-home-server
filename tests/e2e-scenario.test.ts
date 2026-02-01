import { describe, it, expect, beforeEach } from 'vitest';
import { calendar, chores, messages, wellness } from '../src/lib/yjs-provider';
import { v4 as uuidv4 } from 'uuid';

/**
 * "Day in the Life" Scenario Test
 * 
 * Simulates:
 * 1. User A adds a Calendar Event (Morning)
 * 2. User A adds a Grocery Item (or Chore)
 * 3. User B sends a Message
 * 4. Verifies all states update and exist in the shared store.
 */
describe('E2E Scenario: Day in the Life', () => {
    beforeEach(() => {
        // Clear all stores to start fresh
        calendar.delete(0, calendar.length);
        chores.delete(0, chores.length);
        messages.delete(0, messages.length);
        wellness.delete(0, wellness.length);
    });

    it('successfully updates all modules in a sequence of user actions', () => {
        // 1. User A adds a Calendar Event
        const eventId = uuidv4();
        calendar.push([{
            id: eventId,
            title: 'Soccer Practice',
            start: Date.now() + 3600000,
            end: Date.now() + 7200000,
            isLocked: false,
            type: 'family'
        }]);

        expect(calendar.length).toBe(1);
        expect(calendar.get(0).title).toBe('Soccer Practice');

        // 2. User A adds a Chore (simulating Grocery Item as Chore for now if grocery module doesn't exist yet, 
        // or just Chore as per Phase 3 definition)
        const choreId = uuidv4();
        chores.push([{
            id: choreId,
            title: 'Buy Milk',
            assignee: 'User A',
            status: 'pending',
            dueAt: Date.now()
        }]);

        expect(chores.length).toBe(1);
        expect(chores.get(0).title).toBe('Buy Milk');

        // 3. User B sends a Message
        const msgId = uuidv4();
        messages.push([{
            id: msgId,
            sender: 'User B',
            text: 'I added soccer practice!',
            timestamp: Date.now(),
            expiresAt: Date.now() + 86400000
        }]);

        expect(messages.length).toBe(1);
        expect(messages.get(0).sender).toBe('User B');
        expect(messages.get(0).text).toBe('I added soccer practice!');

        // 4. Verification of cross-module data state
        // (In a real app, logic might link these, but here we verify existence)
        console.log('Scenario Verified: Calendar, Chores, and Messages populated.');
    });
});
