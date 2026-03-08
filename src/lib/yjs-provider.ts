import * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';
import YPartyKitProvider from "y-partykit/provider";
import { SYNC_CONFIG } from '../config/sync';
import type { InfinityLogItem, Chore, Bill, ShoppingItem, CalendarEvent, WellnessEntry, Message, User } from '../types/schema';

// ─── Document & Persistence ──────────────────────────────────────
export const doc = new Y.Doc();

export const persistence = typeof window !== 'undefined' && typeof indexedDB !== 'undefined'
    ? new IndexeddbPersistence(SYNC_CONFIG.ROOM_NAME, doc)
    : null;

if (persistence) {
    persistence.on('synced', () => {
        console.log('✅ [Yjs] Local persistence loaded');
    });
}

// ─── Provider Management ─────────────────────────────────────────
let currentProvider: YPartyKitProvider | null = null;
let currentActiveToken: string | null = null;

function createProvider(token: string): YPartyKitProvider {
    console.log('🔧 [Yjs] Creating provider with token:', token ? `${token.substring(0, 20)}...` : 'EMPTY');

    const newProvider = new YPartyKitProvider(
        SYNC_CONFIG.PARTYKIT_HOST,
        SYNC_CONFIG.ROOM_NAME,
        doc,
        {
            connect: false,
            params: { token }
        }
    );

    newProvider.on('status', (event: { connected: boolean }) => {
        console.log(`📡 [Yjs] PartyKit status: ${event.connected ? 'connected' : 'disconnected'}`);
    });

    newProvider.on('connection-error', (error: any) => {
        console.error('❌ [Yjs] PartyKit connection error:', error);
    });

    newProvider.on('synced', () => {
        console.log('✅ [Yjs] PartyKit synced with server');
    });

    // We only connect explicitly when createProvider is called with a token
    if (token) {
        newProvider.connect();
    }

    return newProvider;
}

// Export getter for provider (may be null on server or before auth)
export function getProvider(): YPartyKitProvider | null {
    return currentProvider;
}

// Ensure the provider is explicitly disconnected on logout
export function disconnectProvider() {
    if (currentProvider) {
        console.log('🔌 [Yjs] Disconnecting provider...');
        currentProvider.disconnect();
        currentProvider.destroy();
        currentProvider = null;
        currentActiveToken = null;
    }
}

// Function to update the provider's token and explicitly connect - creates new provider
export function updateProviderToken(newToken: string | null) {
    if (typeof window === 'undefined') return;

    // Prevent destroying the websocket if the token literally hasn't changed.
    // This stops the "WebSocket is closed before the connection is established" race condition error.
    if (newToken === currentActiveToken) {
        return;
    }

    // Destroy old provider
    if (currentProvider) {
        console.log('🔄 [Yjs] Destroying old provider...');
        currentProvider.disconnect();
        currentProvider.destroy();
        currentProvider = null;
    }

    currentActiveToken = newToken;

    if (!newToken) {
        console.log('🛑 [Yjs] Token cleared. Provider remains disconnected.');
        return;
    }

    // Create new provider with token
    currentProvider = createProvider(newToken);

    console.log('✅ [Yjs] Provider recreated and connected with new token');
}

// 4. Export shared types
export const infinityLog = doc.getArray<InfinityLogItem>('infinityLog');
export const chores = doc.getArray<Chore>('chores');
export const bills = doc.getArray<Bill>('bills');
export const shoppingList = doc.getArray<ShoppingItem>('shoppingList');
export const calendar = doc.getArray<CalendarEvent>('calendar');
export const wellness = doc.getArray<WellnessEntry>('wellness');
export const messages = doc.getArray<Message>('messages');
export const users = doc.getMap<User>('users');
