import React, { useState } from 'react';
import { useChores } from '../../../hooks/use-organizer';
import { AccessibleButton } from '../../common/AccessibleButton';
import { Sparkles, Plus } from 'lucide-react';
import { Input } from '../../common/Input';
import { UserPicker } from '../../common/UserPicker';
import { useAuth } from '../../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../lib/utils';

export function ChoreBoard() {
    const { items: chores, addChore, rotateChore, deleteChore } = useChores();
    const { profiles } = useAuth();
    const [newTitle, setNewTitle] = useState('');
    const [selectedAssigneeIds, setSelectedAssigneeIds] = useState<string[]>([]);
    const [points, setPoints] = useState(1);
    const [feedback, setFeedback] = useState('');

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTitle.trim() || selectedAssigneeIds.length === 0) return;

        addChore(newTitle, selectedAssigneeIds, 'weekly', Number(points));
        setNewTitle('');
        setSelectedAssigneeIds([]);
        setFeedback(`Added chore: ${newTitle}`);
        setTimeout(() => setFeedback(''), 3000);
    };

    const handleComplete = (id: string, title: string, points: number) => {
        rotateChore(id);
        setFeedback(`Completed ${title}! Awarded ${points} points.`);
        setTimeout(() => setFeedback(''), 3000);
    };

    return (
        <div className="space-y-8 max-w-6xl mx-auto px-4 sm:px-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-200 bg-clip-text text-transparent">
                        Family Chores
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">Keep the household running smooth and fair.</p>
                </div>

                <div aria-live="polite" className="sr-only">
                    {feedback}
                </div>
            </div>

            {/* Visual Feedback Toast */}
            <AnimatePresence>
                {feedback && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="fixed top-6 right-6 bg-slate-900/90 backdrop-blur-xl border border-indigo-500/30 text-indigo-100 px-6 py-4 rounded-2xl shadow-2xl z-[100] flex items-center gap-3"
                    >
                        <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                        <span className="font-medium">{feedback}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Add Chore Form - Premium Look */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-900/40 backdrop-blur-sm border border-slate-800/60 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden"
            >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />

                <form onSubmit={handleAdd} className="space-y-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        <div className="space-y-6">
                            <Input
                                label="Chore Name"
                                id="chore-title"
                                value={newTitle}
                                onChange={e => setNewTitle(e.target.value)}
                                placeholder="e.g. Empty Dishwasher"
                                className="w-full bg-slate-950/40 border-slate-800 focus:border-indigo-500 transition-all text-lg h-14"
                            />

                            <div className="pt-2">
                                <Input
                                    label="XP Points Reward"
                                    id="chore-points"
                                    type="number"
                                    value={points}
                                    onChange={e => setPoints(Number(e.target.value))}
                                    min="1"
                                    className="w-full bg-slate-950/40 border-slate-800 focus:border-indigo-500 transition-all h-12"
                                />
                                <p className="text-[10px] text-slate-500 mt-2 ml-1 uppercase tracking-widest">
                                    Family members earn this XP on completion
                                </p>
                            </div>
                        </div>

                        <UserPicker
                            label="Assign to Family Members"
                            users={profiles}
                            selectedIds={selectedAssigneeIds}
                            onSelectionChange={setSelectedAssigneeIds}
                            className="bg-slate-950/20 p-5 rounded-2xl border border-slate-800/50"
                        />
                    </div>

                    <div className="flex justify-end pt-4 border-t border-slate-800/30">
                        <AccessibleButton
                            type="submit"
                            label="Create Chore"
                            disabled={!newTitle.trim() || selectedAssigneeIds.length === 0}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 h-12 rounded-xl transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-2 group"
                        >
                            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                            Create Chore
                        </AccessibleButton>
                    </div>
                </form>
            </motion.div>

            {/* Chore Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
                {chores.map(chore => {
                    const hasAssignees = chore.assignees && chore.assignees.length > 0;
                    const currentAssigneeId = hasAssignees
                        ? chore.assignees[chore.currentTurnIndex % chore.assignees.length]
                        : 'Unassigned';

                    const currentProfile = profiles.find(p => p.id === currentAssigneeId);
                    const currentAssigneeName = currentProfile ? currentProfile.name : 'Unknown';

                    return (
                        <motion.article
                            layout
                            key={chore.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            whileHover={{ y: -5 }}
                            className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 flex flex-col justify-between hover:border-indigo-500/30 hover:shadow-2xl hover:shadow-indigo-500/5 transition-all group"
                        >
                            <div className="space-y-4">
                                <div className="flex justify-between items-start">
                                    <h3 className="text-xl font-bold text-slate-100 group-hover:text-indigo-200 transition-colors capitalize">
                                        {chore.title}
                                    </h3>
                                    <div className="flex flex-col items-end">
                                        <span className="bg-indigo-500/10 text-indigo-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-indigo-500/20">
                                            {chore.points} XP
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 p-3 bg-slate-950/40 rounded-xl border border-slate-800/50">
                                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-sm font-bold text-indigo-300 border border-slate-700">
                                        {currentProfile?.avatar?.value ? (
                                            <img src={currentProfile.avatar.value} className="w-full h-full rounded-full object-cover" />
                                        ) : (
                                            currentAssigneeName.charAt(0)
                                        )}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Active Turn</span>
                                        <span className="text-slate-100 font-medium">{currentAssigneeName}</span>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold ml-1">Rotation</span>
                                    <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
                                        {chore.assignees.map((id, idx) => {
                                            const p = profiles.find(pr => pr.id === id);
                                            const isCurrent = id === currentAssigneeId;
                                            return (
                                                <React.Fragment key={id}>
                                                    <span className={cn(
                                                        "px-2 py-1 rounded-md transition-colors",
                                                        isCurrent ? "bg-indigo-500/10 text-indigo-300 font-semibold" : "bg-slate-800/40"
                                                    )}>
                                                        {p ? p.name : id}
                                                    </span>
                                                    {idx < chore.assignees.length - 1 && <span className="opacity-30">→</span>}
                                                </React.Fragment>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-8">
                                <AccessibleButton
                                    onClick={() => handleComplete(chore.id, chore.title, chore.points)}
                                    label={`Complete chore: ${chore.title}`}
                                    className="flex-1 bg-slate-100 hover:bg-white text-slate-950 font-bold py-3 rounded-xl shadow-lg transition-all active:scale-95"
                                >
                                    Complete
                                </AccessibleButton>
                                <button
                                    onClick={() => deleteChore(chore.id)}
                                    className="p-3 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                                    title="Delete Chore"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </div>
                        </motion.article>
                    );
                })}
            </div>

            {chores.length === 0 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-20 rounded-3xl border-2 border-dashed border-slate-800/50 bg-slate-900/10 flex flex-col items-center justify-center gap-4"
                >
                    <div className="p-6 rounded-3xl bg-slate-900/50 border border-slate-800 shadow-inner">
                        <Sparkles className="w-10 h-10 text-indigo-400/50" />
                    </div>
                    <div className="space-y-1">
                        <h3 className="font-bold text-xl text-slate-100">Zero Trust? No, Zero Chores!</h3>
                        <p className="text-slate-500 max-w-sm mx-auto text-sm">
                            Everything is spotless. Relax, or create a new objective above to keep the momentum going.
                        </p>
                    </div>
                </motion.div>
            )}
        </div>
    );
}
