import { motion, AnimatePresence } from 'framer-motion';
import { Check, User as UserIcon } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { User } from '../../types/schema';

interface UserPickerProps {
    users: User[];
    selectedIds: string[];
    onSelectionChange: (ids: string[]) => void;
    label?: string;
    maxSelections?: number;
    className?: string;
}

export function UserPicker({
    users,
    selectedIds,
    onSelectionChange,
    label,
    maxSelections,
    className
}: UserPickerProps) {
    const toggleUser = (userId: string) => {
        if (selectedIds.includes(userId)) {
            onSelectionChange(selectedIds.filter(id => id !== userId));
        } else {
            if (maxSelections && selectedIds.length >= maxSelections) return;
            onSelectionChange([...selectedIds, userId]);
        }
    };

    return (
        <div className={cn("space-y-3", className)}>
            {label && (
                <label className="text-xs font-medium uppercase tracking-wider text-slate-500 ml-1">
                    {label}
                </label>
            )}
            <div className="flex flex-wrap gap-3">
                {users.map((user) => {
                    const isSelected = selectedIds.includes(user.id);

                    return (
                        <button
                            key={user.id}
                            type="button"
                            onClick={() => toggleUser(user.id)}
                            className={cn(
                                "relative group flex flex-col items-center gap-2 p-2 rounded-2xl transition-all duration-300 border",
                                isSelected
                                    ? "bg-indigo-500/10 border-indigo-500/50 ring-1 ring-indigo-500/20"
                                    : "bg-slate-900/40 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60"
                            )}
                        >
                            {/* Avatar Circle */}
                            <div className={cn(
                                "w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold transition-transform duration-300 group-hover:scale-105",
                                isSelected
                                    ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                                    : "bg-slate-800 text-slate-400"
                            )}>
                                {user.avatar?.value ? (
                                    <img
                                        src={user.avatar.value}
                                        alt={user.name}
                                        className="w-full h-full rounded-full object-cover"
                                    />
                                ) : (
                                    <span>{user.name.charAt(0)}</span>
                                )}
                            </div>

                            {/* Selection indicator */}
                            <AnimatePresence>
                                {isSelected && (
                                    <motion.div
                                        initial={{ scale: 0, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0, opacity: 0 }}
                                        className="absolute -top-1 -right-1 bg-green-500 text-white rounded-full p-0.5 shadow-md border-2 border-slate-950"
                                    >
                                        <Check className="w-3 h-3" />
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* User Name */}
                            <span className={cn(
                                "text-xs font-medium transition-colors",
                                isSelected ? "text-indigo-200" : "text-slate-400"
                            )}>
                                {user.name}
                            </span>

                            {/* Hover effect light */}
                            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                        </button>
                    );
                })}

                {users.length === 0 && (
                    <div className="flex items-center gap-3 p-4 border border-dashed border-slate-800 rounded-2xl bg-slate-900/20 text-slate-500 w-full animate-pulse">
                        <UserIcon className="w-5 h-5 opacity-50" />
                        <span className="text-sm italic">Loading family profiles...</span>
                    </div>
                )}
            </div>
        </div>
    );
}
