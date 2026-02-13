
import React, { useState } from 'react';
import { useGamification } from '../../hooks/use-gamification';
import { AvatarEditor } from './AvatarEditor';

interface ProfileCardProps {
    userId: string;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({ userId }) => {
    const { user, awardXP, updateAvatar, setVibe, LEVELS } = useGamification(userId);
    const [isEditingAvatar, setIsEditingAvatar] = useState(false);
    const [isEditingVibe, setIsEditingVibe] = useState(false);
    const [tempVibe, setTempVibe] = useState('');

    if (!user) return <div className="animate-pulse h-48 bg-muted rounded-3xl w-full"></div>;

    // Calculate progress
    const currentLevelXP = LEVELS[user.level - 1] || 0;
    const nextLevelXP = LEVELS[user.level] || (currentLevelXP + 1000);
    const progress = Math.min(100, Math.max(0, ((user.xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100));


    const handleVibeSave = () => {
        if (tempVibe.trim() !== user.vibe) {
            setVibe(tempVibe);
            awardXP(5, 'Updated Vibe');
        }
        setIsEditingVibe(false);
    };

    return (
        <div className="relative overflow-hidden bg-card/90 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl border border-border">
            {/* Background elements */}
            <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-primary/20 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8">
                {/* Avatar with Level Ring */}
                <div className="relative flex-shrink-0 cursor-pointer group" onClick={() => setIsEditingAvatar(true)}>
                    {/* Progress Ring SVG */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[160px] h-[160px] rotate-[-90deg]">
                        <svg className="w-full h-full text-primary" viewBox="0 0 128 128">
                            <circle cx="64" cy="64" r={60} fill="none" stroke="currentColor" strokeWidth="4" className="opacity-10" />
                            <circle cx="64" cy="64" r={60} fill="none" stroke="currentColor" strokeWidth="4"
                                strokeDasharray={2 * Math.PI * 60}
                                strokeDashoffset={(2 * Math.PI * 60) - (progress / 100) * (2 * Math.PI * 60)}
                                strokeLinecap="round"
                                className="transition-all duration-1000 ease-out shadow-[0_0_10px_currentColor]"
                            />
                        </svg>
                    </div>

                    <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-background shadow-xl bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-950/30 dark:to-violet-950/30 flex items-center justify-center relative z-10 group-hover:scale-105 transition-transform duration-300">
                        {user.avatar?.type === 'upload' ? (
                            <img src={user.avatar.value} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-6xl filter drop-shadow-md animate-bounce-subtle">{user.avatar?.value || '👤'}</span>
                        )}

                        {/* Edit Overlay - Desktop Hover */}
                        <div className="absolute inset-0 bg-background/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px] rounded-full">
                            <span className="text-foreground font-bold text-sm tracking-widest">EDIT</span>
                        </div>
                    </div>

                    {/* Mobile/Persistent Edit Indicator */}
                    <div className="absolute top-0 right-0 z-20 bg-card rounded-full p-1.5 shadow-md border border-border group-hover:scale-110 transition-transform">
                        <span className="text-xs">✏️</span>
                    </div>

                    {/* Level Pill Badge */}
                    <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 z-20">
                        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg border-2 border-background whitespace-nowrap">
                            LEVEL {user.level}
                        </div>
                    </div>
                </div>

                {/* Identity & Vibe */}
                <div className="flex-1 text-center sm:text-left space-y-2 max-w-full">
                    <h1 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">
                        {user.name}
                    </h1>

                    <div className="flex flex-col sm:flex-row items-center gap-3 text-sm">
                        {/* Vibe Bubble */}
                        <div
                            className="bg-muted/50 backdrop-blur-md px-4 py-2 rounded-2xl border border-border cursor-pointer hover:bg-muted transition-colors group/vibe max-w-full"
                            onClick={() => { setTempVibe(user.vibe || ''); setIsEditingVibe(true); }}
                        >
                            {isEditingVibe ? (
                                <input
                                    type="text"
                                    value={tempVibe}
                                    onChange={(e) => setTempVibe(e.target.value)}
                                    className="bg-transparent border-none focus:ring-0 text-foreground w-full min-w-[150px] placeholder-muted-foreground"
                                    placeholder="What's your vibe?"
                                    autoFocus
                                    onBlur={handleVibeSave}
                                    onKeyDown={(e) => e.key === 'Enter' && handleVibeSave()}
                                    maxLength={24}
                                />
                            ) : (
                                <div className="flex items-center gap-2">
                                    <span className="text-lg">💭</span>
                                    <span className="text-muted-foreground font-medium truncate">
                                        {user.vibe || "Set your vibe..."}
                                    </span>
                                    <span className="opacity-0 group-hover/vibe:opacity-50 text-xs">✎</span>
                                </div>
                            )}
                        </div>

                        {/* XP Progress Text */}
                        <span className="text-muted-foreground font-mono text-xs">
                            {user.xp} / {nextLevelXP} XP
                        </span>
                    </div>

                    {/* Quick Stats Row (Optional, if we want them in header) */}
                    <div className="pt-4 flex items-center justify-center sm:justify-start gap-6">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-foreground">{user.streaks?.current || 0} 🔥</div>
                            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Day Streak</div>
                        </div>
                        <div className="w-px h-8 bg-border"></div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-foreground">{user.badges?.length || 0} 🎖️</div>
                            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Badges</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            {isEditingAvatar && (
                <AvatarEditor
                    currentAvatar={user.avatar}
                    onSave={(type, value) => {
                        updateAvatar(type, value);
                    }}
                    onClose={() => setIsEditingAvatar(false)}
                />
            )}
        </div>
    );
};
