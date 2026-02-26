// src/lib/backend/index.ts
// Re-exports for the backend abstraction layer.
// Import from 'src/lib/backend' for all adapter types and implementations.

export type { BackendAdapter, User, ExportDump, ImportResult, BackendType, BackendConfig } from './types';
export { PocketBaseAdapter } from './pocketbase';
export { SupabaseAdapter } from './supabase';
