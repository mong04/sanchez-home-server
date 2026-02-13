
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useGamification } from '../src/hooks/use-gamification';
import { users, doc } from '../src/lib/yjs-provider';
import { renderHook, act, waitFor } from '@testing-library/react';

describe('Gamification Logic', () => {
    const userId = 'test-user-1';

    beforeEach(() => {
        // Clear users map
        doc.transact(() => {
            users.clear();
        });
    });

    it('initializes a new user correctly', async () => {
        const { result } = renderHook(() => useGamification(userId));

        // Setup initial user state in store
        const initialUser = {
            id: userId,
            name: 'Test',
            role: 'kid' as const,
            xp: 0,
            level: 1,
            streaks: { current: 0, max: 0, lastActivityDate: 0 },
            badges: [],
            activityLog: {}
        };

        act(() => {
            users.set(userId, initialUser);
        });

        await waitFor(() => {
            expect(result.current.user).toEqual(initialUser);
        });
    });

    it('awards XP and updates level', async () => {
        // Setup user
        const initialUser = {
            id: userId,
            name: 'Test',
            role: 'kid' as const,
            xp: 0,
            level: 1,
            streaks: { current: 0, max: 0, lastActivityDate: 0 },
            badges: [],
            activityLog: {}
        };
        users.set(userId, initialUser);

        const { result } = renderHook(() => useGamification(userId));

        await waitFor(() => {
            expect(result.current.user).not.toBeNull();
        });

        // Award 150 XP (Level 1 is 0-100, Level 2 is 100-300)
        act(() => {
            result.current.awardXP(150, 'Test Award');
        });

        await waitFor(() => {
            const updatedUser = users.get(userId);
            expect(updatedUser?.xp).toBe(150);
            expect(updatedUser?.level).toBe(2);
        });
    });

    it('updates streak correctly', async () => {
        // Mock date
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const initialUser = {
            id: userId,
            name: 'Test',
            role: 'kid' as const,
            xp: 0,
            level: 1,
            streaks: {
                current: 5,
                max: 10,
                lastActivityDate: yesterday.getTime()
            },
            badges: [],
            activityLog: {}
        };
        users.set(userId, initialUser);

        const { result } = renderHook(() => useGamification(userId));

        await waitFor(() => {
            expect(result.current.user).not.toBeNull();
        });

        act(() => {
            result.current.checkStreak();
        });

        await waitFor(() => {
            const updatedUser = users.get(userId);
            expect(updatedUser?.streaks.current).toBe(6);
            expect(updatedUser?.streaks.lastActivityDate).toBeGreaterThan(yesterday.getTime());
        });
    });

    it('resets streak if day missed', async () => {
        // Mock date
        const today = new Date();
        const twoDaysAgo = new Date(today);
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

        const initialUser = {
            id: userId,
            name: 'Test',
            role: 'kid' as const,
            xp: 0,
            level: 1,
            streaks: {
                current: 5,
                max: 10,
                lastActivityDate: twoDaysAgo.getTime()
            },
            badges: [],
            activityLog: {}
        };
        users.set(userId, initialUser);

        const { result } = renderHook(() => useGamification(userId));

        await waitFor(() => {
            expect(result.current.user).not.toBeNull();
        });

        act(() => {
            result.current.checkStreak();
        });

        await waitFor(() => {
            const updatedUser = users.get(userId);
            // We expect 1 because visiting the app (checkStreak) starts the new streak
            expect(updatedUser?.streaks.current).toBe(1);
        });
    });
});
