// src/providers/BackendProvider.tsx
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { BackendAdapter, BackendConfig, BackendType } from '../lib/backend/types';
import { PocketBaseAdapter } from '../lib/backend/pocketbase';
import { SupabaseAdapter } from '../lib/backend/supabase';

interface BackendContextValue {
    adapter: BackendAdapter;
    backendType: BackendType;
    switchBackend: (newConfig: BackendConfig) => Promise<void>;
}

const BackendContext = createContext<BackendContextValue | null>(null);

function createAdapter(config: BackendConfig): BackendAdapter {
    if (config.type === 'pocketbase') {
        return new PocketBaseAdapter(config.url, config.token);
    }
    return new SupabaseAdapter(config.url, config.publishableKey ?? '', config.token);
}

function getStoredConfig(): BackendConfig {
    const params = new URLSearchParams(window.location.search);
    if (params.has('reset_backend')) {
        localStorage.removeItem('sfos_backend_config');
        // Clean up URL
        window.history.replaceState({}, '', window.location.pathname);
    }

    const stored = localStorage.getItem('sfos_backend_config');
    if (stored) {
        try {
            const parsed = JSON.parse(stored) as BackendConfig;
            if (parsed.type === 'pocketbase' || parsed.type === 'supabase') {
                return parsed;
            }
        } catch {
            // invalid stored config → fall through to default
        }
    }

    // Default: Supabase (cloud-first onboarding)
    return {
        type: 'supabase',
        url: import.meta.env.VITE_SUPABASE_URL ?? '',
        publishableKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? '',
    };
}

// Global reference for non-hook access (e.g. loaders).
// This MUST be initialized eagerly so `react-router` loaders don't see a null adapter on page refresh!
let globalAdapter: BackendAdapter = createAdapter(getStoredConfig());
export const getBackendAdapter = () => globalAdapter;

export function BackendProvider({ children }: { children: ReactNode }) {
    const [config, setConfig] = useState<BackendConfig>(getStoredConfig);
    const [adapter, setAdapter] = useState<BackendAdapter>(globalAdapter);

    useEffect(() => {
        console.log(`[SFOS] Active Backend: ${config.type.toUpperCase()}`);

        // Only recreate the adapter if the config actually changes (e.g. switchBackend is called)
        // Otherwise, we end up dropping the first initialized connection instance.
        const cachedConfig = localStorage.getItem('sfos_backend_config');
        const isDifferent = cachedConfig !== JSON.stringify(config);

        if (isDifferent) {
            const newAdapter = createAdapter(config);
            setAdapter(newAdapter);
            globalAdapter = newAdapter;
            localStorage.setItem('sfos_backend_config', JSON.stringify(config));
        }
    }, [config]);

    const switchBackend = async (newConfig: BackendConfig) => {
        // TODO (future): call old adapter.signOut() before switching for clean re-auth
        console.log(`[SFOS] Switching backend to: ${newConfig.type.toUpperCase()}`);
        setConfig(newConfig);
    };

    return (
        <BackendContext.Provider value={{ adapter, backendType: config.type, switchBackend }}>
            {children}
        </BackendContext.Provider>
    );
}

export function useBackend(): BackendContextValue {
    const ctx = useContext(BackendContext);
    if (!ctx) throw new Error('useBackend must be used within BackendProvider');
    return ctx;
}
