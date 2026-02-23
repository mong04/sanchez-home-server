// src/hooks/useBudgetYjs.ts — Real-time collaborative budget editing via Yjs + PartyKit

import { useMemo, useEffect, useState, useCallback } from "react";
import * as Y from "yjs";
import YPartyKitProvider from "y-partykit/provider";
import { SYNC_CONFIG } from "../config/sync";
import { useAuth } from "../context/AuthContext";

interface UseBudgetYjsReturn {
    /** Live Yjs map of allocations: categoryId → budgeted amount */
    allocations: Y.Map<number>;
    /** Set a single allocation */
    setAllocation: (categoryId: string, amount: number) => void;
    /** Get all allocations as a plain object */
    getAllocations: () => Record<string, number>;
    /** Connection status */
    isConnected: boolean;
    /** Number of connected peers */
    peerCount: number;
}

export function useBudgetYjs(month: string): UseBudgetYjsReturn {
    const { token } = useAuth();
    const [isConnected, setIsConnected] = useState(false);
    const [peerCount, setPeerCount] = useState(0);
    const [, forceUpdate] = useState(0);

    // Create a new Yjs doc per month
    const doc = useMemo(() => new Y.Doc(), [month]);

    // Create WebSocket provider per month
    const provider = useMemo(() => {
        const p = new YPartyKitProvider(
            SYNC_CONFIG.PARTYKIT_HOST,
            `budget-${month}`,
            doc,
            {
                connect: false,
                params: { token: token || '' }
            }
        );
        if (token) {
            p.connect();
        }
        return p;
    }, [month, doc, token]);

    const allocations = useMemo(() => doc.getMap<number>("allocations"), [doc]);

    // Track connection status
    useEffect(() => {
        const handleStatus = (event: { status: string }) => {
            setIsConnected(event.status === 'connected');
        };

        provider.on('status', handleStatus);
        return () => {
            provider.off('status', handleStatus);
        };
    }, [provider]);

    // Track peer count via awareness
    useEffect(() => {
        const awareness = provider.awareness;
        if (!awareness) return;

        const handleChange = () => {
            // Debounce peer count updates to avoid UI flickering
            const count = awareness.getStates().size - 1;
            setTimeout(() => {
                setPeerCount(count);
            }, 1000);
        };

        awareness.on('change', handleChange);
        return () => {
            awareness.off('change', handleChange);
        };
    }, [provider]);

    // Observe map changes to trigger re-renders
    useEffect(() => {
        const observer = () => forceUpdate(n => n + 1);
        allocations.observe(observer);
        return () => allocations.unobserve(observer);
    }, [allocations]);

    // Clean up provider on unmount or month change
    useEffect(() => {
        return () => {
            provider.disconnect();
            provider.destroy();
        };
    }, [provider]);

    const setAllocation = useCallback(
        (categoryId: string, amount: number) => {
            allocations.set(categoryId, amount);
        },
        [allocations]
    );

    const getAllocations = useCallback((): Record<string, number> => {
        const result: Record<string, number> = {};
        allocations.forEach((value, key) => {
            result[key] = value;
        });
        return result;
    }, [allocations]);

    return {
        allocations,
        setAllocation,
        getAllocations,
        isConnected,
        peerCount,
    };
}
