export const SYNC_CONFIG = {
    ROOM_NAME: 'sanchez-family-os-v1',
    // In a real app, this might be configurable or environment-based.
    // For now, consistent local password for the family.
    SYNC_PASSWORD: 'family-secure-local',
    SIGNALING_URLS: ['ws://localhost:4444', 'wss://signaling.yjs.dev']
} as const;
