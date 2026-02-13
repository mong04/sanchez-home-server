import { render, screen, waitFor } from '@testing-library/react';
import { createMemoryRouter, RouterProvider, Navigate } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';

// Create shared Yjs mocks using vi.hoisted
const { testDoc, testChores, testBills, testInfinityLog, testCalendar, testWellness, testMessages, testShoppingList, testUsers } = vi.hoisted(() => {
    const Y = require('yjs');
    const doc = new Y.Doc();
    return {
        testDoc: doc,
        testChores: doc.getArray('chores'),
        testBills: doc.getArray('bills'),
        testInfinityLog: doc.getArray('infinityLog'),
        testCalendar: doc.getArray('calendar'),
        testWellness: doc.getArray('wellness'),
        testMessages: doc.getArray('messages'),
        testShoppingList: doc.getArray('shoppingList'),
        testUsers: doc.getMap('users'),
    };
});

// Mock the Yjs provider
vi.mock('../src/lib/yjs-provider', () => ({
    doc: testDoc,
    chores: testChores,
    bills: testBills,
    infinityLog: testInfinityLog,
    calendar: testCalendar,
    wellness: testWellness,
    messages: testMessages,
    shoppingList: testShoppingList,
    users: testUsers,
    persistence: null,
    provider: { on: vi.fn(), off: vi.fn(), disconnect: vi.fn(), connect: vi.fn() },
    getProvider: vi.fn(() => null),
    updateProviderToken: vi.fn(),
}));

// Mock AuthContext
const mockUser = {
    id: 'test-user-id',
    name: 'Test User',
    role: 'parent' as const,
    avatar: { type: 'emoji' as const, value: '👤' },
};

vi.mock('../src/context/AuthContext', () => ({
    AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
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

// Mock ThemeContext
vi.mock('../src/context/ThemeContext', () => ({
    ThemeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    useTheme: vi.fn(() => ({ theme: 'dark', setTheme: vi.fn() })),
}));

// Stub components to avoid deep Yjs/hook dependencies during route tests
function StubCommandCenter() { return <div data-testid="route-command-center">Command Center Module</div>; }
function StubPlanner() { return <div data-testid="route-planner">Planner Module</div>; }
function StubWellness() { return <div data-testid="route-wellness">Wellness Module</div>; }
function StubMessenger() { return <div data-testid="route-messenger">Messenger Module</div>; }
function StubInfinityLog() { return <div data-testid="route-infinity-log">Infinity Log Module</div>; }
function StubOrganizer() { return <div data-testid="route-organizer">Organizer Module</div>; }
function StubAdmin() { return <div data-testid="route-admin">Admin Module</div>; }
function StubProfile() { return <div data-testid="route-profile">Profile Module</div>; }

// Use AppLayout with stubbed children to test NavLink routing
import { AppLayout } from '../src/components/layout/AppLayout';

// Define test routes using stubs for fast, focused route resolution tests
const testRoutes = [
    {
        path: '/',
        element: <AppLayout />,
        children: [
            { index: true, element: <StubCommandCenter /> },
            { path: 'planner', element: <StubPlanner /> },
            { path: 'wellness', element: <StubWellness /> },
            { path: 'organizer', element: <StubOrganizer /> },
            { path: 'messenger', element: <StubMessenger /> },
            { path: 'profile', element: <StubProfile /> },
            { path: 'infinity-log', element: <StubInfinityLog /> },
            { path: 'admin', element: <StubAdmin /> },
            { path: '*', element: <Navigate to="/" replace /> },
        ],
    },
];

// Helper to render routes at a specific path
function renderAtRoute(initialPath: string) {
    const testRouter = createMemoryRouter(testRoutes, {
        initialEntries: [initialPath],
    });

    return render(<RouterProvider router={testRouter} />);
}

describe('Client-Side Routing', () => {
    it('renders Command Center at root /', async () => {
        renderAtRoute('/');

        await waitFor(() => {
            expect(screen.getByTestId('route-command-center')).toBeInTheDocument();
        });
    });

    it('renders Smart Planner at /planner', async () => {
        renderAtRoute('/planner');

        await waitFor(() => {
            expect(screen.getByTestId('route-planner')).toBeInTheDocument();
        });
    });

    it('renders Messenger at /messenger', async () => {
        renderAtRoute('/messenger');

        await waitFor(() => {
            expect(screen.getByTestId('route-messenger')).toBeInTheDocument();
        });
    });

    it('renders Wellness at /wellness', async () => {
        renderAtRoute('/wellness');

        await waitFor(() => {
            expect(screen.getByTestId('route-wellness')).toBeInTheDocument();
        });
    });

    it('renders Organizer at /organizer', async () => {
        renderAtRoute('/organizer');

        await waitFor(() => {
            expect(screen.getByTestId('route-organizer')).toBeInTheDocument();
        });
    });

    it('renders Infinity Log at /infinity-log', async () => {
        renderAtRoute('/infinity-log');

        await waitFor(() => {
            expect(screen.getByTestId('route-infinity-log')).toBeInTheDocument();
        });
    });

    it('renders Profile at /profile', async () => {
        renderAtRoute('/profile');

        await waitFor(() => {
            expect(screen.getByTestId('route-profile')).toBeInTheDocument();
        });
    });

    it('renders Admin Dashboard at /admin for parent role', async () => {
        renderAtRoute('/admin');

        await waitFor(() => {
            expect(screen.getByTestId('route-admin')).toBeInTheDocument();
        });
    });

    it('redirects unknown routes to / (404 fallback)', async () => {
        renderAtRoute('/nonexistent-page');

        await waitFor(() => {
            // Should redirect to Command Center (the index route)
            expect(screen.getByTestId('route-command-center')).toBeInTheDocument();
        });
    });

    it('sidebar shows active nav item based on current route', async () => {
        renderAtRoute('/planner');

        await waitFor(() => {
            // The Planner NavLink in the sidebar should have the active class
            const plannerLinks = screen.getAllByText('Planner');
            expect(plannerLinks.length).toBeGreaterThan(0);

            // At least one link should be marked as current page
            const activeLink = plannerLinks.find(el =>
                el.closest('a')?.getAttribute('aria-current') === 'page'
            );
            expect(activeLink).toBeTruthy();
        });
    });
});
