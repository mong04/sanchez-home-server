
import { useCallback, useEffect, useState } from 'react';
import { users, doc } from '../lib/yjs-provider';
import { useAuth } from '../context/AuthContext';
import type { User } from '../types/schema';

// Configuration
const LEVELS = [0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500, 5500]; // Cumulative XP for validation

export function useGamification(userId: string | undefined, initialUser?: Partial<User>) {
    const [user, setUser] = useState<User | null>(null);

    // Sync local state with Yjs
    useEffect(() => {
        if (!userId) {
            setUser(null);
            return;
        }

        const updateState = () => {
            const userData = users.get(userId);
            if (userData) {
                setUser(userData);
            } else if (initialUser && initialUser.id === userId) {
                // Initialize if missing AND we have initial data matching the ID
                console.log(`[Gamification] Initializing profile for ${userId}`);
                const newUser: User = {
                    id: userId,
                    name: initialUser.name || 'New User',
                    role: initialUser.role || 'kid',
                    xp: 0,
                    level: 1,
                    badges: [],
                    activityLog: {},
                    ...initialUser, // Override with any other props
                    // Ensure deep merge safety for critical gamification fields
                    streaks: { current: 0, max: 0, lastActivityDate: 0 },
                };

                // Set in Yjs
                doc.transact(() => {
                    users.set(userId, newUser);
                });
                setUser(newUser);
            } else {
                setUser(null);
            }
        };

        updateState();
        users.observe(updateState);

        return () => {
            users.unobserve(updateState);
        };
    }, [userId, initialUser]); // Re-run if initialUser becomes available

    const awardXP = useCallback((amount: number, reason: string) => {
        console.log(`[Gamification] Awarding ${amount} XP to ${userId} for: ${reason}`);
        if (!userId) return;

        doc.transact(() => {
            const userData = users.get(userId);
            if (!userData) return;

            const newXP = (userData.xp || 0) + amount;
            let newLevel = userData.level || 1;

            // Simple level calc: Level N requires N*100 XP roughly? 
            // Using a simple formula for now or the array
            // Find highest level where XP >= threshold
            const calculatedLevel = LEVELS.findIndex(limit => newXP < limit);
            // If newXP is huge, findIndex returns -1, implying max level or beyond array
            if (calculatedLevel === -1) {
                newLevel = LEVELS.length;
            } else {
                newLevel = calculatedLevel || 1;
            }

            // Update activity log
            const today = new Date().toISOString().split('T')[0];
            const newActivityLog = { ...(userData.activityLog || {}) };
            newActivityLog[today] = (newActivityLog[today] || 0) + 1;

            // Updated User object
            const updatedUser: User = {
                ...userData,
                xp: newXP,
                level: newLevel,
                activityLog: newActivityLog,
                // Ensure other fields exist
                badges: userData.badges || [],
                streaks: userData.streaks || { current: 0, max: 0, lastActivityDate: 0 }
            };

            users.set(userId, updatedUser);
        });
    }, [userId]);

    const checkStreak = useCallback(() => {
        if (!userId) return;
        const userData = users.get(userId);
        if (!userData) return;

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const lastActivity = userData.streaks?.lastActivityDate || 0;

        // 86400000 ms in a day
        const diff = today - lastActivity;
        const oneDay = 86400000;

        let newStreak = userData.streaks?.current || 0;
        let maxStreak = userData.streaks?.max || 0;

        let needsUpdate = false;

        if (diff === 0) {
            // Already active today
        } else if (diff <= oneDay + 3600000) { // Roughly <= 25 hours (yesterday)
            newStreak += 1;
            if (newStreak > maxStreak) maxStreak = newStreak;
            needsUpdate = true;
        } else {
            // Missed a day (or more), reset
            if (newStreak > 0) {
                newStreak = 1; // Start new streak today
                needsUpdate = true;
                // If we want to strictly punish and require an "action" to start, we'd keep 0?
                // But checkStreak updates the date, so today IS accounted for. 
                // If we leave it at 0, tomorrow it will be 1 (diff=1 day).
                // It makes sense to be 1 today.
            } else if (newStreak === 0) {
                newStreak = 1;
                needsUpdate = true;
            }
        }

        if (needsUpdate || diff > 0) { // Always update lastActivityDate if active today
            users.set(userId, {
                ...userData,
                streaks: {
                    current: newStreak,
                    max: maxStreak,
                    lastActivityDate: today
                }
            });
        }
    }, [userId]);

    const { updateProfile } = useAuth();

    const updateAvatar = useCallback((type: 'preset' | 'upload', value: string) => {
        if (!userId) return;
        const userData = users.get(userId);
        if (!userData) return;

        const now = Date.now();
        const lastUpdate = userData.lastAvatarUpdate || 0;
        const oneDay = 86400000;

        const newAvatar = { type, value };

        // 1. Update Yjs (Immediate local/p2p sync)
        users.set(userId, {
            ...userData,
            avatar: newAvatar,
            lastAvatarUpdate: now // Track update time
        });

        // Award XP only if > 24 hours since last update
        if (now - lastUpdate > oneDay) {
            awardXP(10, 'Updated Avatar');
        } else {
            console.log('[Gamification] XP skipped for avatar update (limit: once per 24h)');
        }

        // 2. Persist to Backend (for Auth/Login consistency)
        // We calculate this asynchronously and don't block UI
        updateProfile(userId, {
            avatar: newAvatar,
            lastAvatarUpdate: now
        }).catch(err => {
            console.error("[Gamification] Failed to sync avatar to backend:", err);
        });

    }, [userId, updateProfile, awardXP]);

    const setVibe = useCallback((vibe: string) => {
        if (!userId) return;
        const userData = users.get(userId);
        if (!userData) return;

        users.set(userId, { ...userData, vibe });
    }, [userId]);

    return {
        user,
        awardXP,
        checkStreak,
        updateAvatar,
        setVibe,
        LEVELS
    };
}
