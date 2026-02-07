import React, { useState } from 'react';
import { useShoppingList } from '../../../hooks/use-organizer';
import { AccessibleButton } from '../../common/AccessibleButton';
import { ShoppingCart } from 'lucide-react';
import { Input } from '../../common/Input';

export function ShoppingList() {
    const { items, addItem, toggleItem, clearCompleted } = useShoppingList();
    const [newItem, setNewItem] = useState('');
    const [isScanning, setScanning] = useState(false); // mock OCR state

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItem.trim()) return;

        addItem(newItem.trim(), 'User'); // Hardcoded user for now until auth is fully piped
        setNewItem('');
    };

    const handleScan = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setScanning(true);
            // Mock OCR delay
            setTimeout(() => {
                const mockItems = ['Bananas', 'Milk', 'Bread (Scanned)'];
                mockItems.forEach(item => addItem(item, 'Scanner'));
                setScanning(false);
                // Reset input
                e.target.value = '';
            }, 1000);
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-semibold mb-4">Shared Shopping List</h2>

            <div className="flex flex-col md:flex-row gap-4 items-start">
                <form onSubmit={handleAdd} className="flex-1 w-full flex gap-2">
                    <div className="relative flex-1">
                        <Input
                            id="shopping-item"
                            value={newItem}
                            onChange={e => setNewItem(e.target.value)}
                            placeholder="Add item (e.g. Milk)"
                            className="w-full"
                            aria-label="Item Name"
                        />
                    </div>
                    <AccessibleButton type="submit" label="Add Item">Add</AccessibleButton>
                </form>

                <div className="relative">
                    <input
                        type="file"
                        accept="image/*"
                        id="ocr-scan"
                        className="sr-only"
                        onChange={handleScan}
                        disabled={isScanning}
                        aria-label="Scan Receipt"
                    />
                    <label
                        htmlFor="ocr-scan"
                        className={`inline-flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 cursor-pointer ${isScanning ? 'bg-muted cursor-not-allowed' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                            }`}
                    >
                        {isScanning ? (
                            <span className="flex items-center">
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Scanning...
                            </span>
                        ) : (
                            <span className="flex items-center">
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                Scan Receipt
                            </span>
                        )}
                    </label>
                </div>
            </div>

            <fieldset className="space-y-2 border-t border-border pt-4">
                <legend className="sr-only">Shopping List Items</legend>
                <div className="bg-card rounded-lg shadow overflow-hidden divide-y divide-border">
                    {items.length === 0 ? (
                        <div className="text-center py-16 flex flex-col items-center justify-center gap-3">
                            <div className="p-4 rounded-full bg-background ring-1 ring-border shadow-sm">
                                <ShoppingCart className="w-8 h-8 text-blue-500/50" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-semibold text-lg">Fridge full?</h3>
                                <p className="text-muted-foreground max-w-sm mx-auto">
                                    The list is empty. Add items above or scan a receipt to restock.
                                </p>
                            </div>
                        </div>
                    ) : (
                        items.map(item => (
                            <div key={item.id} className="flex items-center p-4 hover:bg-accent/50 transition-colors">
                                <div className="flex items-center h-5">
                                    <input
                                        id={`item-${item.id}`}
                                        type="checkbox"
                                        checked={item.isChecked}
                                        onChange={() => toggleItem(item.id)}
                                        className="focus:ring-ring h-5 w-5 text-primary border-input rounded"
                                    />
                                </div>
                                <div className="ml-3 text-sm flex-1">
                                    <label htmlFor={`item-${item.id}`} className={`font-medium text-foreground ${item.isChecked ? 'line-through text-muted-foreground' : ''}`}>
                                        {item.name}
                                    </label>
                                    <span className="ml-2 text-xs text-muted-foreground">added by {item.addedBy}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </fieldset>

            {
                items.some(i => i.isChecked) && (
                    <div className="flex justify-end">
                        <AccessibleButton
                            onClick={clearCompleted}
                            label="Clear checked items"
                            variant="ghost"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                            Clear Completed
                        </AccessibleButton>
                    </div>
                )
            }
        </div>
    );
}
