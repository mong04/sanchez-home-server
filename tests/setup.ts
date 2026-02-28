import '@testing-library/jest-dom'
import 'fake-indexeddb/auto'
import { toHaveNoViolations } from 'jest-axe'
import * as matchers from '@testing-library/jest-dom/matchers'
import { expect } from 'vitest'

expect.extend(toHaveNoViolations)
// expect.extend(matchers) // @testing-library/jest-dom usually extends automatically if imported

import { vi } from 'vitest'
import React from 'react'

const mockUser = {
    id: 'setup-user-id',
    name: 'Setup User',
    role: 'parent' as const,
    avatar: { type: 'emoji' as const, value: '👤' },
};

vi.mock('../src/context/AuthContext', () => ({
    AuthProvider: ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, null, children),
    useAuth: vi.fn(() => ({
        isAuthenticated: true,
        user: mockUser,
        token: 'mock-token',
        profiles: [],
        login: vi.fn(),
        logout: vi.fn(),
        selectProfile: vi.fn(),
        createProfile: vi.fn(),
        updateProfile: vi.fn(),
        fetchProfiles: vi.fn(),
        passkeySupported: false,
        hasPasskeys: false,
        registerPasskey: vi.fn(),
        loginWithPasskey: vi.fn(),
    })),
}));

vi.mock('../src/providers/BackendProvider', () => ({
    BackendProvider: ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, null, children),
    getBackendAdapter: vi.fn(() => ({
        sendPush: vi.fn(() => Promise.resolve()),
        getCurrentUser: vi.fn(() => mockUser),
    })),
    useBackend: vi.fn(() => ({
        adapter: {
            sendPush: vi.fn(() => Promise.resolve()),
            getCurrentUser: vi.fn(() => mockUser),
        },
        backendType: 'pocketbase',
        switchBackend: vi.fn(),
    })),
}));

