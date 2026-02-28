# Phase 11.5 — Backend Abstraction & Migration Wizard
**Version:** 1.1 (February 27, 2026)  
**Status Audit (Post-Expert Review):**
- [x] Missing Wizard UI (`src/components/admin/MigrationWizard.tsx`) → ✅ Fixed
- [x] Zero Unit Tests for Adapters → ✅ Fixed
- [x] Semantic Token Violations (`NewMonthModal.tsx`) → ✅ Fixed
- [x] Hardcoded Table Lists (Bility/Future-proofing) → ✅ Fixed
- [x] Documentation Inconsistency (`VITE_SUPABASE_ANON_KEY` naming) → ✅ Fixed

---

**Version:** 1.0 (February 25, 2026)  
**Source:** Expert Consultation Blueprint (Zero-Questions Edition)  
**Deadline:** April 15, 2026 (2–3 weeks after Budget Engine ships)  
**Priority:** Highest-priority new work after Phase 11 Budget Engine completes

---

## Purpose

Remove the hardware barrier forever while preserving the privacy moat. Families start on free Supabase cloud in <90 seconds. Later they migrate to self-hosted PocketBase in <10 minutes with zero data loss. This makes SFOS adoptable by **any family today**.

**New differentiator:** True "start hosted, migrate self-hosted later" with full data portability. No other family app offers this.

---

## 1. Core Architecture — Ports & Adapters (Hexagonal Lite)

Create a new folder: `src/lib/backend/`

### BackendAdapter Interface

This is the single contract that all backend implementations must satisfy:

```ts
// src/lib/backend/types.ts

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
```

---

## 2. PocketBaseAdapter Implementation

Wraps the existing PocketBase SDK. Most of this code already exists across our hooks — this centralizes it.

```ts
// src/lib/backend/pocketbase.ts
import PocketBase from 'pocketbase';
import type { BackendAdapter, User, ExportDump, ImportResult } from './types';

const COLLECTIONS = [
  'users',
  'accounts',
  'transactions',
  'categories',
  'budget_months',
  'budget_allocations',
  'chores',
  'chore_assignments',
  'calendar_events',
  'shopping_items',
  'wellness_logs',
  'infinity_log',
  'messages',
] as const;

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
  async signIn(email: string, password: string) {
    const result = await this.pb.collection('users').authWithPassword(email, password);
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
    return this.mapUser(this.pb.authStore.record);
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
    for (const coll of COLLECTIONS) {
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
      name: record.name ?? record.username ?? '',
      avatar: record.avatar,
      role: record.role ?? 'member',
    };
  }
}
```

---

## 3. SupabaseAdapter Implementation

```ts
// src/lib/backend/supabase.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { BackendAdapter, User, ExportDump, ImportResult } from './types';

export class SupabaseAdapter implements BackendAdapter {
  private supabase: SupabaseClient;

  constructor(url: string, anonKey: string, authToken?: string) {
    this.supabase = createClient(url, anonKey);
    if (authToken) {
      this.supabase.auth.setSession({
        access_token: authToken,
        refresh_token: '',
      });
    }
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
    return null; // Will be populated by auth state listener
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
    let query = this.supabase.from(collection).select(options?.expand ?? '*').eq('id', id).single();
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
    // Mirror PocketBaseAdapter.exportAll() — iterate all tables
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
```

---

## 4. BackendProvider & Context

```tsx
// src/providers/BackendProvider.tsx
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { BackendAdapter } from '../lib/backend/types';
import { PocketBaseAdapter } from '../lib/backend/pocketbase';
import { SupabaseAdapter } from '../lib/backend/supabase';

type BackendType = 'pocketbase' | 'supabase';

interface BackendConfig {
  type: BackendType;
  url: string;
  anonKey?: string; // Supabase only
  token?: string;
}

interface BackendContextValue {
  adapter: BackendAdapter;
  backendType: BackendType;
  switchBackend(newConfig: BackendConfig): Promise<void>;
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
    try { return JSON.parse(stored); } catch { /* fall through */ }
  }
  // Default: Supabase (cloud-first onboarding)
  return {
    type: 'supabase',
    url: import.meta.env.VITE_SUPABASE_URL ?? '',
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY ?? '',
  };
}

export function BackendProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<BackendConfig>(getStoredConfig);
  const [adapter, setAdapter] = useState<BackendAdapter>(() => createAdapter(config));

  useEffect(() => {
    setAdapter(createAdapter(config));
    localStorage.setItem('sfos_backend_config', JSON.stringify(config));
  }, [config]);

  const switchBackend = async (newConfig: BackendConfig) => {
    setConfig(newConfig);
    // Force re-auth on next render cycle
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
```

