// src/lib/backend/supabase.ts
// SupabaseAdapter — wraps Supabase JS SDK into the BackendAdapter interface.
// Enables "start on free Supabase cloud, migrate to self-hosted PocketBase later" workflow.

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { BackendAdapter, User, ExportDump, ImportResult } from './types';

export class SupabaseAdapter implements BackendAdapter {
    private supabase: SupabaseClient;

    constructor(url: string, anonKey: string, _authToken?: string) {
        this.supabase = createClient(url, anonKey);
    }

    // ─── Auth ─────────────────────────────────────────────────────
    async signIn(email: string, password: string) {
        const { data, error } = await this.supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        return {
            user: this.mapUser(data.user),
            token: data.session.access_token,
        };
    }

    async signOut() {
        await this.supabase.auth.signOut();
    }

    getCurrentUser(): User | null {
        // Synchronous check — Supabase stores session locally
        // In practice, use the onAuthStateChange listener for reactivity
        return null;
    }

    onAuthStateChange(callback: (user: User | null) => void) {
        const { data: { subscription } } = this.supabase.auth.onAuthStateChange(
            (_event, session) => {
                callback(session ? this.mapUser(session.user) : null);
            }
        );
        return () => subscription.unsubscribe();
    }

    // ─── CRUD ─────────────────────────────────────────────────────
    async getOne<T>(collection: string, id: string, options?: { expand?: string }) {
        const query = this.supabase.from(collection).select(options?.expand ?? '*').eq('id', id).single();
        const { data, error } = await query;
        if (error) throw error;
        return data as T;
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
        return { items: (data ?? []) as T[], total: count ?? 0 };
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
        return (data ?? []) as T[];
    }

    async create<T>(collection: string, data: Partial<T>) {
        const { data: result, error } = await this.supabase.from(collection).insert(data).select().single();
        if (error) throw error;
        return result as T;
    }

    async update<T>(collection: string, id: string, data: Partial<T>) {
        const { data: result, error } = await this.supabase.from(collection).update(data).eq('id', id).select().single();
        if (error) throw error;
        return result as T;
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
        const tables = [
            'users', 'accounts', 'transactions', 'categories',
            'budget_months', 'budget_allocations', 'chores', 'chore_assignments',
            'calendar_events', 'shopping_items', 'wellness_logs', 'infinity_log', 'messages',
        ];
        for (const table of tables) {
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
            role: user.user_metadata?.role ?? 'member',
        };
    }
}
