import * as Y from 'yjs'
import { WebrtcProvider } from 'y-webrtc'
import { IndexeddbPersistence } from 'y-indexeddb'

// Singleton declarations to prevent multiple instances during hot-reloads
export const doc = new Y.Doc()

import { SYNC_CONFIG } from '../config/sync'

// Room name should be unique to the family/deployment.
// For dev/phase 1, we use a static string. In production, this might be configurable.
export const ROOM_NAME = 'sanchez-family-os-phase1-dev'

export const webrtcProvider = new WebrtcProvider(ROOM_NAME, doc, {
    signaling: ['wss://signaling.yjs.dev'],
    password: SYNC_CONFIG.SYNC_PASSWORD,
})

export const persistence = new IndexeddbPersistence(ROOM_NAME, doc)

// Seeding Logic
persistence.on('synced', () => {
    console.log('Local persistence synced')

    // Simple check: if root 'system' map is missing, seed data
    const systemMap = doc.getMap('system')
    if (!systemMap.has('version')) {
        console.log('Seeding initial data...')
        doc.transact(() => { // Bundle changes
            systemMap.set('version', '1.0.0')
            systemMap.set('installedAt', new Date().toISOString())
            systemMap.set('phase', 'Phase 1: Foundation')
        })
    }
})

// Debug helpers
// @ts-expect-error - Debugging helper attached to window
window.yjs = { doc, webrtcProvider, persistence }
