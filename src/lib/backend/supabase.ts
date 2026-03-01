// src/lib/backend/supabase.ts
// SupabaseAdapter — wraps Supabase JS SDK into the BackendAdapter interface.
// Enables "start on free Supabase cloud, migrate to self-hosted PocketBase later" workflow.

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { BackendAdapter, User, ExportDump, ImportResult, PushPayload } from './types';
import { COLLECTIONS } from './collections';

export class SupabaseAdapter implements BackendAdapter {
    private supabase: SupabaseClient;
    private currentToken: string | null = null;
    private currentUser: User | null = null;

    constructor(url: string, publishableKey: string, _authToken?: string) {
        this.supabase = createClient(url, publishableKey);
        // Try to get initial session asynchronously
        this.supabase.auth.getSession().then(({ data }) => {
            this.currentToken = data.session?.access_token ?? null;
            this.currentUser = data.session?.user ? this.mapUser(data.session.user) : null;
        });
    }

    getToken(): string | null {
        return this.currentToken;
    }

    // ─── Auth ─────────────────────────────────────────────────────
    async signIn(email: string, password: string) {
        const { data, error } = await this.supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        this.currentToken = data.session.access_token;
        this.currentUser = this.mapUser(data.user);
        return {
            user: this.currentUser,
            token: this.currentToken,
        };
    }

    async signOut() {
        await this.supabase.auth.signOut();
        this.currentToken = null;
        this.currentUser = null;
    }

    getCurrentUser(): User | null {
        return this.currentUser;
    }

    onAuthStateChange(callback: (user: User | null) => void) {
        const { data: { subscription } } = this.supabase.auth.onAuthStateChange(
            (_event, session) => {
                this.currentToken = session?.access_token ?? null;
                this.currentUser = session ? this.mapUser(session.user) : null;
                callback(this.currentUser);
            }
        );
        return () => subscription.unsubscribe();
    }

    // ─── CRUD ─────────────────────────────────────────────────────
    async getOne<T>(collection: string, id: string, options?: { expand?: string }) {
        const query = this.supabase.from(collection).select(options?.expand ?? '*').eq('id', id).single();
        const { data, error } = await query;
        if (error) throw error;
        return this.toCamel(data) as T;
    }

    async getList<T>(collection: string, options?: {
        filter?: string; sort?: string; page?: number; perPage?: number; expand?: string;
    }) {
        const page = options?.page ?? 1;
        const perPage = options?.perPage ?? 50;
        const from = (page - 1) * perPage;
        const to = from + perPage - 1;

        let query = this.supabase
            .from(collection)
            .select(options?.expand ?? '*', { count: 'exact' })
            .range(from, to);

        if (options?.sort) {
            const desc = options.sort.startsWith('-');
            const col = desc ? options.sort.slice(1) : options.sort;
            query = query.order(col, { ascending: !desc });
        }

        const { data, count, error } = await query;
        if (error) throw error;

        const mappedItems = (data ?? []).map(item => this.toCamel(item));
        return { items: mappedItems as T[], total: count ?? 0 };
    }

    async getFullList<T>(collection: string, options?: {
        filter?: string; sort?: string; expand?: string;
    }) {
        let query = this.supabase.from(collection).select(options?.expand ?? '*');

        if (options?.sort) {
            const desc = options.sort.startsWith('-');
            const col = desc ? options.sort.slice(1) : options.sort;
            query = query.order(col, { ascending: !desc });
        }

        const { data, error } = await query;
        if (error) throw error;
        return (data ?? []).map(item => this.toCamel(item)) as T[];
    }

    // Helper to match PocketBase's 15-char string IDs just in case frontend relies on it
    private generateId(): string {
        return Array.from(crypto.getRandomValues(new Uint8Array(15)))
            .map((b) => "abcdefghijklmnopqrstuvwxyz0123456789"[b % 36])
            .join("");
    }

    // Helper to map camelCase (frontend) to snake_case (database)
    private toSnake(obj: any): any {
        if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj;
        const result: any = {};
        for (const [key, value] of Object.entries(obj)) {
            const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
            result[snakeKey] = value;
        }
        return result;
    }

