// src/lib/backend/supabase.ts
// SupabaseAdapter — wraps Supabase JS SDK into the BackendAdapter interface.
// Enables "start on free Supabase cloud, migrate to self-hosted PocketBase later" workflow.

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { BackendAdapter, User, ExportDump, ImportResult, PushPayload } from './types';
import { COLLECTIONS } from './collections';
import { FIELD_MAP, REVERSE_FIELD_MAP } from './field-map';

export class SupabaseAdapter implements BackendAdapter {
    private supabase: SupabaseClient;
    private currentToken: string | null = null;
    private currentUser: User | null = null;

    constructor(url: string, anonKey: string, authToken?: string) {
        this.supabase = createClient(url, anonKey, {
            auth: {
                autoRefreshToken: true,
                persistSession: true,
                detectSessionInUrl: false,
            }
        });

        // Restore session from localStorage on init (critical for refresh persistence)
        if (!authToken) {
            this.supabase.auth.getSession().then(({ data: { session } }) => {
                if (session) {
                    this.supabase.auth.setSession(session);
                }
            });
        } else {
            this.supabase.auth.setSession({ access_token: authToken, refresh_token: '' });
        }
    }

    async initializeAuth() {
        // Explicitly await the initial session fetch to resolve race conditions
        const { data, error } = await this.supabase.auth.getSession();
        if (error) {
            console.error('[SupabaseAdapter] Failed to initialize session:', error);
            this.currentToken = null;
            this.currentUser = null;
        } else {
            this.currentToken = data.session?.access_token ?? null;
            this.currentUser = data.session?.user ? await this.fetchUserProfile(data.session.user) : null;
        }
        return {
            user: this.currentUser,
            token: this.currentToken
        };
    }

    getToken(): string | null {
        return this.currentToken;
    }

    // ─── Auth ─────────────────────────────────────────────────────
    async signIn(email: string, password: string) {
        const { data, error } = await this.supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        this.currentToken = data.session.access_token;
        this.currentUser = await this.fetchUserProfile(data.user);
        return {
            user: this.currentUser,
            token: this.currentToken,
        };
    }

    async signOut() {
        try {
            await this.supabase.auth.signOut();
        } catch (error) {
            console.error('[SupabaseAdapter] Failed to sign out from server, clearing local session anyway:', error);
        } finally {
            this.currentToken = null;
            this.currentUser = null;
        }
    }

    getCurrentUser(): User | null {
        return this.currentUser;
    }

    onAuthStateChange(callback: (user: User | null) => void) {
        const { data: { subscription } } = this.supabase.auth.onAuthStateChange(
            async (_event, session) => {
                this.currentToken = session?.access_token ?? null;
                this.currentUser = session ? await this.fetchUserProfile(session.user) : null;
                callback(this.currentUser);
            }
        );
        return () => subscription.unsubscribe();
    }

    // ─── CRUD ─────────────────────────────────────────────────────
    private buildSelect(expand?: string): string {
        if (!expand) return '*';

        const relations = expand.split(',')
            .map(r => r.trim())
            .filter(Boolean)
            .map(r => {
                const dbName = FIELD_MAP[r] || r;
                return `${dbName}(*)`;
            });

        return `*, ${relations.join(', ')}`;
    }

    private applyFilter(query: any, filterStr: string) {
        if (!filterStr) return query;
        // e.g., 'account = "abc" && cleared = true'
        const parts = filterStr.split('&&').map(p => p.trim()).filter(Boolean);
        for (const part of parts) {
            const match = part.match(/^([\w]+)\s*(=|!=|>|<|>=|<=)\s*(.*)$/);
            if (match) {
                const [, key, op, valStr] = match;
                const dbKey = FIELD_MAP[key] || key;
                let value: any = valStr;

                // remove surrounding quotes
                if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
                else if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
                else if (value === 'true') value = true;
                else if (value === 'false') value = false;
                else if (value === 'null') value = null;
                else if (!isNaN(Number(value))) value = Number(value);

                if (op === '=') query = query.eq(dbKey, value);
                else if (op === '!=') query = query.neq(dbKey, value);
                else if (op === '>') query = query.gt(dbKey, value);
                else if (op === '<') query = query.lt(dbKey, value);
                else if (op === '>=') query = query.gte(dbKey, value);
                else if (op === '<=') query = query.lte(dbKey, value);
            }
        }
        return query;
    }

