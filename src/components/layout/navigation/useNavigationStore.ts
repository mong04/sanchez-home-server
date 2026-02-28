/**
 * useNavigationStore.ts — Zustand store for all navigation UI state.
 * Persists sidebar collapsed state to localStorage across sessions.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface NavigationState {
    /** Whether the desktop sidebar is collapsed to icon-only mode */
    isSidebarCollapsed: boolean;
    /** Whether the mobile "More" bottom sheet drawer is open */
    isMobileDrawerOpen: boolean;
    /** Whether the global command palette (⌘K) is open */
    isCommandPaletteOpen: boolean;
}

interface NavigationActions {
    toggleSidebar: () => void;
    setSidebarCollapsed: (collapsed: boolean) => void;
    openMobileDrawer: () => void;
    closeMobileDrawer: () => void;
    openCommandPalette: () => void;
    closeCommandPalette: () => void;
    toggleCommandPalette: () => void;
}

type NavigationStore = NavigationState & NavigationActions;

export const useNavigationStore = create<NavigationStore>()(
    persist(
        (set) => ({
            // Initial state — sidebar expanded by default (user preference then takes over)
            isSidebarCollapsed: false,
            isMobileDrawerOpen: false,
            isCommandPaletteOpen: false,

            toggleSidebar: () =>
                set(state => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),

            setSidebarCollapsed: (collapsed: boolean) =>
                set({ isSidebarCollapsed: collapsed }),

            openMobileDrawer: () => set({ isMobileDrawerOpen: true }),
            closeMobileDrawer: () => set({ isMobileDrawerOpen: false }),

            openCommandPalette: () => set({ isCommandPaletteOpen: true }),
            closeCommandPalette: () => set({ isCommandPaletteOpen: false }),
            toggleCommandPalette: () =>
                set(state => ({ isCommandPaletteOpen: !state.isCommandPaletteOpen })),
        }),
        {
            name: 'sfos-navigation',
            // Only persist the collapsed preference — transient overlay states should not persist
            partialize: (state) => ({
                isSidebarCollapsed: state.isSidebarCollapsed,
            }),
        }
    )
);
