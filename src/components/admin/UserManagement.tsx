import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
    Users, ShieldAlert, Trash2, Shield
} from 'lucide-react';
import { env } from '../../config/env';
import { DeleteUserModal } from './DeleteUserModal';

interface User {
    id: string;
    name: string;
    role: 'admin' | 'parent' | 'kid';
    avatar?: { type: 'preset' | 'upload'; value: string };
    xp: number;
    level: number;
}

export function UserManagement() {
    const { user: currentUser, token } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Import env for host
    const PARTYKIT_HOST = env.PARTYKIT_HOST;
    const PROTOCOL = window.location.protocol === 'https:' ? 'https:' : 'http:';
    const API_URL = `${PROTOCOL}//${PARTYKIT_HOST}/parties/main/sanchez-family-os-v1`;

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await fetch(`${API_URL}/family/profiles`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setUsers(data);
            }
        } catch (err) {
            console.error("Failed to fetch users", err);
            setError("Could not load user list.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleRoleChange = async (userId: string, newRole: 'admin' | 'parent' | 'kid') => {
        // Optimistic UI update
        const originalUsers = [...users];
        setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));

        try {
            const response = await fetch(`${API_URL}/family/profiles/${userId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ role: newRole })
            });

            if (!response.ok) {
                throw new Error("Failed to update role");
            }
        } catch (err) {
            console.error("Role update failed", err);
            // Revert on failure
            setUsers(originalUsers);
            setError("Failed to update user role");
        }
    };

    const confirmDelete = async () => {
        if (!userToDelete) return;

        setIsDeleting(true);
        try {
            const response = await fetch(`${API_URL}/family/profiles/${userToDelete.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                setUsers(users.filter(u => u.id !== userToDelete.id));
                setUserToDelete(null);
            } else {
                const data = await response.json();
                setError(data.error || "Failed to delete user");
            }
        } catch (err) {
            console.error("Delete failed", err);
            setError("Could not delete user");
        } finally {
            setIsDeleting(false);
        }
    };

    if (isLoading) return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading profiles...</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
                        <Users className="w-5 h-5 text-primary" />
                        Family Members
                    </h2>
                    <p className="text-sm text-muted-foreground">Manage roles and remove accounts.</p>
                </div>
            </div>

            {error && (
                <div className="bg-destructive/10 text-destructive p-3 rounded-lg flex items-center gap-2 text-sm animate-in fade-in slide-in-from-top-2 border border-destructive/20">
                    <ShieldAlert className="w-4 h-4" />
                    {error}
                </div>
            )}

            {/* Mobile/Tablet Card View (Hidden on large screens) */}
            <div className="grid gap-4 sm:hidden animate-in fade-in zoom-in-95 duration-300">
                {users.map(user => (
                    <div key={user.id} className="bg-card rounded-xl p-4 border border-border shadow-sm relative overflow-hidden active:scale-[0.98] transition-transform duration-200">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-2xl shadow-sm border border-border overflow-hidden">
                                    {user.avatar?.type === 'upload' ? (
                                        <img src={user.avatar.value} alt={user.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="flex items-center justify-center h-full w-full">{user.avatar?.value || '👤'}</span>
                                    )}
                                </div>
                                <div>
                                    <div className="font-semibold text-lg text-foreground flex items-center gap-2">
                                        {user.name}
                                        {user.id === currentUser?.id && (
                                            <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                                You
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full flex items-center gap-1 border
                                            ${user.role === 'admin' ? 'bg-primary/10 text-primary border-primary/20' :
                                                user.role === 'parent' ? 'bg-secondary text-secondary-foreground border-secondary-foreground/20' :
                                                    'bg-accent text-accent-foreground border-accent-foreground/20'}`}>
                                            {user.role === 'admin' && <Shield className="w-3 h-3" />}
                                            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                                        </span>
                                        <span className="text-xs text-muted-foreground">Lvl {user.level || 1}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Delete Action triggers Modal */}
                            <button
                                onClick={() => setUserToDelete(user)}
                                disabled={user.id === currentUser?.id}
                                aria-label={`Delete ${user.name}`}
                                className="p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-muted-foreground"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>

                        {user.id !== currentUser?.id && (
                            <div className="mt-3 relative">
                                <select
                                    value={user.role}
                                    onChange={(e) => handleRoleChange(user.id, e.target.value as any)}
                                    aria-label={`Change role for ${user.name}`}
                                    className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-foreground appearance-none transition-shadow"
                                >
                                    <option value="kid">Kid</option>
                                    <option value="parent">Parent</option>
                                    <option value="admin">Admin</option>
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground">
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Desktop Table View (Hidden on small screens) */}
            <div className="hidden sm:block bg-card/50 backdrop-blur-xl rounded-2xl border border-border/50 shadow-lg overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-muted/50 border-b border-border/50">
                            <tr>
                                <th scope="col" className="px-6 py-4 font-semibold text-muted-foreground">User</th>
                                <th scope="col" className="px-6 py-4 font-semibold text-muted-foreground">Role</th>
                                <th scope="col" className="px-6 py-4 font-semibold text-muted-foreground">Level</th>
                                <th scope="col" className="px-6 py-4 font-semibold text-muted-foreground text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {users.map(user => (
                                <tr key={user.id} className="group hover:bg-muted/50 transition-colors duration-200">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-xl shadow-sm border border-border overflow-hidden group-hover:scale-105 transition-transform duration-300">
                                                {user.avatar?.type === 'upload' ? (
                                                    <img src={user.avatar.value} alt={user.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="flex items-center justify-center h-full w-full">{user.avatar?.value || '👤'}</span>
                                                )}
                                            </div>
                                            <div>
                                                <div className="font-semibold text-foreground flex items-center gap-2">
                                                    {user.name}
                                                    {user.id === currentUser?.id && (
                                                        <span className="text-[10px] bg-primary text-primary-foreground px-2 py-0.5 rounded-full font-bold shadow-sm tracking-wide">YOU</span>
                                                    )}
                                                </div>
                                                <div className="text-xs text-muted-foreground font-mono opacity-60">
                                                    {user.id.substring(0, 8)}...
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {user.id === currentUser?.id ? (
                                            <div className="flex items-center gap-2 text-foreground bg-muted px-3 py-1.5 rounded-full w-fit text-xs font-medium border border-border">
                                                <Shield className="w-3.5 h-3.5 text-muted-foreground" />
                                                <span className="capitalize">{user.role}</span>
                                            </div>
                                        ) : (
                                            <div className="relative group/select w-full max-w-[140px]">
                                                <select
                                                    value={user.role}
                                                    onChange={(e) => handleRoleChange(user.id, e.target.value as any)}
                                                    className="w-full appearance-none bg-background pl-3 pr-8 py-1.5 rounded-lg border border-input hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm transition-all cursor-pointer font-medium text-foreground"
                                                >
                                                    <option value="kid">Kid</option>
                                                    <option value="parent">Parent</option>
                                                    <option value="admin">Admin</option>
                                                </select>
                                                {/* Custom Arrow */}
                                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-muted-foreground group-hover/select:text-foreground transition-colors">
                                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                                </div>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex flex-col items-center justify-center w-10 h-10 rounded-lg bg-primary/10 border border-primary/20">
                                                <span className="text-[10px] uppercase text-primary font-bold leading-none">Lvl</span>
                                                <span className="text-sm font-bold text-primary leading-none">{user.level || 1}</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-xs font-medium text-muted-foreground">{user.xp || 0} XP</span>
                                                <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden mt-0.5">
                                                    <div className="h-full bg-primary rounded-full w-2/3" /> {/* Mock progress for now */}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => setUserToDelete(user)}
                                            disabled={user.id === currentUser?.id}
                                            className="group/delete p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 disabled:opacity-0 transition-all duration-200"
                                            title="Delete User"
                                        >
                                            <Trash2 className="w-4 h-4 group-hover/delete:scale-110 transition-transform" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Confirmation Modal */}
            <DeleteUserModal
                isOpen={!!userToDelete}
                userName={userToDelete?.name || 'Unknown User'}
                onClose={() => setUserToDelete(null)}
                onConfirm={confirmDelete}
                isDeleting={isDeleting}
            />
        </div>
    );
}
