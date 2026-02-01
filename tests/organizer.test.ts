import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useChores, useBills, useShoppingList } from '../src/hooks/use-organizer';
import { doc, chores, bills, shoppingList } from '../src/lib/yjs-provider';

describe('Organizer Hooks', () => {
    beforeEach(() => {
        doc.transact(() => {
            chores.delete(0, chores.length);
            bills.delete(0, bills.length);
            shoppingList.delete(0, shoppingList.length);
        });
    });

    describe('useChores', () => {
        it('should add a chore', () => {
            const { result } = renderHook(() => useChores());
            act(() => {
                result.current.addChore('Clean Kitchen', ['Mom', 'Dad'], 'daily', 5);
            });
            expect(result.current.items).toHaveLength(1);
            expect(result.current.items[0].title).toBe('Clean Kitchen');
        });

        it('should rotate assignee correctly', () => {
            const { result } = renderHook(() => useChores());
            act(() => {
                result.current.addChore('Trash', ['Alice', 'Bob'], 'weekly', 10);
            });

            const choreId = result.current.items[0].id;

            // Initial state: index 0 (Alice)
            expect(result.current.items[0].currentTurnIndex).toBe(0);

            // Rotate
            act(() => {
                result.current.rotateChore(choreId);
            });

            // Expect index 1 (Bob)
            expect(result.current.items[0].currentTurnIndex).toBe(1);

            // Rotate again (wrap around)
            act(() => {
                result.current.rotateChore(choreId);
            });

            // Expect index 0 (Alice)
            expect(result.current.items[0].currentTurnIndex).toBe(0);
        });
    });

    describe('useBills', () => {
        it('should add and pay a bill', () => {
            const { result } = renderHook(() => useBills());
            act(() => {
                result.current.addBill('Internet', 50, Date.now(), 'Utility');
            });

            expect(result.current.items).toHaveLength(1);
            expect(result.current.items[0].isPaid).toBe(false);

            const id = result.current.items[0].id;
            act(() => {
                result.current.togglePaid(id);
            });

            expect(result.current.items[0].isPaid).toBe(true);
        });
    });

    describe('useShoppingList', () => {
        it('should add items and clear completed', () => {
            const { result } = renderHook(() => useShoppingList());
            act(() => {
                result.current.addItem('Milk', 'Me');
                result.current.addItem('Bread', 'Me');
            });
            expect(result.current.items).toHaveLength(2);

            const milkId = result.current.items.find(i => i.name === 'Milk')!.id;

            act(() => {
                result.current.toggleItem(milkId);
            });
            expect(result.current.items.find(i => i.id === milkId)!.isChecked).toBe(true);

            act(() => {
                result.current.clearCompleted();
            });

            expect(result.current.items).toHaveLength(1);
            expect(result.current.items[0].name).toBe('Bread');
        });
    });
});