    async getOne<T>(collection: string, id: string, options?: { expand?: string }) {
        const selectStr = this.buildSelect(options?.expand);
        const query = this.supabase.from(collection).select(selectStr).eq('id', id).single();
        const { data, error } = await query;
        if (error) throw error;
        return this.toFrontend(data, collection) as T;
    }

    async getList<T>(collection: string, options?: {
        filter?: string; sort?: string; page?: number; perPage?: number; expand?: string;
    }) {
        const page = options?.page ?? 1;
        const perPage = options?.perPage ?? 50;
        const from = (page - 1) * perPage;
        const to = from + perPage - 1;

        const selectStr = this.buildSelect(options?.expand);
        let query = this.supabase
            .from(collection)
            .select(selectStr, { count: 'exact' })
            .range(from, to);

        if (options?.filter) {
            query = this.applyFilter(query, options.filter);
        }

        if (options?.sort) {
            const desc = options.sort.startsWith('-');
            const col = desc ? options.sort.slice(1) : options.sort;
            query = query.order(col, { ascending: !desc });
        }

        const { data, count, error } = await query;
        if (error) throw error;

        const mappedItems = (data ?? []).map(item => this.toFrontend(item, collection));
        return { items: mappedItems as T[], total: count ?? 0 };
    }

    async getFullList<T>(collection: string, options?: {
        filter?: string; sort?: string; expand?: string;
    }) {
        const selectStr = this.buildSelect(options?.expand);
        let query = this.supabase.from(collection).select(selectStr);

        if (options?.filter) {
            query = this.applyFilter(query, options.filter);
        }

        if (options?.sort) {
            const desc = options.sort.startsWith('-');
            const col = desc ? options.sort.slice(1) : options.sort;
            query = query.order(col, { ascending: !desc });
        }

        const { data, error } = await query;
        if (error) throw error;
        return (data ?? []).map(item => this.toFrontend(item, collection)) as T[];
    }

    // Helper to match PocketBase's 15-char string IDs just in case frontend relies on it
    private generateId(): string {
        return Array.from(crypto.getRandomValues(new Uint8Array(15)))
            .map((b) => "abcdefghijklmnopqrstuvwxyz0123456789"[b % 36])
            .join("");
    }

    // Helper to map camelCase (frontend) to lowercase (database)
    private toSupabase(obj: any): any {
        if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj;
        const result: any = {};
        for (let [key, value] of Object.entries(obj)) {
            if (key === 'needsReview' || key === 'reviewNote') {
                continue; // Handled below
            }
            const mappedKey = FIELD_MAP[key] || key;

            // Avatar is a TEXT column in Postgres, but an object in frontend. Must stringify for save.
            if (mappedKey === 'avatar' && value && typeof value === 'object') {
                result[mappedKey] = JSON.stringify(value);
            } else {
                result[mappedKey] = value;
            }
        }

        // Priority #4: Collaborative Workflows
        // Pack needsReview & reviewNote into the tags array to avoid schema breaks
        if ('needsReview' in obj || 'reviewNote' in obj) {
            const tags = Array.isArray(obj.tags) ? [...obj.tags] : [];
            const cleanTags = tags.filter((t: any) => typeof t !== 'string' || !t.startsWith('{"__vReview"'));
            if (obj.needsReview) {
                cleanTags.push(JSON.stringify({ __vReview: true, note: obj.reviewNote || '' }));
            }
            result.tags = cleanTags;
        }

        return result;
    }

