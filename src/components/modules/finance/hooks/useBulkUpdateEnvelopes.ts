import { useMutation, useQueryClient } from '@tanstack/react-query';
import { pb } from '../../../../lib/pocketbase';
import { Collections } from '../../../../types/pocketbase';
import type { EnvelopeRecord } from '../../../../types/pocketbase';

interface BulkUpdateEnvelopeParams {
    updates: { id: string; data: Partial<EnvelopeRecord> }[];
}

export function useBulkUpdateEnvelopes() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ updates }: BulkUpdateEnvelopeParams) => {
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
