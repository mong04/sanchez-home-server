import { QueryClient } from '@tanstack/react-query';
import type { PersistedClient, Persister } from '@tanstack/react-query-persist-client';
import { get, set, del } from 'idb-keyval';

// Configure the QueryClient with default stale/cache times
export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
            gcTime: 1000 * 60 * 60 * 24, // 24 hours
            retry: 1,
            networkMode: 'offlineFirst', // Critical for offline-first
        },
        mutations: {
            networkMode: 'offlineFirst',
        },
    },
});

/**
 * Custom Persister using idb-keyval for robust offline storage.
 * This saves the entire query cache to IndexedDB.
 */
export const idbPersister: Persister = {
    persistClient: async (client: PersistedClient) => {
        try {
            await set('REACT_QUERY_OFFLINE_CACHE', client);
        } catch (error) {
            console.error('Failed to persist query client:', error);
        }
    },
    restoreClient: async () => {
        try {
            return await get<PersistedClient>('REACT_QUERY_OFFLINE_CACHE');
        } catch (error) {
            console.error('Failed to restore query client:', error);
            return undefined;
        }
    },
    removeClient: async () => {
        try {
            await del('REACT_QUERY_OFFLINE_CACHE');
        } catch (error) {
            console.error('Failed to remove query client:', error);
        }
    },
};
