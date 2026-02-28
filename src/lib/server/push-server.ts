// src/lib/server/push-server.ts
import webpush from 'web-push';
import type { PushPayload } from '../backend/types';

// These should be set in your server environment
const VAPID_PUBLIC_KEY = process.env.VITE_VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const GCM_API_KEY = process.env.GCM_API_KEY; // Optional

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
        'mailto:admin@sanchez.family',
        VAPID_PUBLIC_KEY,
        VAPID_PRIVATE_KEY
    );
}

if (GCM_API_KEY) {
    webpush.setGCMAPIKey(GCM_API_KEY);
}

export interface PushSubscriptionRecord {
    endpoint: string;
    keys: {
        p256dh: string;
        auth: string;
    };
}

/**
 * Sends a push notification to a specific subscription.
 */
export async function sendPushToSubscription(
    subscription: PushSubscriptionRecord,
    payload: PushPayload
) {
    const pushSubscription = {
        endpoint: subscription.endpoint,
        keys: {
            p256dh: subscription.keys.p256dh,
            auth: subscription.keys.auth
        }
    };

    return webpush.sendNotification(
        pushSubscription,
        JSON.stringify(payload)
    );
}

/**
 * Example usage for a PocketBase hook or Node API route:
 * 
 * router.post('/api/sfos/send-push', async (req, res) => {
 *   const { userId, payload } = req.body;
 *   // 1. Fetch all subscriptions for this user from PB
 *   const subs = await pb.collection('push_subscriptions').getFullList({
 *     filter: `userId = "${userId}"`
 *   });
 *   
 *   // 2. Send to all
 *   const results = await Promise.allSettled(
 *     subs.map(sub => sendPushToSubscription(sub, payload))
 *   );
 *   
 *   res.json({ success: true, results });
 * });
 */
