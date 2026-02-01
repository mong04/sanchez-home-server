import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from '../context/ThemeContext';
import { ThemeToggle } from '../components/common/ThemeToggle';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(), // deprecated
        removeListener: vi.fn(), // deprecated
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
});

describe('Theme System', () => {
    beforeEach(() => {
        // Clear local storage
        localStorage.clear();
        // Reset document class
        document.documentElement.classList.remove('light', 'dark');
    });

    it('renders with default system theme', () => {
        render(
            <ThemeProvider defaultTheme="system">
                <div data-testid="app-root">App</div>
                <ThemeToggle />
            </ThemeProvider>
        );
        // Should not have 'dark' or 'light' class initially if system preference is neutral/mocked
        // But our provider sets it based on system.
        expect(screen.getByTestId('app-root')).toBeTruthy();
    });

    it('toggles theme when button is clicked', () => {
        render(
            <ThemeProvider defaultTheme="light">
                <ThemeToggle />
            </ThemeProvider>
        );

        const button = screen.getByRole('button', { name: /toggle theme/i });
        expect(button).toBeTruthy();

        // Initial state should be light (sun icon visible/active concept)
        // Click to toggle
        fireEvent.click(button);

        // Should be dark
        expect(document.documentElement.classList.contains('dark')).toBe(true);
        expect(localStorage.getItem('vite-ui-theme')).toBe('dark');

        // Click again: light
        fireEvent.click(button);
        expect(document.documentElement.classList.contains('light')).toBe(true);
        expect(localStorage.getItem('vite-ui-theme')).toBe('light');
    });

    it('persists theme preference', () => {
        localStorage.setItem('vite-ui-theme', 'dark');

        render(
            <ThemeProvider>
                <ThemeToggle />
            </ThemeProvider>
        );

        expect(document.documentElement.classList.contains('dark')).toBe(true);
    });
});
