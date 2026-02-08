// Polyfill type for process to avoid "Cannot find name 'process'" in client builds
declare const process: { env: Record<string, string | undefined> };

export const env = {
    // Helper to get env vars safely across Vite (client) and PartyKit (server)
    get: (key: string): string | undefined => {
        // 1. Try Vite's import.meta.env (Client-side)
        if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
            return import.meta.env[key];
        }
        // 2. Try process.env (Server-side / Node)
        if (typeof process !== 'undefined' && process.env && process.env[key]) {
            return process.env[key];
        }
        return undefined;
    },

    getOrThrow: (key: string): string => {
        const value = env.get(key);
        if (!value) {
            throw new Error(`Missing required environment variable: ${key}`);
        }
        return value;
    },

    // Specific Getters
    get PARTYKIT_HOST() {
        return this.get('NEXT_PUBLIC_PARTYKIT_HOST') || "127.0.0.1:1999";
    },

    get PARTYKIT_SECRET() {
        // In production/deployment, this MUST be set.
        // In local dev, we can fallback or require .env
        return this.getOrThrow('PARTYKIT_SECRET');
    }
};
