// Environment detection
// Vite exposes env vars via import.meta.env
import { env } from './env';

const isDev = import.meta.env.DEV;

export const SYNC_CONFIG = {
    ROOM_NAME: 'sanchez-family-os-v1',
    // In a real app, this might be configurable or environment-based.
    // For now, consistent local password for the family.
    SYNC_PASSWORD: import.meta.env.VITE_SYNC_PASSWORD,

    // PROD: Use PartyKit Cloud
    // DEV: Use local PartyKit server (127.0.0.1:1999)
    PARTYKIT_HOST: env.PARTYKIT_HOST,

    ENABLE_ENCRYPTION: !isDev,
} as const;
