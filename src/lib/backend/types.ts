// src/lib/backend/types.ts
// BackendAdapter interface — the single contract that all backend implementations must satisfy.
// Part of Phase 11.5: Backend Abstraction & Migration Wizard

export type BackendType = 'pocketbase' | 'supabase';

export interface BackendConfig {
    type: BackendType;
    url: string;
    anonKey?: string; // Supabase only
    token?: string;
}


export interface User {
    id: string;
    email: string;
    name: string;
    avatar?: string;
    role: 'admin' | 'member';
}

export interface BackendAdapter {
    // ─── Auth ───────────────────────────────────────────────────────
    signIn(email: string, password: string): Promise<{ user: User; token: string }>;
    signOut(): Promise<void>;
    getCurrentUser(): User | null;
    onAuthStateChange(callback: (user: User | null) => void): () => void;

    // ─── CRUD (generic, type-safe) ──────────────────────────────────
    getOne<T>(collection: string, id: string, options?: {
        expand?: string;
    }): Promise<T>;

    getList<T>(collection: string, options?: {
        filter?: string;
        sort?: string;
        page?: number;
        perPage?: number;
        expand?: string;
    }): Promise<{ items: T[]; total: number }>;

    getFullList<T>(collection: string, options?: {
        filter?: string;
        sort?: string;
        expand?: string;
    }): Promise<T[]>;

    create<T>(collection: string, data: Partial<T>): Promise<T>;
    update<T>(collection: string, id: string, data: Partial<T>): Promise<T>;
    delete(collection: string, id: string): Promise<void>;

    // ─── Realtime (normalized) ──────────────────────────────────────
    subscribe(
        collection: string,
        recordId: string | null,
        callback: (event: 'create' | 'update' | 'delete', record: any) => void
    ): () => void;

    // ─── Storage / Files ────────────────────────────────────────────
    uploadFile(
        collection: string,
        recordId: string,
        file: File,
        field: string
    ): Promise<string>;

    getFileUrl(
        collection: string,
        recordId: string,
        filename: string
    ): string;

    // ─── Migration Helpers ──────────────────────────────────────────
    exportAll(): Promise<ExportDump>;
    importAll(dump: ExportDump): Promise<ImportResult>;
}

export interface ExportDump {
    version: string;
    timestamp: string;
    collections: Record<string, any[]>;
    files: Record<string, string>; // base64 or signed URLs
}

export interface ImportResult {
    success: boolean;
    recordsImported: number;
    errors: string[];
}
