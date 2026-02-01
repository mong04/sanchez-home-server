import { useState, useEffect, useCallback } from 'react';
import { chores, bills, shoppingList } from '../lib/yjs-provider';
import type { Chore, Bill, ShoppingItem } from '../types/schema';
import { v4 as uuidv4 } from 'uuid';

export function useChores() {
    const [items, setItems] = useState<Chore[]>(chores.toArray());

    useEffect(() => {
        const observer = () => setItems(chores.toArray());
        chores.observe(observer);
        return () => chores.unobserve(observer);
    }, []);

    const addChore = useCallback((title: string, assignees: string[], frequency: 'daily' | 'weekly', points: number) => {
        const newChore: Chore = {
            id: uuidv4(),
            title,
            assignees,
            currentTurnIndex: 0,
            frequency,
            points,
            lastCompleted: 0
        };
        chores.push([newChore]);
    }, []);

    const rotateChore = useCallback((id: string) => {
        doc: {
            // Find index of chore to update
            // We need to operate on the Y.Array directly index-based or find the item
            // Since Y.Array doesn't support find and update easily without index, we iterate
            let index = -1;
            const currentItems = chores.toArray();
            for (let i = 0; i < currentItems.length; i++) {
                if (currentItems[i].id === id) {
                    index = i;
                    break;
                }
            }

            if (index !== -1) {
                const chore = currentItems[index];
                const nextTurnIndex = (chore.currentTurnIndex + 1) % chore.assignees.length;

                // Update properties
                // In Yjs, to update an object in an array, we typically request the replacement
                // Or if it was a Y.Map we'd set keys. Here it's a plain object in a Y.Array.
                // We must replace the item.
                const updatedChore = {
                    ...chore,
                    currentTurnIndex: nextTurnIndex,
                    lastCompleted: Date.now()
                };

                chores.delete(index, 1);
                chores.insert(index, [updatedChore]);
            }
        }
    }, []);

    const deleteChore = useCallback((id: string) => {
        const index = chores.toArray().findIndex(c => c.id === id);
        if (index !== -1) {
            chores.delete(index, 1);
        }
    }, []);

    const getMyActiveChores = useCallback((userId: string) => {
        // For now, simple matching logic. In a real app, userId would be strictly validated.
        // We look for chores where assignees[currentTurnIndex] matches the userId (or partial match for Dad/Mom etc)
        // Since the mock CommandCenter uses "dad-uuid", we can implement a flexible check or specific logic.
        return items.filter(chore => {
            if (!chore.assignees || chore.assignees.length === 0) return false;
            const currentAssignee = chore.assignees[chore.currentTurnIndex % chore.assignees.length];
            // Simple strict match or partial for the mock
            return currentAssignee === userId || currentAssignee.toLowerCase().includes('dad');
        });
    }, [items]);

    const getFamilyLeaderboard = useCallback(() => {
        // Tally points. This requires history which we stored in 'lastCompleted' but not a full log.
        // For this phase, we might mock it or calculate based on potential future structure.
        // Since we don't store "who completed it" in a history array yet (just lastCompleted time), 
        // we will return a mock leaderboard based on the PRD's gamification requirement or just random/static for now 
        // until we add a proper history log to the schema (which is Phase 7/8).
        // WAIT: The schema has no history. We must rely on 'points' being accumulated elsewhere or just mock it for display.
        // Let's perform a simple mock aggregation or accumulation if possible.
        // Actually, we can just return a static structure for the "Dashboard" visualization as a placeholder for now.

        return [
            { name: 'dad-uuid', points: 15 },
            { name: 'Mom', points: 10 },
            { name: 'Kid', points: 5 }
        ];
    }, []);

    return { items, addChore, rotateChore, deleteChore, getMyActiveChores, getFamilyLeaderboard };
}

export function useBills() {
    const [items, setItems] = useState<Bill[]>(bills.toArray());

    useEffect(() => {
        const observer = () => setItems(bills.toArray());
        bills.observe(observer);
        return () => bills.unobserve(observer);
    }, []);

    const addBill = useCallback((name: string, amount: number, dueDate: number, category: string) => {
        const newBill: Bill = {
            id: uuidv4(),
            name,
            amount,
            dueDate,
            isPaid: false,
            category
        };
        bills.push([newBill]);
    }, []);

    const togglePaid = useCallback((id: string) => {
        const index = bills.toArray().findIndex(b => b.id === id);
        if (index !== -1) {
            const bill = bills.get(index);
            const updatedBill = { ...bill, isPaid: !bill.isPaid };
            bills.delete(index, 1);
            bills.insert(index, [updatedBill]);
        }
    }, []);

    const deleteBill = useCallback((id: string) => {
        const index = bills.toArray().findIndex(b => b.id === id);
        if (index !== -1) {
            bills.delete(index, 1);
        }
    }, []);

    const getUpcomingBills = useCallback((days: number) => {
        const threshold = Date.now() + (days * 24 * 60 * 60 * 1000);
        return items
            .filter(b => !b.isPaid && b.dueDate <= threshold)
            .sort((a, b) => a.dueDate - b.dueDate);
    }, [items]);

    return { items, addBill, togglePaid, deleteBill, getUpcomingBills };
}

export function useShoppingList() {
    const [items, setItems] = useState<ShoppingItem[]>(shoppingList.toArray());

    useEffect(() => {
        const observer = () => setItems(shoppingList.toArray());
        shoppingList.observe(observer);
        return () => shoppingList.unobserve(observer);
    }, []);

    const addItem = useCallback((name: string, addedBy: string) => {
        const newItem: ShoppingItem = {
            id: uuidv4(),
            name,
            isChecked: false,
            addedBy
        };
        shoppingList.push([newItem]);
    }, []);

    const toggleItem = useCallback((id: string) => {
        const index = shoppingList.toArray().findIndex(i => i.id === id);
        if (index !== -1) {
            const item = shoppingList.get(index);
            const updatedItem = { ...item, isChecked: !item.isChecked };
            shoppingList.delete(index, 1);
            shoppingList.insert(index, [updatedItem]);
        }
    }, []);

    const clearCompleted = useCallback(() => {
        // Since deleting indexes shifts them, we should delete from end to start or filter and replace all?
        // Deleting from end to start is safer for in-place modification
        // Or just transactionally delete specific indexes
        const currentItems = shoppingList.toArray();
        // create a transaction to avoid multiple renders/observers
        shoppingList.doc?.transact(() => {
            for (let i = currentItems.length - 1; i >= 0; i--) {
                if (currentItems[i].isChecked) {
                    shoppingList.delete(i, 1);
                }
            }
        });
    }, []);

    return { items, addItem, toggleItem, clearCompleted };
}

// Default export for consolidated usage if needed, though named exports are preferred
export default function useOrganizer() {
    return {
        chores: useChores(),
        bills: useBills(),
        shopping: useShoppingList()
    };
}
