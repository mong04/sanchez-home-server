// Environment detection
// Vite exposes env vars via import.meta.env
const isDev = import.meta.env.DEV;

export const SYNC_CONFIG = {
    ROOM_NAME: 'sanchez-family-os-v1',
    // In a real app, this might be configurable or environment-based.
    // For now, consistent local password for the family.
    SYNC_PASSWORD: 'family-secure-local',

    // PROD: Use secure public signaling servers + Encryption
    // DEV: Use local signaling server + No Encryption (to allow HTTP)
    SIGNALING_URLS: isDev
        ? ['ws://localhost:4444']
        : [
            'wss://signaling.yjs.dev',
            'wss://y-webrtc-signaling-eu.herokuapp.com',
            'wss://y-webrtc-signaling-us.herokuapp.com'
        ],

    ENABLE_ENCRYPTION: !isDev,
} as const;
