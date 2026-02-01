import React, { useState } from 'react';
import { useWellness } from '../../hooks/use-wellness';
import { Utensils, History, Flame, Moon } from 'lucide-react';
import { format } from 'date-fns';

export function WellnessEngine() {
    const { entries, logEntry } = useWellness();
    const [mealInput, setMealInput] = useState('');

    const handleMealSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!mealInput.trim()) return;

        logEntry({
            type: 'meal',
            value: mealInput,
            tags: ['carnivore']
        });
        setMealInput('');
    };

    const handleQuickLog = (type: 'exercise' | 'sleep' | 'mood', value: string) => {
        logEntry({ type, value, tags: [] });
    };

    const recentEntries = [...entries].sort((a, b) => b.timestamp - a.timestamp).slice(0, 10);

    return (
        <div className="space-y-6">
            <header>
                <h2 className="text-2xl font-bold text-foreground flex items-center">
                    <Flame className="w-6 h-6 mr-2 text-destructive" />
                    Wellness Engine
                </h2>
                <p className="text-muted-foreground">Optimize yourself.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Meal Logger */}
                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                    <h3 className="text-lg font-medium text-foreground mb-4 flex items-center">
                        <Utensils className="w-5 h-5 mr-2 text-orange-400" />
                        Carnivore Meal Logger
                    </h3>
                    <form onSubmit={handleMealSubmit} className="space-y-3">
                        <input
                            type="text"
                            value={mealInput}
                            onChange={(e) => setMealInput(e.target.value)}
                            placeholder="E.g., 1lb Ribeye, 2 Eggs"
                            className="w-full bg-background border border-input rounded-xl p-3 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                        <button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-3 rounded-xl transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none">
                            Log Meal
                        </button>
                    </form>
                </div>

                {/* Quick Actions */}
                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                    <h3 className="text-lg font-medium text-foreground mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => handleQuickLog('exercise', 'Workout')}
                            className="flex flex-col items-center justify-center p-4 bg-muted/40 rounded-xl hover:bg-muted transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
                        >
                            <Flame className="w-6 h-6 text-orange-500 mb-2" />
                            <span className="text-sm font-medium">Log Workout</span>
                        </button>
                        <button
                            onClick={() => handleQuickLog('sleep', '8 Hours')}
                            className="flex flex-col items-center justify-center p-4 bg-muted/40 rounded-xl hover:bg-muted transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
                        >
                            <Moon className="w-6 h-6 text-indigo-400 mb-2" />
                            <span className="text-sm font-medium">Log Sleep</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* History */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                <div className="p-4 border-b border-border flex items-center space-x-2">
                    <History className="w-4 h-4 text-muted-foreground" />
                    <h3 className="font-medium text-foreground">Recent Activity</h3>
                </div>
                <div className="divide-y divide-border">
                    {recentEntries.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground italic">No activity recorded yet.</div>
                    ) : (
                        recentEntries.map(entry => (
                            <div key={entry.id} className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                                <div>
                                    <div className="font-medium text-foreground capitalize flex items-center">
                                        {entry.type === 'meal' && <Utensils className="w-3 h-3 mr-2 text-orange-400" />}
                                        {entry.type === 'exercise' && <Flame className="w-3 h-3 mr-2 text-destructive" />}
                                        {entry.type === 'sleep' && <Moon className="w-3 h-3 mr-2 text-indigo-400" />}
                                        {entry.value}
                                    </div>
                                    <div className="text-xs text-muted-foreground">{entry.tags.join(', ')}</div>
                                </div>
                                <div className="text-xs text-muted-foreground font-mono">
                                    {format(entry.timestamp, 'MMM d, h:mm a')}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
