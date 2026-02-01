import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { OrganizerLayout } from '../src/components/modules/organizer/OrganizerLayout';
import { ChoreBoard } from '../src/components/modules/organizer/ChoreBoard';
import { FinanceTracker } from '../src/components/modules/organizer/FinanceTracker';
import { ShoppingList } from '../src/components/modules/organizer/ShoppingList';

expect.extend(toHaveNoViolations);

describe('Organizer Accessibility (A11y)', () => {
    afterEach(() => {
        cleanup();
    });

    it('OrganizerLayout should have no violations', async () => {
        const { container } = render(<OrganizerLayout />);
        const results = await axe(container);
        expect(results).toHaveNoViolations();
    });

    it('ChoreBoard should have no violations', async () => {
        const { container } = render(<ChoreBoard />);
        const results = await axe(container);
        expect(results).toHaveNoViolations();
    });

    it('FinanceTracker should have no violations', async () => {
        const { container } = render(<FinanceTracker />);
        const results = await axe(container);
        expect(results).toHaveNoViolations();
    });

    it('ShoppingList should have no violations', async () => {
        const { container } = render(<ShoppingList />);
        const results = await axe(container);
        expect(results).toHaveNoViolations();
    });
});
