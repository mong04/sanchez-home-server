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

interface YjsCacheEntry {
    doc: Y.Doc;
    provider: YPartyKitProvider;
    refCount: number;
}

const providerCache = new Map<string, YjsCacheEntry>();
const cleanupTimers = new Map<string, ReturnType<typeof setTimeout>>();

export function useBudgetYjs(month: string): UseBudgetYjsReturn {
    const { token } = useAuth();
    const [isConnected, setIsConnected] = useState(false);
    const [peerCount, setPeerCount] = useState(0);
    const [, forceUpdate] = useState(0);

    // Get or create cached provider singleton per connection combination
    const { doc, provider } = useMemo(() => {
        const cacheKey = `${month}-${token || 'anon'}`;
        let entry = providerCache.get(cacheKey);

        if (!entry) {
            const newDoc = new Y.Doc();
            const newProvider = new YPartyKitProvider(
                SYNC_CONFIG.PARTYKIT_HOST,
                `budget-${month}`,
                newDoc,
                {
                    connect: false,
                    params: { token: token || '' }
                }
            );
            entry = { doc: newDoc, provider: newProvider, refCount: 0 };
            providerCache.set(cacheKey, entry);
        }

        return entry;
    }, [month, token]);

    const allocations = useMemo(() => doc.getMap<number>("allocations"), [doc]);

    // Reference Context Lifecycle Tracking to prevent multi-socket React mount tearing
    useEffect(() => {
        const cacheKey = `${month}-${token || 'anon'}`;
        const entry = providerCache.get(cacheKey);
        if (!entry) return;

        entry.refCount += 1;

        if (cleanupTimers.has(cacheKey)) {
            clearTimeout(cleanupTimers.get(cacheKey)!);
            cleanupTimers.delete(cacheKey);
        }

        if (entry.refCount === 1 && token) {
            entry.provider.connect();
        }

        return () => {
            const currentEntry = providerCache.get(cacheKey);
            if (currentEntry) {
                currentEntry.refCount -= 1;

                if (currentEntry.refCount <= 0) {
                    const timer = setTimeout(() => {
                        currentEntry.provider.disconnect();
                        currentEntry.provider.destroy();
                        providerCache.delete(cacheKey);
                        cleanupTimers.delete(cacheKey);
                    }, 2500); // Wait out ghost StrictMode reconnects
                    cleanupTimers.set(cacheKey, timer);
                }
            }
        };
    }, [month, token]);

    // Track connection status
    useEffect(() => {
        const handleStatus = (event: { status: string }) => {
            setIsConnected(event.status === 'connected');
        };

        setIsConnected((provider as any).wsconnected || false);

        provider.on('status', handleStatus);
        return () => {
            provider.off('status', handleStatus);
        };
    }, [provider]);

    // Track peer count via awareness
    useEffect(() => {
        const awareness = provider.awareness;
        if (!awareness) return;

        let timer: ReturnType<typeof setTimeout>;
        const handleChange = () => {
            // Because duplicate tabs share 1 connection via cache, this purely represents cross-device peers
            const count = Math.max(0, awareness.getStates().size - 1);
            clearTimeout(timer);
            timer = setTimeout(() => {
                setPeerCount(count);
            }, 600);
        };

        handleChange();

        awareness.on('change', handleChange);
        return () => {
            clearTimeout(timer);
            awareness.off('change', handleChange);
        };
    }, [provider]);

    // Observe map changes to trigger re-renders
    useEffect(() => {
        const observer = () => forceUpdate(n => n + 1);
        allocations.observe(observer);
        return () => allocations.unobserve(observer);
    }, [allocations]);

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
