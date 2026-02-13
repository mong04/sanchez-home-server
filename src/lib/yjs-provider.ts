import * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';
import YPartyKitProvider from "y-partykit/provider";
import { SYNC_CONFIG } from '../config/sync';
import type { InfinityLogItem, Chore, Bill, ShoppingItem, CalendarEvent, WellnessEntry, Message, User } from '../types/schema';

// 1. Create the shared document
export const doc = new Y.Doc();

// 2. Configure persistence (Offline First)
export const persistence = typeof window !== 'undefined' && typeof indexedDB !== 'undefined'
    ? new IndexeddbPersistence(SYNC_CONFIG.ROOM_NAME, doc)
    : null;

if (persistence) {
    persistence.on('synced', () => {
        console.log('✅ [Yjs] Local persistence loaded');
    });
}

// 3. Provider management - mutable reference for token updates
let currentProvider: YPartyKitProvider | null = null;

function createProvider(token: string): YPartyKitProvider {
    console.log('🔧 [Yjs] Creating provider with token:', token ? `${token.substring(0, 20)}...` : 'EMPTY');

    const newProvider = new YPartyKitProvider(
        SYNC_CONFIG.PARTYKIT_HOST,
        SYNC_CONFIG.ROOM_NAME,
        doc,
        {
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

    return newProvider;
}

// Initialize provider with stored token (if any)
if (typeof window !== 'undefined') {
    const storedToken = localStorage.getItem('sfos_token') || '';
    console.log('🔌 [Yjs] Initial provider config:', {
        host: SYNC_CONFIG.PARTYKIT_HOST,
        room: SYNC_CONFIG.ROOM_NAME,
        hasToken: !!storedToken
    });
    currentProvider = createProvider(storedToken);
}

// Export getter for provider (may be null on server)
export function getProvider(): YPartyKitProvider | null {
    return currentProvider;
}

// Legacy export for compatibility
export const provider = {
    get awareness() { return currentProvider?.awareness; },
    get ws() { return currentProvider?.ws; },
    disconnect() { currentProvider?.disconnect(); },
    connect() { currentProvider?.connect(); },
    on(event: string, handler: any) { currentProvider?.on(event, handler); },
    off(event: string, handler: any) { currentProvider?.off(event, handler); },
};

// Function to update the provider's token - creates new provider
export function updateProviderToken(newToken: string) {
    if (typeof window === 'undefined') return;

    console.log('🔄 [Yjs] Updating provider token...');

    // Destroy old provider
    if (currentProvider) {
        currentProvider.disconnect();
        currentProvider.destroy();
    }

    // Create new provider with token
    currentProvider = createProvider(newToken);

    console.log('✅ [Yjs] Provider recreated with new token');
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
