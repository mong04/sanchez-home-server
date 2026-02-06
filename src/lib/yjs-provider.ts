import * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';
import YPartyKitProvider from "y-partykit/provider";
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

// 3. Configure PartyKit Provider (WebSocket Sync)
// This connects to the PartyKit server (Managed WebSocket)
export const provider = new YPartyKitProvider(
    SYNC_CONFIG.PARTYKIT_HOST,
    SYNC_CONFIG.ROOM_NAME,
    doc
);

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
