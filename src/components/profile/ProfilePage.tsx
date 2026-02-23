
import React, { useEffect } from 'react';
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

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_LABELS_SHORT = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const DAY_LABELS_FULL = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getMotivation(recentActive: number): { text: string; emoji: string } {
    if (recentActive >= 6) return { text: `Active ${recentActive} of the last 7 days — on fire!`, emoji: '🔥' };
    if (recentActive >= 4) return { text: `${recentActive} days this week — great momentum!`, emoji: '💪' };
    if (recentActive >= 2) return { text: `${recentActive} days so far — can you make it ${recentActive + 1}?`, emoji: '🎯' };
    if (recentActive >= 1) return { text: 'You showed up — that\'s what counts!', emoji: '🌱' };
    return { text: 'Start a new streak today — every day counts!', emoji: '✨' };
}

const ActivityHeatmap: React.FC<{ activityLog: Record<string, number> }> = ({ activityLog }) => {
    const today = new Date();

    // Responsive week count: 13 mobile, 26 tablet, 52 desktop
    const [weekCount, setWeekCount] = React.useState(() => {
        if (typeof window === 'undefined') return 52;
        if (window.innerWidth >= 1280) return 52;
        if (window.innerWidth >= 640) return 26;
        return 13;
    });

    useEffect(() => {
        const update = () => {
            if (window.innerWidth >= 1280) setWeekCount(52);
            else if (window.innerWidth >= 640) setWeekCount(26);
            else setWeekCount(13);
        };
        window.addEventListener('resize', update);
        return () => window.removeEventListener('resize', update);
    }, []);

    // Build weeks of data aligned to weekdays (Sun=0 ... Sat=6)
    const totalWeeks = weekCount;
    const cells: { date: string; count: number; day: number; week: number; month: number }[] = [];

    // Find the start: go back ~364 days, then back to the previous Sunday
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - (totalWeeks * 7 - 1));
    // Align to Sunday (start of week)
    const dayOfWeek = startDate.getDay();
    startDate.setDate(startDate.getDate() - dayOfWeek);

    const monthPositions: { label: string; col: number }[] = [];
    const monthBoundaryWeeks = new Set<number>(); // weeks where a new month starts
    let lastMonth = -1;

    for (let i = 0; ; i++) {
        const d = new Date(startDate);
        d.setDate(d.getDate() + i);
        if (d > today) break;

        const dateStr = d.toISOString().split('T')[0];
        const day = d.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
        const week = Math.floor(i / 7);

        // Track month label positions and boundaries
        const month = d.getMonth();
        if (month !== lastMonth) {
            if (lastMonth !== -1) {
                monthBoundaryWeeks.add(week); // mark this week as a boundary
            }
            // Always place a month label at the first week containing this month
            if (!monthPositions.find(m => m.label === MONTH_LABELS[month])) {
                monthPositions.push({ label: MONTH_LABELS[month], col: week });
            }
            lastMonth = month;
        }

        cells.push({ date: dateStr, count: activityLog[dateStr] || 0, day, week, month });
    }

    const maxWeek = cells.length > 0 ? cells[cells.length - 1].week : 0;

    // Compute stats
    const activeDays = cells.filter(c => c.count > 0).length;
    const totalActivities = cells.reduce((sum, c) => sum + c.count, 0);

    // Current streak (consecutive days ending at today, walking backwards)
    let currentStreak = 0;
    for (let i = 0; i <= 365; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        if ((activityLog[dateStr] || 0) > 0) {
            currentStreak++;
        } else {
            // Allow today to be 0 (haven't done anything yet today)
            if (i === 0) continue;
            break;
        }
    }

    // Longest streak
    let longestStreak = 0;
    let tempStreak = 0;
    for (const cell of cells) {
        if (cell.count > 0) {
            tempStreak++;
            longestStreak = Math.max(longestStreak, tempStreak);
        } else {
            tempStreak = 0;
        }
    }

    // Last 7 days active count
    let recentActive = 0;
    for (let i = 0; i < 7; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        if ((activityLog[dateStr] || 0) > 0) recentActive++;
    }
    const motivation = getMotivation(recentActive);

    // Color function
    const getCellColor = (count: number) => {
        if (count === 0) return 'bg-muted';
        if (count < 3) return 'bg-success/25';
        if (count < 6) return 'bg-success/50';
        return 'bg-success';
    };

    return (
        <div className="bg-card rounded-2xl p-4 sm:p-5 md:p-6 shadow-sm border border-border">
            {/* Header */}
            <div className="flex items-center justify-between mb-3 md:mb-4">
                <h3 className="text-sm md:text-base font-bold text-foreground flex items-center gap-2">
                    <span>📊</span> Your Activity
                </h3>
                <div className="flex items-center gap-1 text-[10px] md:text-xs text-muted-foreground">
                    <span>Less</span>
                    <div className="w-2.5 h-2.5 rounded-sm bg-muted" />
                    <div className="w-2.5 h-2.5 rounded-sm bg-success/25" />
                    <div className="w-2.5 h-2.5 rounded-sm bg-success/50" />
                    <div className="w-2.5 h-2.5 rounded-sm bg-success" />
                    <span>More</span>
                </div>
            </div>

            {/* Stats Row */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-0 mb-4 md:mb-5">
                <div className="flex-1 flex items-center gap-2 sm:justify-center">
                    <span className="text-lg">📅</span>
                    <div>
                        <div className="text-lg md:text-xl font-bold text-foreground leading-tight">{activeDays}</div>
                        <div className="text-[10px] md:text-xs text-muted-foreground">Active Days</div>
                    </div>
                </div>
                <div className="hidden sm:block w-px bg-border mx-2" />
                <div className="flex-1 flex items-center gap-2 sm:justify-center">
                    <span className="text-lg">🔥</span>
                    <div>
                        <div className="text-lg md:text-xl font-bold text-foreground leading-tight">{currentStreak}</div>
                        <div className="text-[10px] md:text-xs text-muted-foreground">Day Streak</div>
                    </div>
                </div>
                <div className="hidden sm:block w-px bg-border mx-2" />
                <div className="flex-1 flex items-center gap-2 sm:justify-center">
                    <span className="text-lg">⭐</span>
                    <div>
                        <div className="text-lg md:text-xl font-bold text-foreground leading-tight">{longestStreak}</div>
                        <div className="text-[10px] md:text-xs text-muted-foreground">Best Streak</div>
                    </div>
                </div>
                <div className="hidden sm:block w-px bg-border mx-2" />
                <div className="flex-1 flex items-center gap-2 sm:justify-center">
                    <span className="text-lg">⚡</span>
                    <div>
                        <div className="text-lg md:text-xl font-bold text-foreground leading-tight">{totalActivities}</div>
                        <div className="text-[10px] md:text-xs text-muted-foreground">Total Actions</div>
                    </div>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="overflow-x-auto pb-1 scrollbar-hide">
                <div className="w-fit">
                    {/* Month Labels */}
                    <div className="flex mb-1">
                        {/* Spacer matching day label column */}
                        <div className="shrink-0 mr-[3px] sm:mr-1 flex items-center justify-end" style={{ width: '14px' }}>
                            <span className="sm:hidden" />
                        </div>
                        <div className="hidden sm:flex shrink-0 mr-[3px] sm:mr-1 items-center justify-end" style={{ width: '26px' }} />
                        {/* Month label cells - one per week column */}
                        {Array.from({ length: maxWeek + 1 }, (_, weekIdx) => {
                            const monthEntry = monthPositions.find(m => m.col === weekIdx);
                            const isBoundary = monthBoundaryWeeks.has(weekIdx) && weekIdx > 0;
                            return (
                                <div
                                    key={weekIdx}
                                    className={`w-[10px] sm:w-3 shrink-0 mr-[3px] sm:mr-1 last:mr-0${isBoundary ? ' ml-[3px] sm:ml-1.5' : ''}`}
                                >
                                    {monthEntry && (
                                        <span className="text-[8px] sm:text-[10px] md:text-xs text-muted-foreground whitespace-nowrap">
                                            {monthEntry.label}
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Grid: day labels + cells */}
                    <div className="flex">
                        {/* Day labels column */}
                        <div className="flex flex-col shrink-0 mr-[3px] sm:mr-1">
                            {DAY_LABELS_SHORT.map((label, i) => (
                                <div key={i} className="w-[14px] sm:w-[26px] h-[10px] sm:h-3 mb-[3px] sm:mb-1 last:mb-0 flex items-center justify-end pr-0.5">
                                    <span className="text-[8px] sm:hidden text-muted-foreground leading-none font-medium">{label}</span>
                                    <span className="hidden sm:inline text-[9px] md:text-[10px] text-muted-foreground leading-none font-medium">{DAY_LABELS_FULL[i]}</span>
                                </div>
                            ))}
                        </div>

                        {/* Week columns */}
                        {Array.from({ length: maxWeek + 1 }, (_, weekIdx) => {
                            const isBoundary = monthBoundaryWeeks.has(weekIdx) && weekIdx > 0;
                            // For boundary weeks, find the dominant month (the newer one)
                            const weekCells = cells.filter(c => c.week === weekIdx);
                            const dominantMonth = isBoundary && weekCells.length > 0
                                ? weekCells[weekCells.length - 1].month // last cell = newest month
                                : -1;
                            return (
                                <div key={weekIdx} className={`flex flex-col shrink-0 mr-[3px] sm:mr-1 last:mr-0${isBoundary ? ' ml-[3px] sm:ml-1.5' : ''}`}>
                                    {Array.from({ length: 7 }, (_, dayIdx) => {
                                        const cell = cells.find(c => c.week === weekIdx && c.day === dayIdx);
                                        if (!cell) return <div key={dayIdx} className="w-[10px] h-[10px] sm:w-3 sm:h-3 mb-[3px] sm:mb-1 last:mb-0 rounded-sm" />;
                                        // Bleed cells from previous month get subtle dimming
                                        const isBleed = isBoundary && cell.month !== dominantMonth;
                                        return (
                                            <div
                                                key={dayIdx}
                                                title={`${cell.date}: ${cell.count} activities`}
                                                className={`w-[10px] h-[10px] sm:w-3 sm:h-3 mb-[3px] sm:mb-1 last:mb-0 rounded-sm ${getCellColor(cell.count)} transition-colors hover:ring-1 hover:ring-foreground/20${isBleed ? ' opacity-40' : ''}`}
                                            />
                                        );
                                    })}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Motivational Message */}
            <div className="mt-3 md:mt-4 flex items-center gap-2 text-xs md:text-sm text-muted-foreground bg-muted/50 px-3 py-2 rounded-lg">
                <span className="text-base">{motivation.emoji}</span>
                <span>{motivation.text}</span>
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
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-4 md:space-y-6 animate-in fade-in duration-500">

            {/* Tabs Navigation — Segmented Control */}
            <div className="bg-muted p-1 rounded-xl flex w-fit" role="tablist" aria-label="Profile sections">
                <button
                    onClick={() => setActiveTab('overview')}
                    role="tab"
                    aria-selected={activeTab === 'overview'}
                    aria-controls="panel-overview"
                    id="tab-overview"
                    className={cn(
                        "px-4 py-2 text-xs md:text-sm font-semibold rounded-lg transition-all duration-200",
                        activeTab === 'overview' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    Overview
                </button>
                {isOwnProfile && (
                    <button
                        onClick={() => setActiveTab('security')}
                        role="tab"
                        aria-selected={activeTab === 'security'}
                        aria-controls="panel-security"
                        id="tab-security"
                        className={cn(
                            "px-4 py-2 text-xs md:text-sm font-semibold rounded-lg transition-all duration-200",
                            activeTab === 'security' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Security
                    </button>
                )}
            </div>

            {activeTab === 'overview' ? (
                /* Top Layout Grid */
                <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-4 md:gap-6" role="tabpanel" id="panel-overview" aria-labelledby="tab-overview">

                    {/* Left Column: Hero & Stats */}
                    <div className="space-y-4 md:space-y-6 min-w-0">
                        {/* Identity Hero */}
                        <ProfileCard userId={targetUserId} />

                        {/* Achievement Gallery */}
                        <div className="bg-card rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm border border-border">
                            <div className="flex items-center justify-between mb-4 md:mb-6">
                                <h3 className="text-lg md:text-xl font-bold text-foreground flex items-center gap-2">
                                    <span>🎖️</span> Achievements
                                </h3>
                                <span className="text-xs md:text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full">
                                    {user.badges?.length || 0} / {Object.keys(BADGES_CONFIG).length} Unlocked
                                </span>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
                                {Object.entries(BADGES_CONFIG).map(([id, config]) => {
                                    const isUnlocked = user.badges?.includes(id);
                                    return (
                                        <div
                                            key={id}
                                            className={`group relative flex flex-col items-center p-3 md:p-4 rounded-2xl border-2 transition-all duration-300 ${isUnlocked
                                                ? 'border-warning/30 bg-warning/5 hover:shadow-lg hover:border-warning/50'
                                                : 'border-border bg-muted/50 grayscale opacity-60 hover:opacity-100'
                                                }`}
                                        >
                                            <div className={`text-4xl mb-3 transition-transform duration-300 ${isUnlocked ? 'group-hover:scale-110 drop-shadow-sm' : ''}`}>
                                                {config.icon}
                                            </div>
                                            <span className="font-bold text-xs text-center text-foreground">{config.name}</span>
                                            {isUnlocked ? (
                                                <span className="text-[10px] text-success font-bold mt-1 bg-success/15 px-2 py-0.5 rounded-full">
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
                        <ActivityHeatmap activityLog={user.activityLog || {}} />
                    </div>

                    {/* Right Column: Leaderboard */}
                    <div className="space-y-6">
                        <div className="sticky top-6">
                            <Leaderboard />
                        </div>
                    </div>
                </div>
            ) : (
                <div className="max-w-2xl mx-auto space-y-6" role="tabpanel" id="panel-security" aria-labelledby="tab-security">
                    <div className="bg-card rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm border border-border">
                        <PasswordChangeForm />
                    </div>
                </div>
            )}
        </div>
    );
};