---

## 5. Hooks Migration Strategy (Zero Breaking Changes)

All existing data hooks currently import `pb` directly from `src/lib/pocketbase.ts`. The migration replaces those imports with `useBackend()`.

### Example: useTransactions (before → after)

**Before:**
```ts
import { pb } from '../lib/pocketbase';

export function useTransactions(filters?: { accountId?: string }) {
  return useQuery({
    queryKey: ['transactions', filters],
    queryFn: () => pb.collection('transactions').getFullList({ ... }),
  });
}
```

**After:**
```ts
import { useBackend } from '../providers/BackendProvider';

export function useTransactions(filters?: { accountId?: string }) {
  const { adapter } = useBackend();
  return useQuery({
    queryKey: ['transactions', filters],
    queryFn: () => adapter.getFullList('transactions', { ... }),
  });
}
```

### Hooks to Migrate

All hooks in `src/hooks/` that currently import `pb`:

| Hook File | # of `pb.` calls | Priority |
|-----------|-------------------|----------|
| `useFinanceData.ts` | ~20 (accounts, transactions, categories) | High |
| `useBudgetGridData.ts` | ~5 (budget months, allocations) | High |
| `use-calendar.ts` | ~4 | Medium |
| `use-organizer.ts` | ~8 | Medium |
| `use-messenger.ts` | ~3 | Medium |
| `use-infinity-log.ts` | ~3 | Medium |
| `use-gamification.ts` | ~6 | Medium |
| `use-admin-stats.ts` | ~4 | Low |
| `use-wellness.ts` | ~2 | Low |

Additional files with direct `pb` imports:
- `src/lib/finance/budgetUtils.ts`
- `src/lib/pocketbase.ts` (becomes legacy, kept only as PocketBaseAdapter dependency)
- Various components that call `pb` directly (should be refactored to use hooks)

**Rule:** After migration, `grep -r "from.*pocketbase" src/` should return results **only** in `src/lib/backend/pocketbase.ts`.

---

## 6. Schema Parity Rules (Non-Negotiable)

| Rule | Detail |
|------|--------|
| **Table names** | PocketBase collections = Supabase tables, exact same names |
| **Field names** | Identical across both (e.g., `user_id`, `amount`, `date`) |
| **Field types** | Mapped equivalently (PB `text` = Supabase `text`, PB `number` = Supabase `numeric`, etc.) |
| **Relations** | Same foreign key field names (e.g., `account` → `account_id`) |
| **Files** | Both use signed URLs; store URL in DB, never base64 except during export |
| **Indexes** | Mirror PocketBase indexes in Supabase |
| **Access rules** | PocketBase API rules mirrored as Supabase RLS policies. Ship a migration script for this. |
| **IDs** | Both generate string IDs. During import, new IDs are generated (old IDs stored in a mapping table for relation resolution). |

---

## 7. Migration Wizard UI Flow

Located in: **Admin Dashboard → "Advanced" → "Switch Backend"**

### Screen 1: Welcome
- Headline: "Ready to move to your own server?"
- Subtext: "Keep everything exactly the same — just more private."
- Explainer card: what changes (data location) and what doesn't (app experience)
- Primary button: "Start Migration to PocketBase"
- Secondary: "Cancel"

### Screen 2: Export (30–60 seconds)
- Progress bar with live counts: "Exporting 1,284 transactions…"
- Shows each collection as it completes (checklist animation)
- Download button for `sfos-family-export-[date].json`
- Auto-progresses when export finishes

### Screen 3: Setup Instructions
Copy-paste ready instructions:
```
1. On your mini PC, run:
   docker run -p 8090:8090 pocketbase/pocketbase

2. Open http://YOUR_LOCAL_IP:8090/_/

3. Create new instance (follow setup wizard)

4. Return here and click "Continue"
```
- "Continue" button (enabled after 30-second minimum wait)