    // Helper to map lowercase (database) to camelCase (frontend) and extract relations into `expand`
    private toFrontend(obj: any, collectionName?: string): any {
        if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj;
        const result: any = {};
        const expand: any = {};
        let hasExpand = false;

        const numericFields = ['amount', 'initialBalance', 'income', 'rollover', 'expirationTime'];

        for (const [key, value] of Object.entries(obj)) {
            const mappedKey = REVERSE_FIELD_MAP[key] || key;

            // If the value is an object with an 'id', it's an expanded relation from Supabase
            if (value && typeof value === 'object' && !Array.isArray(value) && 'id' in value) {
                // Try to infer the collection name by pluralizing the mapped key
                const relCollection = collectionName ? `${mappedKey}s` : undefined;
                expand[mappedKey] = this.toFrontend(value, relCollection);
                // Crucial: we must retain the scalar ID on the root object to match PocketBase behavior!
                result[mappedKey] = value.id;
                hasExpand = true;
            } else {
                let finalValue = value;

                // Auto-parse stringified JSON coming from TEXT columns (like avatar)
                if (typeof value === 'string' && (value.startsWith('{') || value.startsWith('['))) {
                    try {
                        finalValue = JSON.parse(value);
                    } catch (_) { /* ignore invalid JSON, keep as string */ }
                }

                result[mappedKey] = numericFields.includes(mappedKey) && finalValue !== null ? Number(finalValue) : finalValue;

                // Priority #4: Unpack Collaborative Workflows tracking from tags
                if (mappedKey === 'tags' && Array.isArray(finalValue)) {
                    const reviewIdx = finalValue.findIndex((t: any) => typeof t === 'string' && t.startsWith('{"__vReview"'));
                    if (reviewIdx !== -1) {
                        try {
                            const parsed = JSON.parse(finalValue[reviewIdx]);
                            result.needsReview = !!parsed.__vReview;
                            result.reviewNote = parsed.note || '';
                            finalValue.splice(reviewIdx, 1);
                        } catch (e) { /* ignore */ }
                    }
                }
            }
        }

        if (hasExpand) {
            result.expand = expand;
        }

        if (collectionName) {
            result.collectionName = collectionName;
            result.collectionId = `mock-${collectionName}`;
        }

        return result;
    }

    async create<T>(collection: string, data: Partial<T>) {
        const payload: any = { ...data };
        // Auto-generate ID if missing to mimic PocketBase behavior
        if (!payload.id) {
            payload.id = this.generateId();
        }

        const mappedPayload = this.toSupabase(payload);

        const { data: result, error } = await this.supabase.from(collection).insert(mappedPayload).select().single();
        if (error) {
            console.error(`❌ [SupabaseAdapter] Failed to create in ${collection}:`, error, 'Payload:', mappedPayload);
            throw error;
        }
        return this.toFrontend(result, collection) as T;
    }

    async update<T>(collection: string, id: string, data: Partial<T>) {
        const mappedPayload = this.toSupabase(data);

        // Special case: If updating the current user's profile, also sync core fields to Auth Metadata cache
        // to ensure immediate availability in mapUser fallbacks if public table is restricted/missing.
        if (collection === 'users' && id === this.currentUser?.id) {
            try {
                const metadataUpdates: any = {};
                if ('partykit_id' in mappedPayload) metadataUpdates.partykit_id = mappedPayload.partykit_id;
                if ('name' in mappedPayload) metadataUpdates.name = mappedPayload.name;
                if ('role' in mappedPayload) metadataUpdates.role = mappedPayload.role;
                if ('avatar' in mappedPayload) metadataUpdates.avatar = mappedPayload.avatar;

                if (Object.keys(metadataUpdates).length > 0) {
                    await this.supabase.auth.updateUser({ data: metadataUpdates });
                }
            } catch (e) {
                console.warn('[SupabaseAdapter] Failed to sync auth metadata', e);
            }
        }

        const { data: result, error } = await this.supabase
            .from(collection)
            .update(mappedPayload)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            // Handle missing row due to missing migration or manual created auth users not triggering INSERT.
            if (error.code === 'PGRST116' && collection === 'users' && this.currentUser && id === this.currentUser.id) {
                console.warn(`[SupabaseAdapter] Row missing in ${collection} for ID ${id}. Upserting instead.`);
                // If the user's row was never created (migration flaw), seed it with minimum requirements
                const upsertPayload = {
                    id,
                    email: this.currentUser.email,
                    name: this.currentUser.name || '',
                    role: this.currentUser.role || 'partner',
                    ...mappedPayload
                };
                const { data: upsertResult, error: upsertError } = await this.supabase
                    .from(collection)
                    .upsert(upsertPayload)
                    .select()
                    .single();

                if (upsertError) throw upsertError;
                return this.toFrontend(upsertResult, collection) as T;
            }
            throw error;
        }

        return this.toFrontend(result, collection) as T;
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
    private async fetchUserProfile(authUser: any): Promise<User> {
        const basicUser = this.mapUser(authUser);
        if (!authUser?.id) return basicUser;

        try {
            const { data, error } = await this.supabase
                .from('users')
                .select('*')
                .eq('id', authUser.id)
                .single();

            if (error) {
                console.warn('[SupabaseAdapter] Could not fetch public profile for', authUser.id, error.message);
                return basicUser;
            }

            const profile = this.toFrontend(data, 'users');
            return {
                ...basicUser,
                ...profile,
                id: basicUser.id
            };
        } catch (err) {
            console.error('[SupabaseAdapter] Profile fetch error:', err);
            return basicUser;
        }
    }

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
