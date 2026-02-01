import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';
import { WebrtcProvider } from 'y-webrtc';

// Mock y-indexeddb and y-webrtc for node environment if necessary
// But y-indexeddb works in jsdom (which vitest uses by default)
// validations will check if real persistence logic holds.

describe('Network Resilience & Offline Mode', () => {
    const ROOM_NAME = 'test-room-' + Date.now();

    // Helper to create a standardized doc environment
    const createClient = (clientName: string) => {
        const doc = new Y.Doc();
        // Use a unique room for this test run to avoid collisions
        const persistence = new IndexeddbPersistence(ROOM_NAME, doc);

        // We can't easily mock WebrtcProvider perfectly in Node/JSDOM without a signaling server,
        // so we might focus on the CRDT sync logic or simple event tests.
        // For accurate sync testing without a network, we often just sync two docs locally.

        return { doc, persistence, clientName };
    };

    it('Scenario: Offline Persistence - Data survives "app restart"', async () => {
        // 1. Client A starts (Online/Offline doesn't matter for local persistence)
        const clientA = createClient('ClientA');

        // Wait for persistence to sync (load from IDB)
        await new Promise<void>(resolve => clientA.persistence.on('synced', () => resolve()));

        // 2. Client A adds an item
        const calendar = clientA.doc.getArray('calendar');
        const eventId = 'event-offline-1';
        calendar.push([{ id: eventId, title: 'Offline Event' }]);

        // Assume reliable write to IDB (y-indexeddb is usually fast, but let's wait a tick)
        await new Promise(r => setTimeout(r, 100));

        // 3. "Close App" -> Destroy doc/persistence
        clientA.persistence.destroy();
        clientA.doc.destroy();

        // 4. "Restart App" -> New Doc, same Room/IDB name
        const clientARestarted = createClient('ClientA');

        // 5. Verify Data is restored
        await new Promise<void>(resolve => clientARestarted.persistence.on('synced', () => resolve()));

        const calendarRestored = clientARestarted.doc.getArray('calendar');
        expect(calendarRestored.length).toBeGreaterThan(0);
        expect(calendarRestored.get(0).title).toBe('Offline Event');

        // Cleanup
        clientARestarted.persistence.destroy();
    }, 10000); // increase timeout for IndexedDB ops

    it('Scenario: Sync Recovery - Two clients converge after connection restored', async () => {
        // Simulated network sync using Y.applyUpdate
        // We manually sync them to simulate "Network Flakiness" control

        const docA = new Y.Doc();
        const docB = new Y.Doc(); // Same content check

        const mapA = docA.getMap('data');
        const mapB = docB.getMap('data');

        docA.on('update', update => {
            // Simulate Network: A -> B
            // In a flaky network, we might drop this update or delay it.
            // For this test, we'll store it and apply later.
        });

        // 1. Both start empty.
        // 2. Disconnected state: A adds Key1, B adds Key2
        mapA.set('key1', 'value1');
        mapB.set('key2', 'value2');

        expect(mapA.get('key2')).toBeUndefined();
        expect(mapB.get('key1')).toBeUndefined();

        // 3. Reconnect / Sync happens
        // We manually exchange state vectors and updates
        const stateA = Y.encodeStateAsUpdate(docA);
        const stateB = Y.encodeStateAsUpdate(docB);

        Y.applyUpdate(docA, stateB);
        Y.applyUpdate(docB, stateA);

        // 4. Verify Convergence
        expect(mapA.get('key2')).toBe('value2');
        expect(mapB.get('key1')).toBe('value1');
    });

    it('Scenario: Conflict Resolution - Last Write Wins (LWW) on simple types', () => {
        const docA = new Y.Doc();
        const docB = new Y.Doc();

        docA.clientID = 1; // determinism
        docB.clientID = 2;

        const mapA = docA.getMap('chore');
        const mapB = docB.getMap('chore');

        // Initial state
        mapA.set('status', 'pending');
        Y.applyUpdate(docB, Y.encodeStateAsUpdate(docA));
        expect(mapB.get('status')).toBe('pending');

        // Concurrent edits
        // A sets 'done'
        mapA.set('status', 'done');

        // B sets 'archived'
        mapB.set('status', 'archived');

        // Sync
        Y.applyUpdate(docA, Y.encodeStateAsUpdate(docB));
        Y.applyUpdate(docB, Y.encodeStateAsUpdate(docA));

        // In Yjs LWW, checks generated lamport/clock. 
        // If happened "simultaneously", usually higher clientID wins or last applied. 
        // We verify they are IDENTICAL.
        expect(mapA.get('status')).toBe(mapB.get('status'));

        // We can assert strict LWW if we verify internal clocks, but for our app,
        // we just care that they converge to the Same value.
    });
});
