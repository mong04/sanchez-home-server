import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OfflineFallback } from '../components/OfflineFallback';
import React from 'react';

// Wrapper component to simulate the AppRoot logic
function TestAppRoot() {
    const isOnline = navigator.onLine;

    if (!isOnline) {
        return <OfflineFallback />;
    }

    return <div data-testid="online-app">App is Online</div>;
}

describe('Offline Mode Fallback', () => {
    const originalOnLine = navigator.onLine;
    const originalLocation = window.location;

    beforeEach(() => {
        // Mock window.location.reload
        // Safely redefine window.location for jsdom test environment
        // @ts-expect-error - mock location
        delete window.location;
        // @ts-expect-error - mock location
        window.location = { ...originalLocation, reload: vi.fn() };
    });

    afterEach(() => {
        // Restore navigator.onLine
        Object.defineProperty(navigator, 'onLine', {
            writable: true,
            value: originalOnLine,
        });
        // @ts-expect-error - restore location
        window.location = originalLocation;
        vi.clearAllMocks();
    });

    it('renders the offline fallback UI when navigator.onLine is false', () => {
        // Mock navigator.onLine to be false
        Object.defineProperty(navigator, 'onLine', {
            writable: true,
            value: false,
        });

        render(<TestAppRoot />);

        expect(screen.getByText('You’re offline')).toBeInTheDocument();
        expect(screen.getByText(/No internet connection detected/i)).toBeInTheDocument();
        expect(screen.queryByTestId('online-app')).not.toBeInTheDocument();
    });

    it('renders the normal app when navigator.onLine is true', () => {
        // Mock navigator.onLine to be true
        Object.defineProperty(navigator, 'onLine', {
            writable: true,
            value: true,
        });

        render(<TestAppRoot />);

        expect(screen.queryByText('You’re offline')).not.toBeInTheDocument();
        expect(screen.getByTestId('online-app')).toBeInTheDocument();
    });

    it('calls window.location.reload when Retry button is clicked', () => {
        // Just render the fallback directly
        render(<OfflineFallback />);

        const retryButton = screen.getByRole('button', { name: /Retry Connection/i });
        fireEvent.click(retryButton);

        expect(window.location.reload).toHaveBeenCalledTimes(1);
    });
});
