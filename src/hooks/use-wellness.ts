import { useState, useEffect, useCallback } from 'react';
import { wellness } from '../lib/yjs-provider';
import type { WellnessEntry } from '../types/schema';
import { v4 as uuidv4 } from 'uuid';

export function useWellness() {
    const [entries, setEntries] = useState<WellnessEntry[]>(wellness.toArray());

    useEffect(() => {
        const handleChange = () => {
            setEntries(wellness.toArray());
        };

        wellness.observe(handleChange);
        return () => wellness.unobserve(handleChange);
    }, []);

    const logEntry = useCallback((entry: Omit<WellnessEntry, 'id' | 'timestamp'>) => {
        const newEntry: WellnessEntry = {
            ...entry,
            id: uuidv4(),
            timestamp: Date.now(),
        };
        wellness.push([newEntry]);
    }, []);

    const getEntriesByType = useCallback((type: WellnessEntry['type']) => {
        return entries.filter((e) => e.type === type).sort((a, b) => b.timestamp - a.timestamp);
    }, [entries]);

    return {
        entries,
        logEntry,
        getEntriesByType
    };
}
