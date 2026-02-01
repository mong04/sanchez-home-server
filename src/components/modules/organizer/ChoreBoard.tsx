import React, { useState } from 'react';
import { useChores } from '../../../hooks/use-organizer';
import { AccessibleButton } from '../../common/AccessibleButton';

export function ChoreBoard() {
    const { items: chores, addChore, rotateChore, deleteChore } = useChores();
    const [newTitle, setNewTitle] = useState('');
    const [assignees, setAssignees] = useState('');
    const [points, setPoints] = useState(1);
    const [feedback, setFeedback] = useState('');

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTitle.trim() || !assignees.trim()) return;

        const assigneeList = assignees.split(',').map(s => s.trim()).filter(Boolean);
        addChore(newTitle, assigneeList, 'weekly', Number(points));
        setNewTitle('');
        setAssignees('');
        setFeedback(`Added chore: ${newTitle}`);
        setTimeout(() => setFeedback(''), 3000);
    };

    const handleComplete = (id: string, title: string, points: number) => {
        rotateChore(id);
        setFeedback(`Completed ${title}! Awarded ${points} points.`);
        setTimeout(() => setFeedback(''), 3000);
    };

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-semibold mb-4">Chore Board</h2>

            {/* Announcement Region */}
            <div aria-live="polite" className="sr-only">
                {feedback}
            </div>

            {/* Visual Feedback Toast */}
            {feedback && (
                <div className="fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded shadow-lg z-50">
                    <span className="block sm:inline">{feedback}</span>
                </div>
            )}

            {/* Add Chore Form */}
            <form onSubmit={handleAdd} className="bg-card p-4 rounded-lg shadow-sm border border-border space-y-4">
                <h3 className="text-lg font-medium text-card-foreground">Add New Chore</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="chore-title" className="block text-sm font-medium text-muted-foreground">Title</label>
                        <input
                            id="chore-title"
                            type="text"
                            value={newTitle}
                            onChange={e => setNewTitle(e.target.value)}
                            className="mt-1 block w-full rounded-md border-input bg-background text-foreground shadow-sm focus:border-ring focus:ring-ring sm:text-sm"
                            placeholder="e.g. Empty Dishwasher"
                        />
                    </div>
                    <div>
                        <label htmlFor="chore-assignees" className="block text-sm font-medium text-muted-foreground">Assignees (comma separated)</label>
                        <input
                            id="chore-assignees"
                            type="text"
                            value={assignees}
                            onChange={e => setAssignees(e.target.value)}
                            className="mt-1 block w-full rounded-md border-input bg-background text-foreground shadow-sm focus:border-ring focus:ring-ring sm:text-sm"
                            placeholder="e.g. Mom, Dad, Kid"
                        />
                    </div>
                    <div>
                        <label htmlFor="chore-points" className="block text-sm font-medium text-muted-foreground">Points</label>
                        <input
                            id="chore-points"
                            type="number"
                            value={points}
                            onChange={e => setPoints(Number(e.target.value))}
                            className="mt-1 block w-full rounded-md border-input bg-background text-foreground shadow-sm focus:border-ring focus:ring-ring sm:text-sm"
                            min="1"
                        />
                    </div>
                </div>
                <div className="flex justify-end">
                    <AccessibleButton type="submit" label="Add Chore">Add Chore</AccessibleButton>
                </div>
            </form>

            {/* Chore Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {chores.map(chore => {
                    const hasAssignees = chore.assignees && chore.assignees.length > 0;
                    const currentAssignee = hasAssignees
                        ? chore.assignees[chore.currentTurnIndex % chore.assignees.length]
                        : 'Unassigned';

                    return (
                        <article
                            key={chore.id}
                            tabIndex={0}
                            className="bg-card rounded-xl shadow-sm border border-border p-6 flex flex-col justify-between hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-ring"
                            aria-labelledby={`chore-title-${chore.id}`}
                        >
                            <div className="mb-4">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 id={`chore-title-${chore.id}`} className="text-xl font-bold text-card-foreground">
                                        {chore.title}
                                    </h3>
                                    <span className="bg-primary/10 text-primary text-xs font-semibold px-2.5 py-0.5 rounded">
                                        {chore.points} pts
                                    </span>
                                </div>
                                <p className="text-muted-foreground text-sm">
                                    Current Turn: <span className="font-semibold text-foreground">{currentAssignee}</span>
                                </p>
                                <p className="text-muted-foreground text-xs mt-1">
                                    Cycle: {hasAssignees ? chore.assignees.join(' → ') : 'No assignees'}
                                </p>
                            </div>

                            <div className="flex space-x-2 mt-4">
                                <AccessibleButton
                                    onClick={() => handleComplete(chore.id, chore.title, chore.points)}
                                    label={`Complete chore: ${chore.title}`}
                                    className="flex-1"
                                >
                                    Complete
                                </AccessibleButton>
                                <AccessibleButton
                                    onClick={() => deleteChore(chore.id)}
                                    label={`Delete chore: ${chore.title}`}
                                    variant="ghost"
                                    className="p-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                                >
                                    {/* Trash Icon */}
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </AccessibleButton>
                            </div>
                        </article>
                    );
                })}
            </div>

            {chores.length === 0 && (
                <div className="text-center text-muted-foreground py-12">
                    <p>No chores added yet. Add one above to get started!</p>
                </div>
            )}
        </div>
    );
}
