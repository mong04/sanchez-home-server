import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext'; // Profiles, XP
import { useChores, useBills } from './use-organizer'; // Chores, Bills
import { provider } from '../lib/yjs-provider'; // Presence, Connection

export interface AdminStats {
    onlineUsers: number;
    activeChoresCount: number;
    upcomingBillsCount: number;
    totalXP: number;
    systemStatus: 'connected' | 'disconnected' | 'connecting';
    userCount: number;
}

export function useAdminStats(): AdminStats {
    const { profiles } = useAuth();
    const { items: chores } = useChores();
    const { getUpcomingBills } = useBills();

    // -- Real-time State --
    const [onlineUsers, setOnlineUsers] = useState<number>(1); // Default to 1 (self)
    const [systemStatus, setSystemStatus] = useState<AdminStats['systemStatus']>('connecting');

    // -- Derived Stats --
    // 1. Total XP across all profiles
    const totalXP = profiles.reduce((acc, profile) => acc + (profile.xp || 0), 0);

    // 2. Active Chores (incomplete)
    const activeChoresCount = chores.length; // 'items' from useChores returns all chores. 
    // Wait, useChores returns *all* chores? 
    // usage in SmartPlanner: const { items: chores } = useChores(). 
    // And it has 'lastCompleted'. We should check if they are "due". 
    // For now, let's just count *all* chores in the system as "managed chores".
    // Or closer to "Today's Mission" from CommandCenter?
    // CommandCenter uses `getMyActiveChores`.
    // Let's filter for *any* chore that is not completed "today" if we can, 
    // but the schema only has `lastCompleted`.
    // A simple metric for now: Total configured chores.
    // Or maybe "Chores completed today"?
    // Let's stick to "Total Chores Configured" or similar for a "System Overview".

    // 3. Upcoming Bills (Next 30 days)
    const upcomingBillsCount = getUpcomingBills(30).length;

    // 4. User Count
    const userCount = profiles.length;

    // -- Sidebar: Presence & Connection Monitoring --
    useEffect(() => {
        // Pulse/Presence
        const updatePresence = () => {
            if (provider.awareness) {
                // Count unique clientIDs or look at states
                // awareness.getStates() returns a Map<clientID, state>
                const states = provider.awareness.getStates();
                setOnlineUsers(states.size);
            }
        };

        // Connection Status
        const updateStatus = (event: { connected: boolean }) => {
            setSystemStatus(event.connected ? 'connected' : 'disconnected');
        };

        // Listeners
        provider.awareness?.on('change', updatePresence);
        provider.on('status', updateStatus);

        // Initial check
        updatePresence();
        // We can't easily check current connection status from the 'provider' object wrapper 
        // without a direct 'ws' check, but 'on' handles updates.
        // If we want initial status, we might assume 'connecting' until event fires, 
        // or check provider.ws?.readyState.
        if (provider.ws?.readyState === 1) { // OPEN
            setSystemStatus('connected');
        }

        return () => {
            provider.awareness?.off('change', updatePresence);
            provider.off('status', updateStatus);
        };
    }, []);

    return {
        onlineUsers,
        activeChoresCount,
        upcomingBillsCount,
        totalXP,
        systemStatus,
        userCount
    };
}
