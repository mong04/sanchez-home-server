import { render, screen, waitFor } from '@testing-library/react';
import { CommandCenter } from '../../src/components/modules/CommandCenter';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as Y from 'yjs';

// Define the mock using vi.hoisted to ensure variables are accessible in mock factory
const { testDoc, testChores, testBills, testInfinityLog, testCalendar, testWellness, testMessages } = vi.hoisted(() => {
    // We need to require yjs inside if we want to use Y types, 
    // OR we can just return standard JS objects if the provider export expects that.
    // However, Yjs library is needed for the Y.Array methods.
    // Vitest hoisting runs before imports.
    // We can rely on 'yjs' being installed.
    const Y = require('yjs');
    const doc = new Y.Doc();
    return {
        testDoc: doc,
        testChores: doc.getArray('chores'),
        testBills: doc.getArray('bills'),
        testInfinityLog: doc.getArray('infinityLog'),
        testCalendar: doc.getArray('calendar'),
        testWellness: doc.getArray('wellness'),
        testMessages: doc.getArray('messages'),
    };
});

// Mock the provider
vi.mock('../../src/lib/yjs-provider', () => ({
    chores: testChores,
    bills: testBills,
    infinityLog: testInfinityLog,
    calendar: testCalendar,
    wellness: testWellness,
    messages: testMessages,
    persistence: null,
    provider: { on: vi.fn(), off: vi.fn() }
}));

describe('CommandCenter Integration', () => {
    beforeEach(() => {
        // Clear stores
        testDoc.transact(() => {
            testChores.delete(0, testChores.length);
            testBills.delete(0, testBills.length);
            testInfinityLog.delete(0, testInfinityLog.length);
            testCalendar.delete(0, testCalendar.length);
            testMessages.delete(0, testMessages.length);
        });
    });

    it('renders and displays active chores and upcoming bills', async () => {
        // Seed data
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);

        testDoc.transact(() => {
            testChores.push([{
                id: 'chore-1',
                title: 'Wash the Spaceship',
                assignees: ['dad-uuid'],
                currentTurnIndex: 0,
                frequency: 'daily',
                points: 50,
                lastCompleted: 0
            }]);

            testBills.push([{
                id: 'bill-1',
                name: 'Hyperdrive Fuel',
                amount: 150,
                dueDate: tomorrow.getTime(),
                isPaid: false,
                category: 'Utility'
            }]);
        });

        render(<CommandCenter />);

        // Check for Chore
        expect(screen.getByText('Today\'s Mission')).toBeInTheDocument();
        expect(screen.getByText('Wash the Spaceship')).toBeInTheDocument();
        expect(screen.getByText('+50 pts')).toBeInTheDocument();

        // Check for Bill
        expect(screen.getByText('Financial Forecast')).toBeInTheDocument();
        expect(screen.getByText('Hyperdrive Fuel')).toBeInTheDocument();
        expect(screen.getByText('$150')).toBeInTheDocument();
    });

    it('displays the leaderboard correctly', () => {
        // Seed logs
        testDoc.transact(() => {
            testInfinityLog.push([
                {
                    id: 'log-1',
                    content: 'Done',
                    tags: ['chore-complete', 'user:dad-uuid', 'points:100'],
                    createdAt: Date.now()
                },
                {
                    id: 'log-2',
                    content: 'Done',
                    tags: ['chore-complete', 'user:mom-uuid', 'points:200'],
                    createdAt: Date.now()
                }
            ]);
        });

        render(<CommandCenter />);

        // Wait for sorting? It's synchronous in hook default state
        expect(screen.getByText('Family Scoreboard')).toBeInTheDocument();
        // Check scores
        expect(screen.getByText('200 pts')).toBeInTheDocument();
        expect(screen.getByText('100 pts')).toBeInTheDocument();

        // Mom should be first (rank 1)
    });
});
