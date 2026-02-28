// src/lib/backend/server-adapter.js
import PocketBase from 'pocketbase';

/**
 * A specialized backend adapter for Node.js server environments (like signaling.js).
 * Adheres to the PRD mandate by isolating the PocketBase SDK import here.
 */
export class ServerAdapter {
    /**
     * @param {string} url - The backend URL
     */
    constructor(url) {
        this.pb = new PocketBase(url);
    }

    /**
     * Fetch push subscriptions for a target user or family
     * @param {string} targetId 
     * @param {string} authHeader Optional auth proxy
     * @returns {Promise<any[]>}
     */
    async getPushSubscriptions(targetId, authHeader) {
        const filter = targetId === 'family' ? '' : `userId="${targetId}"`;

        // If an auth header was provided across the wire, we can set it via fetchOptions or manually
        // But for a server admin pull, we usually don't need user context if the collection is open/server-accessible
        // PocketBase Node client allows sending fetchOptions
        const options = authHeader ? { headers: { 'Authorization': authHeader } } : {};

        return await this.pb.collection('push_subscriptions').getFullList({
            filter: filter,
            ...options
        });
    }
}
