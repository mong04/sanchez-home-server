import { useState } from 'react';
import { ChoreBoard } from './ChoreBoard';
import { FinanceTracker } from './FinanceTracker';
import { ShoppingList } from './ShoppingList';

type Tab = 'chores' | 'finance' | 'shopping';

interface OrganizerLayoutProps {
    initialTab?: Tab;
}

export function OrganizerLayout({ initialTab = 'chores' }: OrganizerLayoutProps) {
    const [activeTab, setActiveTab] = useState<Tab>(initialTab);

    return (
        <section className="p-6 space-y-6 max-w-7xl mx-auto" aria-labelledby="organizer-heading">
            <h1 id="organizer-heading" className="text-3xl font-bold text-foreground mb-6">
                Family Organizer
            </h1>

            {/* Tab Navigation */}
            <div
                role="tablist"
                className="flex space-x-2 border-b border-slate-200 dark:border-slate-700 pb-1"
                aria-label="Organizer Sections"
            >
                <button
                    role="tab"
                    aria-selected={activeTab === 'chores'}
                    aria-controls="chores-panel"
                    id="chores-tab"
                    className={`px-4 py-2 font-medium rounded-t-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${activeTab === 'chores'
                        ? 'bg-card text-primary border-b-2 border-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                        }`}
                    onClick={() => setActiveTab('chores')}
                >
                    Chores
                </button>
                <button
                    role="tab"
                    aria-selected={activeTab === 'finance'}
                    aria-controls="finance-panel"
                    id="finance-tab"
                    className={`px-4 py-2 font-medium rounded-t-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${activeTab === 'finance'
                        ? 'bg-card text-primary border-b-2 border-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                        }`}
                    onClick={() => setActiveTab('finance')}
                >
                    Finance
                </button>
                <button
                    role="tab"
                    aria-selected={activeTab === 'shopping'}
                    aria-controls="shopping-panel"
                    id="shopping-tab"
                    className={`px-4 py-2 font-medium rounded-t-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${activeTab === 'shopping'
                        ? 'bg-card text-primary border-b-2 border-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                        }`}
                    onClick={() => setActiveTab('shopping')}
                >
                    Shopping
                </button>
            </div>

            {/* Tab Panels */}
            <div className="mt-6">
                <div
                    role="tabpanel"
                    id="chores-panel"
                    aria-labelledby="chores-tab"
                    hidden={activeTab !== 'chores'}
                    tabIndex={0}
                    className="focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 rounded-lg p-1"
                >
                    {activeTab === 'chores' && <ChoreBoard />}
                </div>
                <div
                    role="tabpanel"
                    id="finance-panel"
                    aria-labelledby="finance-tab"
                    hidden={activeTab !== 'finance'}
                    tabIndex={0}
                    className="focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 rounded-lg p-1"
                >
                    {activeTab === 'finance' && <FinanceTracker />}
                </div>
                <div
                    role="tabpanel"
                    id="shopping-panel"
                    aria-labelledby="shopping-tab"
                    hidden={activeTab !== 'shopping'}
                    tabIndex={0}
                    className="focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 rounded-lg p-1"
                >
                    {activeTab === 'shopping' && <ShoppingList />}
                </div>
            </div>
        </section>
    );
}
