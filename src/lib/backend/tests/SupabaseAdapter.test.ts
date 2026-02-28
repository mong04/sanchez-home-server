// src/lib/backend/tests/SupabaseAdapter.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SupabaseAdapter } from '../supabase';

// Mock Supabase
vi.mock('@supabase/supabase-js', () => {
    const mockSupabase = {
        auth: {
            getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
            signInWithPassword: vi.fn().mockResolvedValue({
                data: { user: { id: 'sb_1', email: 'test@example.com', user_metadata: { name: 'SB User' } }, session: { access_token: 'sb_token' } },
                error: null
            }),
            signOut: vi.fn().mockResolvedValue({ error: null }),
            getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'sb_1' } }, error: null }),
            onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
            resetPasswordForEmail: vi.fn().mockResolvedValue({ error: null }),
        },
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: 'sb_rec_1' }, error: null }),
        match: vi.fn().mockReturnThis(),
        storage: {
            from: vi.fn().mockReturnThis(),
            upload: vi.fn().mockResolvedValue({ data: { path: 'path' }, error: null }),
            getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'http://example.com/file' } }),
        },
        channel: vi.fn().mockReturnThis(),
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockReturnThis(),
    };

    return {
        createClient: vi.fn().mockReturnValue(mockSupabase),
        SupabaseClient: vi.fn()
    };
});

describe('SupabaseAdapter', () => {
    let adapter: SupabaseAdapter;

    beforeEach(() => {
        vi.clearAllMocks();
        adapter = new SupabaseAdapter('http://example.supabase.co', 'mock_key');
    });

    it('should sign in successfully', async () => {
        const result = await adapter.signIn('test@example.com', 'password');
        expect(result.user.id).toBe('sb_1');
        expect(result.token).toBe('sb_token');
    });

    it('should fetch one record', async () => {
        const result = await adapter.getOne('transactions', 'sb_rec_1');
        expect(result).toBeDefined();
        expect((result as any).id).toBe('sb_rec_1');
    });

    it('should handle exportAll', async () => {
        const dump = await adapter.exportAll();
        expect(dump.version).toBe('1.0');
        expect(dump.collections).toBeDefined();
    });
});
