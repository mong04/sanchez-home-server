import { useState, useEffect, useCallback } from 'react';
import { infinityLog } from '../lib/yjs-provider';
import type { InfinityLogItem } from '../types/schema';
// Using crypto.randomUUID() for modern browser support
const generateId = () => crypto.randomUUID();

export function useInfinityLog() {
    const [items, setItems] = useState<InfinityLogItem[]>(infinityLog.toArray());

    useEffect(() => {
        // Subscribe to Yjs updates
        const handleChange = () => {
            setItems(infinityLog.toArray());
        };

        infinityLog.observe(handleChange);

        // Initial sync in case it changed before observe
        // setItems(infinityLog.toArray());

        return () => {
            infinityLog.unobserve(handleChange); // or just leave it, but good practice to cleanup if yjs supports it easily
            // Y.Array.observe returns void, so we pass the handler to unobserve
            infinityLog.unobserve(handleChange);
        };
    }, []);

    const addItem = useCallback((content: string, tags: string[] = []) => {
        const newItem: InfinityLogItem = {
            id: generateId(),
            content,
            tags,
            createdAt: Date.now(),
        };
        // Prepend or Append? Log usually appends.
        infinityLog.push([newItem]);
    }, []);

    const removeItem = useCallback((id: string) => {
        // Find index
        // Y.Array doesn't have findIndex directly?
        // We have to iterate or map content to index?
        // Yjs arrays are standard arrays in toArray(), but to modifying we need index.

        // Performance note: Y.Array search for index is O(N).
        // For now, simpler: iterate through items to find index
        let index = -1;
        // We can iterate the y-array directly as it implements Iterable, but easiest is toArray matching.
        // However, if concurrent edits happen, index might shift.
        // Ideally we'd use Y.Map for ID based lookup if we delete by ID often.
        // But PRD said "Log" which implies ordered list.

        // For small lists, this is fine.
        const currentItems = infinityLog.toArray();
        index = currentItems.findIndex(item => item.id === id);

        if (index !== -1) {
            infinityLog.delete(index, 1);
        }
    }, []);

    return {
        items,
        addItem,
        removeItem,
    };
}
