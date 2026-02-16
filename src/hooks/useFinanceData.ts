import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pb } from '../lib/pocketbase';
import { Collections, type EnvelopeRecord, type TransactionRecord } from '../types/pocketbase';

/**
 * Fetches all envelopes, sorted by name.
 */
export function useEnvelopes() {
    return useQuery({
        queryKey: [Collections.Envelopes],
        queryFn: async () => {
            // Create a plain object for parameters to ensure correct serialization if necessary,
            // though PocketBase SDK handles plain objects fine.
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
        onError: (_err, newTransaction, context) => {
            if (context?.previousTransactions && newTransaction.envelope) {
                queryClient.setQueryData([Collections.Transactions, newTransaction.envelope], context.previousTransactions);
            }
        },
        onSuccess: (_data, variables) => {
            if (variables.envelope) {
                queryClient.invalidateQueries({ queryKey: [Collections.Transactions, variables.envelope] });
                queryClient.invalidateQueries({ queryKey: [Collections.Envelopes] });
            }
        },
    });
}
/**
 * Mutation to add a new envelope.
 */
export function useCreateEnvelope() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (newEnvelope: Partial<EnvelopeRecord>) => {
            return await pb.collection(Collections.Envelopes).create<EnvelopeRecord>(newEnvelope);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [Collections.Envelopes] });
        },
    });
}
