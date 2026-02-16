
import React from 'react';
import { useGamification } from '../../hooks/use-gamification';
import { useAuth } from '../../context/AuthContext';
import { ProfileCard } from './ProfileCard';
import { Leaderboard } from '../modules/Leaderboard';

interface ProfilePageProps {
    userId?: string;
}

const BADGES_CONFIG: Record<string, { name: string; icon: string; desc: string }> = {
    'first_chore': { name: 'First Chore', icon: '🧹', desc: 'Completed your first chore!' },
    'streak_3': { name: 'On Fire', icon: '🔥', desc: 'Maintained a 3-day streak!' },
    'streak_7': { name: 'Week Warrior', icon: '🗓️', desc: 'Maintained a 7-day streak!' },
    'early_bird': { name: 'Early Bird', icon: '🌅', desc: 'Completed a task before 8 AM!' },
    'night_owl': { name: 'Night Owl', icon: '🦉', desc: 'Completed a task after 10 PM!' },
};

const Heatmap: React.FC<{ activityLog: Record<string, number> }> = ({ activityLog }) => {
    // Generate last 365 days
    const today = new Date();
    const days = [];
    for (let i = 364; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        days.push({ date: dateStr, count: activityLog[dateStr] || 0 });
    }

    return (
        <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
            <h3 className="font-bold text-foreground mb-4">Activity Heatmap</h3>
            <div className="flex flex-wrap gap-1">
                {days.map((day, i) => (
                    <div
                        key={i}
                        title={`${day.date}: ${day.count} activities`}
                        className={`w-2.5 h-2.5 rounded-sm ${day.count === 0 ? 'bg-muted' :
                            day.count < 3 ? 'bg-emerald-200 dark:bg-emerald-900' :
                                day.count < 6 ? 'bg-emerald-400 dark:bg-emerald-700' :
                                    'bg-emerald-600 dark:bg-emerald-500'
                            }`}
                    />
                ))}
            </div>
        </div>
    );
};

import { useState } from 'react'; // Added useState
import { cn } from '../../lib/utils'; // Added cn
import { PasswordChangeForm } from './PasswordChangeForm'; // Added PasswordChangeForm

export const ProfilePage: React.FC<ProfilePageProps> = ({ userId }) => {
    const { user: authUser } = useAuth();
    const targetUserId = userId || authUser?.id;
    const [activeTab, setActiveTab] = useState<'overview' | 'security'>('overview'); // Added State

    // Only pass initial data if we are viewing our own profile and it might be missing
    const initialData = (authUser?.id === targetUserId && authUser) ? authUser : undefined;

    const { user } = useGamification(targetUserId, initialData);

    const isOwnProfile = !userId || userId === authUser?.id;

    if (!targetUserId) return <div>Please log in to view profile.</div>;
    if (!user) return <div className="p-12 text-center text-muted-foreground">Loading profile data...</div>;

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 animate-in fade-in duration-500">

            {/* Tabs Navigation */}
            <div className="flex border-b border-border mb-6">
                <button
                    onClick={() => setActiveTab('overview')}
                    className={cn(
                        "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                        activeTab === 'overview' ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted"
                    )}
                >
                    Overview
                </button>
                {isOwnProfile && (
                    <button
                        onClick={() => setActiveTab('security')}
                        className={cn(
                            "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                            activeTab === 'security' ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted"
                        )}
                    >
                        Security
                    </button>
                )}
            </div>

            {activeTab === 'overview' ? (
                /* Top Layout Grid */
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Column: Hero & Stats */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Identity Hero */}
                        <ProfileCard userId={targetUserId} />

                        {/* Achievement Gallery */}
                        <div className="bg-card rounded-3xl p-6 sm:p-8 shadow-sm border border-border">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                                    <span>🎖️</span> Achievements
                                </h3>
                                <span className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full">
                                    {user.badges?.length || 0} / {Object.keys(BADGES_CONFIG).length} Unlocked
                                </span>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                {Object.entries(BADGES_CONFIG).map(([id, config]) => {
                                    const isUnlocked = user.badges?.includes(id);
                                    return (
                                        <div
                                            key={id}
                                            className={`group relative flex flex-col items-center p-4 rounded-2xl border-2 transition-all duration-300 ${isUnlocked
                                                ? 'border-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/10 dark:to-orange-900/10 dark:border-yellow-700/50 hover:shadow-lg hover:border-yellow-300'
                                                : 'border-border bg-muted/50 grayscale opacity-60 hover:opacity-100'
                                                }`}
                                        >
                                            <div className={`text-4xl mb-3 transition-transform duration-300 ${isUnlocked ? 'group-hover:scale-110 drop-shadow-sm' : ''}`}>
                                                {config.icon}
                                            </div>
                                            <span className="font-bold text-xs text-center text-foreground">{config.name}</span>
                                            {isUnlocked ? (
                                                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-1 bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full">
                                                    Unlocked
                                                </span>
                                            ) : (
                                                <span className="text-[10px] text-muted-foreground mt-1">Locked</span>
                                            )}

                                            {/* Tooltip */}
                                            <div className="absolute inset-0 bg-popover/90 backdrop-blur-sm text-popover-foreground p-4 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-center border border-border">
                                                <p className="text-xs font-medium">{config.desc}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Activity Heatmap */}
                        <div className="bg-card rounded-3xl p-6 sm:p-8 shadow-sm border border-border overflow-hidden">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                                    <span>📅</span> Activity Log
                                </h3>
                                <div className="flex gap-2 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 bg-muted rounded-sm"></div> Less</span>
                                    <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 bg-emerald-600 dark:bg-emerald-500 rounded-sm"></div> More</span>
                                </div>
                            </div>
                            <div className="overflow-x-auto pb-2 scrollbar-hide">
                                <Heatmap activityLog={user.activityLog || {}} />
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Leaderboard */}
                    <div className="space-y-6">
                        <div className="sticky top-6">
                            <Leaderboard />
                        </div>
                    </div>
                </div>
            ) : (
                <div className="max-w-2xl mx-auto space-y-6">
                    <div className="bg-card rounded-3xl p-6 sm:p-8 shadow-sm border border-border">
                        <PasswordChangeForm />
                    </div>
                </div>
            )}
        </div>
    );
};
