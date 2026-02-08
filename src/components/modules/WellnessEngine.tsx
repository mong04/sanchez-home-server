import React, { useState } from 'react';
import { useWellness } from '../../hooks/use-wellness';
import { Utensils, History, Flame, Moon, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../common/Card';

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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-bottom-4 duration-500 delay-100">
                {/* Meal Logger */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center text-lg">
                            <Utensils className="w-5 h-5 mr-2 text-orange-400" />
                            Carnivore Meal Logger
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleMealSubmit} className="space-y-4">
                            <Input
                                type="text"
                                value={mealInput}
                                onChange={(e) => setMealInput(e.target.value)}
                                placeholder="E.g., 1lb Ribeye, 2 Eggs"
                                className="w-full"
                            />
                            <Button type="submit" className="w-full" disabled={!mealInput.trim()}>
                                Log Meal
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                            <Button
                                variant="outline"
                                onClick={() => handleQuickLog('exercise', 'Workout')}
                                className="h-24 flex flex-col items-center justify-center space-y-2 hover:border-orange-500/50 hover:bg-orange-500/5"
                            >
                                <Flame className="w-6 h-6 text-orange-500" />
                                <span>Log Workout</span>
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => handleQuickLog('sleep', '8 Hours')}
                                className="h-24 flex flex-col items-center justify-center space-y-2 hover:border-indigo-500/50 hover:bg-indigo-500/5"
                            >
                                <Moon className="w-6 h-6 text-indigo-400" />
                                <span>Log Sleep</span>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* History */}
            <Card className="animate-in slide-in-from-bottom-8 duration-700 delay-200">
                <CardHeader className="border-b border-border/50 pb-3">
                    <CardTitle className="flex items-center text-base font-medium text-muted-foreground">
                        <History className="w-4 h-4 mr-2" />
                        Recent Activity
                    </CardTitle>
                </CardHeader>
                <div className="divide-y divide-border/50">
                    {recentEntries.length === 0 ? (
                        <div className="p-12 flex flex-col items-center justify-center text-center text-muted-foreground italic space-y-3 opacity-70">
                            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                                <Plus className="w-6 h-6 text-muted-foreground/50" />
                            </div>
                            <p>No activity recorded yet. Start logging!</p>
                        </div>
                    ) : (
                        recentEntries.map(entry => (
                            <div key={entry.id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                                <div>
                                    <div className="font-medium text-foreground capitalize flex items-center">
                                        {entry.type === 'meal' && <Utensils className="w-4 h-4 mr-2 text-orange-400" />}
                                        {entry.type === 'exercise' && <Flame className="w-4 h-4 mr-2 text-destructive" />}
                                        {entry.type === 'sleep' && <Moon className="w-4 h-4 mr-2 text-indigo-400" />}
                                        {entry.value}
                                    </div>
                                    <div className="text-xs text-muted-foreground ml-6 mt-0.5">{entry.tags.join(', ')}</div>
                                </div>
                                <div className="text-xs text-muted-foreground font-mono bg-muted/50 px-2 py-1 rounded">
                                    {format(entry.timestamp, 'MMM d, h:mm a')}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </Card>
        </div>
    );
}
