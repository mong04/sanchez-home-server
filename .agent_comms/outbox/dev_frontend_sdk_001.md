# Frontend SDK Implementation

Start Date: 2026-02-12
Status: COMPLETE

## Files Created

### 1. `src/lib/pocketbase.ts`
Initializes the PocketBase client.

```typescript
import PocketBase from 'pocketbase';

// Use the environment variable for the PocketBase URL, defaulting to local dev
const pbUrl = import.meta.env.VITE_POCKETBASE_URL || 'http://127.0.0.1:8090';

// Initialize the PocketBase client as a singleton
export const pb = new PocketBase(pbUrl);

// Auto-cancellation is enabled by default
pb.autoCancellation(true);
```

### 2. `src/lib/query-client.ts`
Configures the TanStack Query client with offline persistence using `idb-keyval`.

```typescript
import { QueryClient } from '@tanstack/react-query';
import { PersistedClient, Persister } from '@tanstack/react-query-persist-client';
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
```

### 3. `src/hooks/useFinanceData.ts`
Hooks for fetching Envelopes and Transactions, plus an optimistic mutation for adding transactions.

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pb } from '../lib/pocketbase';
import { Collections, EnvelopeRecord, TransactionRecord } from '../types/pocketbase';

/**
 * Fetches all envelopes, sorted by name.
 */
export function useEnvelopes() {
  return useQuery({
    queryKey: [Collections.Envelopes],
    queryFn: async () => {
      return await pb.collection(Collections.Envelopes).getFullList<EnvelopeRecord>({
        sort: 'name',
      });
    },
  });
}

/**
 * Fetches transactions for a specific envelope.
 * @param envelopeId The ID of the envelope to fetch transactions for.
 */
export function useTransactions(envelopeId: string) {
  return useQuery({
    queryKey: [Collections.Transactions, envelopeId],
    queryFn: async () => {
      if (!envelopeId) return [];
      
      return await pb.collection(Collections.Transactions).getFullList<TransactionRecord>({
        filter: `envelope = "${envelopeId}"`,
        sort: '-date', // Newest first
        expand: 'account,envelope', // Expand relations for UI
      });
    },
    enabled: !!envelopeId, 
  });
}

/**
 * Mutation to add a new transaction.
 * Includes Optimistic Updates.
 */
export function useAddTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newTransaction: Partial<TransactionRecord>) => {
      return await pb.collection(Collections.Transactions).create<TransactionRecord>(newTransaction);
    },
    onMutate: async (newTransaction) => {
      await queryClient.cancelQueries({ queryKey: [Collections.Transactions, newTransaction.envelope] });

      const previousTransactions = queryClient.getQueryData([Collections.Transactions, newTransaction.envelope]);

      if (newTransaction.envelope) {
        queryClient.setQueryData([Collections.Transactions, newTransaction.envelope], (old: TransactionRecord[] | undefined) => {
          const optimisticTx = {
            ...newTransaction,
            id: 'optimistic-' + Math.random(),
            created: new Date().toISOString(),
            updated: new Date().toISOString(),
          } as TransactionRecord; 
          
          return old ? [optimisticTx, ...old] : [optimisticTx];
        });
      }

      return { previousTransactions };
    },
    onError: (err, newTransaction, context) => {
      if (context?.previousTransactions && newTransaction.envelope) {
        queryClient.setQueryData([Collections.Transactions, newTransaction.envelope], context.previousTransactions);
      }
    },
    onSuccess: (data, variables) => {
      if (variables.envelope) {
        queryClient.invalidateQueries({ queryKey: [Collections.Transactions, variables.envelope] });
        queryClient.invalidateQueries({ queryKey: [Collections.Envelopes] });
      }
    },
  });
}
```
