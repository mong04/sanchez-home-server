
import React, { useEffect, useState } from 'react';
import { users } from '../../lib/yjs-provider';
import type { User } from '../../types/schema';

export const Leaderboard: React.FC = () => {
    const [allUsers, setAllUsers] = useState<User[]>([]);

    useEffect(() => {
        const updateUsers = () => {
            const usersList: User[] = [];
            users.forEach((user) => {
                usersList.push(user);
            });
            // Sort by XP descending
            usersList.sort((a, b) => (b.xp || 0) - (a.xp || 0));
            setAllUsers(usersList);
        };

        updateUsers();
        users.observe(updateUsers);

        return () => {
            users.unobserve(updateUsers);
        };
    }, []);

    return (
        <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
            <h2 className="text-xl font-bold mb-4 flex items-center text-foreground">
                <span className="text-2xl mr-2">🏆</span> Leaderboard
            </h2>

            <div className="space-y-3">
                {allUsers.map((user, index) => (
                    <div
                        key={user.id}
                        className={`flex items-center p-3 rounded-xl transition-colors ${index === 0 ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700' : 'hover:bg-muted'
                            }`}
                    >
                        {/* Rank */}
                        <div className={`w-8 font-bold text-center ${index === 0 ? 'text-2xl' : 'text-muted-foreground text-lg'
                            }`}>
                            {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                        </div>

                        {/* Avatar */}
                        <div className="mx-3">
                            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden border-2 border-background shadow-sm">
                                {user.avatar?.type === 'upload' ? (
                                    <img src={user.avatar.value} alt={user.name} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-xl">{user.avatar?.value || '👤'}</span>
                                )}
                            </div>
                        </div>

                        {/* Name & details */}
                        <div className="flex-1">
                            <h3 className="font-bold text-foreground text-sm">{user.name}</h3>
                            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                                <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-[10px] font-medium">
                                    LVL {user.level || 1}
                                </span>
                                {user.streaks?.current > 0 && (
                                    <span className="flex items-center text-orange-500 font-medium">
                                        <span className="mr-0.5">🔥</span> {user.streaks.current}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* XP */}
                        <div className="font-mono font-bold text-primary text-right">
                            {user.xp || 0} XP
                        </div>
                    </div>
                ))}

                {allUsers.length === 0 && (
                    <div className="text-center text-muted-foreground py-8">
                        No active players yet!
                    </div>
                )}
            </div>
        </div>
    );
};
