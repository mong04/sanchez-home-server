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
    return new SupabaseAdapter(config.url, config.anonKey ?? '', config.token);
}

function getStoredConfig(): BackendConfig {
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

    // TEMPORARY DEFAULT: PocketBase (so we can keep developing while we set up Supabase)
    // We will flip this back to 'supabase' once the test project is ready
    console.warn('⚠️  SFOS Backend: No stored config found. Defaulting to PocketBase for now.');
    return {
        type: 'pocketbase',
        url: typeof import.meta.env !== 'undefined' ? (import.meta as any).env.VITE_POCKETBASE_URL ?? 'http://127.0.0.1:8090' : 'http://127.0.0.1:8090',
        // token will be handled by auth flow
    };
}

export function BackendProvider({ children }: { children: ReactNode }) {
    const [config, setConfig] = useState<BackendConfig>(getStoredConfig);
    const [adapter, setAdapter] = useState<BackendAdapter>(() => createAdapter(config));

    useEffect(() => {
        const newAdapter = createAdapter(config);
        setAdapter(newAdapter);
        localStorage.setItem('sfos_backend_config', JSON.stringify(config));
    }, [config]);

    const switchBackend = async (newConfig: BackendConfig) => {
        // TODO (future): call old adapter.signOut() before switching for clean re-auth
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
