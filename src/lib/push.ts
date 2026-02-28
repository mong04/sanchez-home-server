// src/lib/push.ts
import type { BackendAdapter } from './backend/types';
import { COLLECTIONS } from './backend/collections';

// Accessing environment variable safely
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

export interface PushSubscriptionData {
    id?: string;
    userId: string;
    endpoint: string;
    expirationTime: number | null;
    keys: {
        p256dh: string;
        auth: string;
    };
}
/**
 * Converts a base64 string to a Uint8Array.
 * Needed for the VAPID public key.
 */
function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

/**
 * Checks if the browser supports service workers and push notifications.
 */
export function isPushSupported() {
    return (
        typeof window !== 'undefined' &&
        'serviceWorker' in navigator &&
        'PushManager' in window
    );
}

/**
 * Gets the existing push subscription if it exists.
 */
export async function getSubscription(): Promise<PushSubscription | null> {
    if (!isPushSupported()) return null;
    const registration = await navigator.serviceWorker.ready;
    return await registration.pushManager.getSubscription();
}

/**
 * Subscribes the current user to push notifications and saves the sub to the backend.
 * @param adapter The backend adapter
 * @param profileId Optional profile ID to link this subscription to (e.g. for multi-profile accounts)
 */
export async function subscribeUserToPush(adapter: BackendAdapter, profileId?: string) {
    if (!isPushSupported()) throw new Error('Push notifications are not supported in this browser.');
    if (!VAPID_PUBLIC_KEY) throw new Error('VAPID public key is missing.');

    const registration = await navigator.serviceWorker.ready;

    // Request subscription from browser
    const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });

    const currentUser = adapter.getCurrentUser();
    if (!currentUser) throw new Error('User must be signed in to subscribe to push notifications.');

    // Extract keys for storage
    const p256dh = subscription.getKey('p256dh');
    const auth = subscription.getKey('auth');

    if (!p256dh || !auth) throw new Error('Failed to retrieve push subscription keys.');

    const subData: PushSubscriptionData = {
        userId: profileId || currentUser.id,
        endpoint: subscription.endpoint,
        expirationTime: subscription.expirationTime,
        keys: {
            p256dh: btoa(String.fromCharCode(...new Uint8Array(p256dh))),
            auth: btoa(String.fromCharCode(...new Uint8Array(auth))),
        },
    };

    // Save to backend - check for existing first to avoid dupes
    const { items: existingRecords } = await adapter.getList<PushSubscriptionData>(COLLECTIONS.PUSH_SUBSCRIPTIONS, {
        filter: `userId = "${profileId || currentUser.id}" && endpoint = "${subData.endpoint}"`,
    });

    if (existingRecords.length === 0) {
        await adapter.create(COLLECTIONS.PUSH_SUBSCRIPTIONS, subData);
    }

    return subscription;
}

/**
 * Unsubscribes the current user from push notifications and removes the sub from the backend.
 */
export async function unsubscribeUserFromPush(adapter: BackendAdapter) {
    const subscription = await getSubscription();
    if (!subscription) return;

    const endpoint = subscription.endpoint;
    const currentUser = adapter.getCurrentUser();

    // Remove from browser
    await subscription.unsubscribe();

    // Remove from backend
    if (currentUser) {
        const { items: existingRecords } = await adapter.getList<{ id: string }>(COLLECTIONS.PUSH_SUBSCRIPTIONS, {
            filter: `userId = "${currentUser.id}" && endpoint = "${endpoint}"`,
        });

        for (const record of existingRecords) {
            await adapter.delete(COLLECTIONS.PUSH_SUBSCRIPTIONS, record.id);
        }
    }
}