    // Helper to map snake_case (database) to camelCase (frontend)
    private toCamel(obj: any): any {
        if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj;
        const result: any = {};
        for (const [key, value] of Object.entries(obj)) {
            const camelKey = key.replace(/_([a-z])/g, g => g[1].toUpperCase());
            result[camelKey] = value;
        }
        return result;
    }

    async create<T>(collection: string, data: Partial<T>) {
        const payload: any = { ...data };
        // Auto-generate ID if missing to mimic PocketBase behavior
        if (!payload.id) {
            payload.id = this.generateId();
        }

        const snakePayload = this.toSnake(payload);

        const { data: result, error } = await this.supabase.from(collection).insert(snakePayload).select().single();
        if (error) {
            console.error(`❌ [SupabaseAdapter] Failed to create in ${collection}:`, error, 'Payload:', snakePayload);
            throw error;
        }
        return this.toCamel(result) as T;
    }

    async update<T>(collection: string, id: string, data: Partial<T>) {
        const snakePayload = this.toSnake(data);
        const { data: result, error } = await this.supabase.from(collection).update(snakePayload).eq('id', id).select().single();
        if (error) throw error;
        return this.toCamel(result) as T;
    }

    async delete(collection: string, id: string) {
        const { error } = await this.supabase.from(collection).delete().eq('id', id);
        if (error) throw error;
    }

    // ─── Realtime ─────────────────────────────────────────────────
    subscribe(
        collection: string,
        recordId: string | null,
        callback: (event: 'create' | 'update' | 'delete', record: any) => void
    ) {
        const filter = recordId ? `id=eq.${recordId}` : undefined;
        const channel = this.supabase
            .channel(`${collection}-${recordId ?? 'all'}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: collection, filter },
                (payload) => {
                    const eventMap: Record<string, 'create' | 'update' | 'delete'> = {
                        INSERT: 'create',
                        UPDATE: 'update',
                        DELETE: 'delete',
                    };
                    callback(eventMap[payload.eventType], payload.new ?? payload.old);
                }
            )
            .subscribe();

        return () => { this.supabase.removeChannel(channel); };
    }

    // ─── Storage ──────────────────────────────────────────────────
    async uploadFile(collection: string, recordId: string, file: File, field: string) {
        const path = `${collection}/${recordId}/${field}/${file.name}`;
        const { error } = await this.supabase.storage.from('files').upload(path, file, { upsert: true });
        if (error) throw error;
        return path;
    }

    getFileUrl(collection: string, recordId: string, filename: string) {
        const path = `${collection}/${recordId}/${filename}`;
        const { data } = this.supabase.storage.from('files').getPublicUrl(path);
        return data.publicUrl;
    }

    // ─── Migration ────────────────────────────────────────────────
    async exportAll(): Promise<ExportDump> {
        const dump: ExportDump = {
            version: '1.0',
            timestamp: new Date().toISOString(),
            collections: {},
            files: {},
        };
        for (const table of Object.values(COLLECTIONS)) {
            const { data } = await this.supabase.from(table).select('*');
            dump.collections[table] = data ?? [];
        }
        return dump;
    }

    async importAll(dump: ExportDump): Promise<ImportResult> {
        let recordsImported = 0;
        const errors: string[] = [];

        for (const [table, records] of Object.entries(dump.collections)) {
            for (const record of records) {
                try {
                    const { id, created_at, updated_at, ...data } = record;
                    const { error } = await this.supabase.from(table).insert(data);
                    if (error) throw error;
                    recordsImported++;
                } catch (err: any) {
                    errors.push(`${table}/${record.id}: ${err.message}`);
                }
            }
        }

        return { success: errors.length === 0, recordsImported, errors };
    }

    // ─── Helpers ──────────────────────────────────────────────────
    private mapUser(user: any): User {
        return {
            id: user.id,
            email: user.email ?? '',
            name: user.user_metadata?.name ?? '',
            avatar: user.user_metadata?.avatar,
            partykit_id: user.user_metadata?.partykit_id,
            role: user.user_metadata?.role ?? 'member',
        };
    }

    async requestPasswordReset(email: string): Promise<void> {
        const { error } = await this.supabase.auth.resetPasswordForEmail(email);
        if (error) throw error;
    }

    async sendPush(userId: string, payload: PushPayload): Promise<void> {
        const { error } = await this.supabase.functions.invoke('send-push', {
            body: { userId, payload }
        });
        if (error) throw error;
    }
}
