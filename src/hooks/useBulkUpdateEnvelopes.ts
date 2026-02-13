import { useMutation, useQueryClient } from '@tanstack/react-query';
import { pb } from '../lib/pocketbase';
import { Collections, EnvelopeRecord } from '../types/pocketbase';

interface BulkUpdateEnvelopeParams {
    updates: { id: string; data: Partial<EnvelopeRecord> }[];
}

export function useBulkUpdateEnvelopes() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ updates }: BulkUpdateEnvelopeParams) => {
            // PocketBase doesn't have a native bulk update API for collections yet (as of v0.22),
            // so we use Promise.all to run them in parallel.
            // In a real production app with high volume, we'd want a custom backend endpoint for this.
            const promises = updates.map((update) =>
                pb.collection(Collections.Envelopes).update(update.id, update.data)
            );
            return Promise.all(promises);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [Collections.Envelopes] });
        },
    });
}
