// src/lib/backend/pocketbase.ts
// PocketBaseAdapter — wraps existing PocketBase SDK calls into the BackendAdapter interface.
// Most of this code already existed across hooks — this centralizes it.

import PocketBase from 'pocketbase';
import type { BackendAdapter, User, ExportDump, ImportResult, PushPayload } from './types';
import { COLLECTIONS } from './collections';

export class PocketBaseAdapter implements BackendAdapter {
    private pb: PocketBase;

    constructor(url: string, authToken?: string) {
        this.pb = new PocketBase(url);
        this.pb.autoCancellation(true);
        if (authToken) {
            this.pb.authStore.save(authToken, null);
        }
    }

    // ─── Auth ─────────────────────────────────────────────────────
    async initializeAuth() {
        return {
            user: this.getCurrentUser(),
            token: this.getToken()
        };
    }

    async signIn(email: string, password: string) {
        const result = await this.pb.collection(COLLECTIONS.USERS).authWithPassword(email, password);
        return {
            user: this.mapUser(result.record),
            token: this.pb.authStore.token,
        };
    }

    async signOut() {
        this.pb.authStore.clear();
    }

    getCurrentUser(): User | null {
        if (!this.pb.authStore.isValid) return null;
        return this.mapUser(this.pb.authStore.model);
    }

    getToken(): string | null {
        return this.pb.authStore.token;
    }

    onAuthStateChange(callback: (user: User | null) => void) {
        return this.pb.authStore.onChange(() => {
            callback(this.getCurrentUser());
        });
    }

    // ─── CRUD ─────────────────────────────────────────────────────
    async getOne<T>(collection: string, id: string, options?: { expand?: string }) {
        return await this.pb.collection(collection).getOne<T>(id, {
            expand: options?.expand,
        });
    }

    async getList<T>(collection: string, options?: {
        filter?: string; sort?: string; page?: number; perPage?: number; expand?: string;
    }) {
        const result = await this.pb.collection(collection).getList<T>(
            options?.page ?? 1,
            options?.perPage ?? 50,
            { filter: options?.filter, sort: options?.sort, expand: options?.expand }
        );
        return { items: result.items, total: result.totalItems };
    }

    async getFullList<T>(collection: string, options?: {
        filter?: string; sort?: string; expand?: string;
    }) {
        return await this.pb.collection(collection).getFullList<T>({
            filter: options?.filter,
            sort: options?.sort,
            expand: options?.expand,
        });
    }

    async create<T>(collection: string, data: Partial<T>) {
        return await this.pb.collection(collection).create<T>(data as any);
    }

    async update<T>(collection: string, id: string, data: Partial<T>) {
        return await this.pb.collection(collection).update<T>(id, data as any);
    }

    async delete(collection: string, id: string) {
        await this.pb.collection(collection).delete(id);
    }

    // ─── Realtime ─────────────────────────────────────────────────
    subscribe(
        collection: string,
        recordId: string | null,
        callback: (event: 'create' | 'update' | 'delete', record: any) => void
    ) {
        const topic = recordId ?? '*';
        this.pb.collection(collection).subscribe(topic, (e) => {
            callback(e.action as 'create' | 'update' | 'delete', e.record);
        });
        return () => { this.pb.collection(collection).unsubscribe(topic); };
    }

    // ─── Storage ──────────────────────────────────────────────────
    async uploadFile(collection: string, recordId: string, file: File, field: string) {
        const formData = new FormData();
        formData.append(field, file);
        const record = await this.pb.collection(collection).update(recordId, formData);
        return record[field];
    }

    getFileUrl(collection: string, recordId: string, filename: string) {
        return this.pb.files.getURL(
            { id: recordId, collectionId: collection, collectionName: collection } as any,
            filename
        );
    }

    // ─── Migration ────────────────────────────────────────────────
    async exportAll(): Promise<ExportDump> {
        const dump: ExportDump = {
            version: '1.0',
            timestamp: new Date().toISOString(),
            collections: {},
            files: {},
        };
        for (const coll of Object.values(COLLECTIONS)) {
            try {
                const records = await this.pb.collection(coll).getFullList();
                dump.collections[coll] = records;
            } catch {
                dump.collections[coll] = [];
            }
        }
        return dump;
    }

    async importAll(dump: ExportDump): Promise<ImportResult> {
        let recordsImported = 0;
        const errors: string[] = [];

        for (const [coll, records] of Object.entries(dump.collections)) {
            for (const record of records) {
                try {
                    const { id, created, updated, collectionId, collectionName, ...data } = record;
                    await this.pb.collection(coll).create(data);
                    recordsImported++;
                } catch (err: any) {
                    errors.push(`${coll}/${record.id}: ${err.message}`);
                }
            }
        }

        return { success: errors.length === 0, recordsImported, errors };
    }

    // ─── Helpers ──────────────────────────────────────────────────
    private mapUser(record: any): User {
        return {
            id: record.id,
            email: record.email,
            username: record.username,
            name: record.name ?? record.username ?? '',
            avatar: record.avatar,
            partykit_id: record.partykit_id,
            role: record.role ?? 'member',
        };
    }

    async requestPasswordReset(email: string): Promise<void> {
        await this.pb.collection(COLLECTIONS.USERS).requestPasswordReset(email);
    }

    async sendPush(userId: string, payload: PushPayload): Promise<void> {
        // Point to the signaling/push sidecar on port 4444
        const pushServerUrl = this.pb.baseUrl.replace(':8090', ':4444');
        console.log(`📡 [Push] Sending to ${userId} via ${pushServerUrl}`, payload);
        const response = await fetch(`${pushServerUrl}/api/sfos/send-push`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': this.pb.authStore.token
            },
            body: JSON.stringify({ userId, payload })
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(`Failed to send push: ${err.message || response.statusText}`);
        }
    }
}
