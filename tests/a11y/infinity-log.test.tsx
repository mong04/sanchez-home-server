/// <reference types="@testing-library/jest-dom" />
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { InfinityLog } from '../../src/components/modules/InfinityLog';
import React from 'react';
import { vi, type Mock } from 'vitest';
import userEvent from '@testing-library/user-event';
import { useInfinityLog } from '../../src/hooks/use-infinity-log';

// Mock the hook
vi.mock('../../src/hooks/use-infinity-log', () => ({
    useInfinityLog: vi.fn(),
}));

// Default mock implementation
const mockUseInfinityLog = vi.mocked(useInfinityLog);
const defaultValues = {
    items: [],
    addItem: vi.fn(),
    removeItem: vi.fn(),
};

beforeEach(() => {
    mockUseInfinityLog.mockReturnValue(defaultValues);
});

describe('InfinityLog Accessibility', () => {
    it('should have no accessibility violations', async () => {
        const { container } = render(<InfinityLog />);
        const results = await axe(container);
        expect(results).toHaveNoViolations();
    });

    it('should allow adding a new item', async () => {
        const addItemMock = vi.fn();
        mockUseInfinityLog.mockReturnValue({
            ...defaultValues,
            addItem: addItemMock
        });

        const { user } = renderWithUser(<InfinityLog />);

        const input = screen.getByLabelText(/Memory Content/i);
        await user.type(input, 'Buy milk');

        // The button might be disabled until text is entered. 
        // Wait for state update? RTL handles this usually.

        const submitBtn = screen.getByRole('button', { name: /remember/i });
        await user.click(submitBtn);

        expect(addItemMock).toHaveBeenCalledWith('Buy milk', expect.any(Array));
    });

    it('should filter items when searching', async () => {
        const items = [
            { id: '1', content: 'Buy milk', tags: ['chores'], createdAt: Date.now() },
            { id: '2', content: 'Walk dog', tags: ['exercise'], createdAt: Date.now() }
        ];
        mockUseInfinityLog.mockReturnValue({
            ...defaultValues,
            items
        });

        const { user } = renderWithUser(<InfinityLog />);

        expect(screen.getByText('Buy milk')).toBeInTheDocument();
        expect(screen.getByText('Walk dog')).toBeInTheDocument();

        const searchInput = screen.getByLabelText(/Search Memories/i);
        await user.type(searchInput, 'milk');

        expect(screen.getByText('Buy milk')).toBeInTheDocument();
        expect(screen.queryByText('Walk dog')).not.toBeInTheDocument();
    });

    it('should support keyboard navigation for tags', async () => {
        const items = [
            { id: '1', content: 'Test', tags: ['tag1', 'tag2'], createdAt: Date.now() }
        ];
        mockUseInfinityLog.mockReturnValue({
            ...defaultValues,
            items
        });

        const { user } = renderWithUser(<InfinityLog />);

        const tagBtn = screen.getByRole('button', { name: /tag1/i });

        // Tab logic in JSDOM is tricky, sometimes better to just focus()
        tagBtn.focus();
        expect(tagBtn).toHaveFocus();

        await user.keyboard('{Enter}');
        expect(tagBtn).toHaveAttribute('aria-pressed', 'true');
    });
});

function renderWithUser(ui: React.ReactElement) {
    return {
        user: userEvent.setup(),
        ...render(ui),
    };
}

