import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext'; // Profiles, XP
import { useChores, useBills } from './use-organizer'; // Chores, Bills
import { getProvider } from '../lib/yjs-provider'; // Presence, Connection

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
    const activeChoresCount = chores.length;

    // 3. Upcoming Bills (Next 30 days)
    const upcomingBillsCount = getUpcomingBills(30).length;

    // 4. User Count
    const userCount = profiles.length;

    // -- Sidebar: Presence & Connection Monitoring --
    useEffect(() => {
        // Pulse/Presence
        const updatePresence = () => {
            const provider = getProvider();
            if (provider?.awareness) {
                const states = provider.awareness.getStates();
                setOnlineUsers(states.size);
            }
        };

        // Connection Status
        const updateStatus = (event: { connected: boolean }) => {
            setSystemStatus(event.connected ? 'connected' : 'disconnected');
        };

        // Listeners
        const provider = getProvider();
        provider?.awareness?.on('change', updatePresence);
        provider?.on('status', updateStatus);

        // Initial check
        updatePresence();
        if (provider?.ws?.readyState === 1) { // OPEN
            setSystemStatus('connected');
        }

        return () => {
            const currentProvider = getProvider();
            currentProvider?.awareness?.off('change', updatePresence);
            currentProvider?.off('status', updateStatus);
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