### Screen 4: Import
- Text input: PocketBase URL (e.g., `http://192.168.1.100:8090`)
- "Test Connection" button → green checkmark on success
- Drag-drop zone for export file OR auto-upload if URL provided in Step 2
- "Import" button → progress bar: "Importing… This may take 2 minutes"
- Confetti explosion when complete 🎉

### Screen 5: Success
- "You're now running 100% on your own hardware!" 🎉
- One-click "Test Connection" button (verifies read/write)
- Auto-reload → app reconnects to PocketBase
- "Having trouble? Switch back to Cloud" safety valve

**Reverse migration** (PocketBase → Supabase) uses identical wizard with swapped labels.

---

## 8. Yjs & PartyKit — Unchanged

Yjs and PartyKit are **completely independent** of the backend choice. They handle:
- Real-time collaborative editing (budget grid, shopping lists)
- Live presence indicators (peerCount, "Partner is viewing")
- Offline conflict resolution (CRDT)

**No changes needed.** The Yjs layer talks to PartyKit Cloud directly. It does not route through the BackendAdapter.

---

## 9. Testing Plan

### Unit Tests
- Test every `BackendAdapter` method on both `PocketBaseAdapter` and `SupabaseAdapter`
- Mock the underlying SDKs (`PocketBase`, `@supabase/supabase-js`)
- 100% method coverage required

### Integration Tests
- Create a test family on Supabase
- Add test data (accounts, transactions, categories, budget allocations)
- Export via `exportAll()`
- Verify export dump structure
- Import into local PocketBase via `importAll()`
- Verify all records present and correct
- Reverse: export from PocketBase, import into Supabase
- Verify round-trip data integrity

### End-to-End Tests (Playwright)
- Full migration wizard flow: Supabase → PocketBase → verify app works → migrate back
- 100% coverage required before merge
- Test on mobile viewport (wizard must be responsive)

---

## 10. Sprint Timeline (15 Days)

| Day | Work |
|-----|------|
| **Day 1–3** | `BackendAdapter` interface + `PocketBaseAdapter` (most code already exists, just wrapping) |
| **Day 4–7** | `SupabaseAdapter` + realtime normalization (Supabase channels → unified callback) |
| **Day 8–10** | `BackendProvider` + context + migrate all hooks to `useBackend()` |
| **Day 11–14** | Migration Wizard UI (5 screens) + export/import logic |
| **Day 15** | Testing (unit + integration + E2E) + documentation |

### Definition of Done
- [ ] `BackendAdapter` interface finalized and documented
- [ ] `PocketBaseAdapter` passes all unit tests
- [ ] `SupabaseAdapter` passes all unit tests
- [ ] `BackendProvider` wraps the app root
- [ ] All hooks migrated to `useBackend()` (zero direct `pb` imports outside adapter)
- [ ] Migration Wizard UI complete (5 screens, responsive, accessible)
- [ ] Export/import round-trip verified (Supabase → PocketBase → Supabase)
- [ ] Test coverage: 100%
- [ ] Team code review completed
- [ ] `grep -r "from.*pocketbase" src/` returns only `src/lib/backend/pocketbase.ts`

---

## File Structure (Final)

```
src/
├── lib/
│   ├── backend/
│   │   ├── types.ts            ← BackendAdapter interface + ExportDump type
│   │   ├── pocketbase.ts       ← PocketBaseAdapter class
│   │   ├── supabase.ts         ← SupabaseAdapter class
│   │   └── index.ts            ← Re-exports
│   └── pocketbase.ts           ← LEGACY (kept only as PB SDK init, consumed by PocketBaseAdapter)
├── providers/
│   └── BackendProvider.tsx     ← Context + useBackend hook
├── hooks/
│   ├── useFinanceData.ts       ← Refactored: adapter.getFullList() instead of pb.collection()
│   ├── useBudgetGridData.ts    ← Refactored
│   └── ...                     ← All hooks refactored
└── components/
    └── admin/
        └── MigrationWizard.tsx  ← 5-screen wizard component
```
