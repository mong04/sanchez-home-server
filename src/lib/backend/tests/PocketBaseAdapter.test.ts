// src/lib/backend/tests/PocketBaseAdapter.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PocketBaseAdapter } from '../pocketbase';

// Mock PocketBase
vi.mock('pocketbase', () => {
    let mockToken = 'mock_token';
    class MockPocketBase {
        authStore = {
            model: { id: 'user_1', email: 'test@example.com', name: 'Test User' },
            get token() { return mockToken; },
            isValid: true,
            clear: vi.fn(),
            onChange: vi.fn(() => vi.fn()),
        };
        autoCancellation = vi.fn().mockReturnThis();
        collection = vi.fn().mockReturnThis();
        authWithPassword = vi.fn().mockImplementation(async () => {
            mockToken = 'new_token';
            return { record: { id: 'user_1', email: 'test@example.com' }, token: 'new_token' };
        });
        getOne = vi.fn().mockResolvedValue({ id: 'rec_1', name: 'Item 1' });
        getList = vi.fn().mockResolvedValue({ items: [{ id: 'rec_1' }], totalItems: 1 });
        getFullList = vi.fn().mockResolvedValue([{ id: 'rec_1' }]);
        create = vi.fn().mockResolvedValue({ id: 'new_1' });
        update = vi.fn().mockResolvedValue({ id: 'upd_1' });
        delete = vi.fn().mockResolvedValue(true);
        subscribe = vi.fn().mockResolvedValue(vi.fn());
    }
    return { default: MockPocketBase };
});

describe('PocketBaseAdapter', () => {
    let adapter: PocketBaseAdapter;

    beforeEach(() => {
        vi.clearAllMocks();
        adapter = new PocketBaseAdapter('http://localhost:8090');
    });

    it('should sign in successfully', async () => {
        const result = await adapter.signIn('test@example.com', 'password');
        expect(result.user.id).toBe('user_1');
        expect(result.token).toBe('new_token');
    });

    it('should get current user from store', () => {
        const user = adapter.getCurrentUser();
        expect(user?.id).toBe('user_1');
    });

    it('should fetch a list of items', async () => {
        const result = await adapter.getList('transactions');
        expect(result.items).toHaveLength(1);
        expect(result.total).toBe(1);
    });

    it('should create a record', async () => {
        const data = { amount: 100 };
        const result = await adapter.create<any>('transactions', data);
        expect(result.id).toBe('new_1');
    });

    it('should handle exportAll', async () => {
        const dump = await adapter.exportAll();
        expect(dump.version).toBe('1.0');
        expect(dump.collections).toBeDefined();
    });
});
