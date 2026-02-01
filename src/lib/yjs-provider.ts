import * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';
import { WebrtcProvider } from 'y-webrtc';
import { SYNC_CONFIG } from '../config/sync';
import type { InfinityLogItem, Chore, Bill, ShoppingItem, CalendarEvent, WellnessEntry, Message } from '../types/schema';

// 1. Create the shared document
export const doc = new Y.Doc();

// 2. Configure persistence (Offline First)
// This will save the state to the browser's IndexedDB
export const persistence = typeof window !== 'undefined' && typeof indexedDB !== 'undefined'
    ? new IndexeddbPersistence(SYNC_CONFIG.ROOM_NAME, doc)
    : null;

if (persistence) {
    persistence.on('synced', () => {
        console.log('✅ [Yjs] Local persistence loaded');
    });
}

// 3. Configure WebRTC Provider (P2P Sync)
// This connects to other peers in the same room
// Note: We cast to any to avoid potential strict type issues with the provider library options if needed,
// but usually it works fine.
// [DEV NOTE]: Password encryption requires a Secure Context (HTTPS/Localhost).
// To allow LAN testing on HTTP (e.g., 192.168.x.x), we disable it temporarily.
// WebRTC still provides DTLS transport security.
const ENABLE_ENCRYPTION = false;

export const provider = new WebrtcProvider(SYNC_CONFIG.ROOM_NAME, doc, {
    password: ENABLE_ENCRYPTION ? SYNC_CONFIG.SYNC_PASSWORD : undefined,
    // Cast to mutable array to satisfy y-webrtc types
    signaling: [...SYNC_CONFIG.SIGNALING_URLS]
});

provider.on('status', (event: { connected: boolean }) => {
    console.log(`📡 [Yjs] WebRTC status: ${event.connected ? 'connected' : 'disconnected'}`);
});

// 4. Export shared types
// These are the root level shared structures
export const infinityLog = doc.getArray<InfinityLogItem>('infinityLog');
export const chores = doc.getArray<Chore>('chores'); // Updated type
export const bills = doc.getArray<Bill>('bills'); // New
export const shoppingList = doc.getArray<ShoppingItem>('shoppingList'); // New
export const calendar = doc.getArray<CalendarEvent>('calendar');
export const wellness = doc.getArray<WellnessEntry>('wellness');
export const messages = doc.getArray<Message>('messages');
