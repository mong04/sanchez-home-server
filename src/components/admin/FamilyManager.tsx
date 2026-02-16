import { useState, useEffect } from 'react';
import { pb } from '../../lib/pocketbase';
import { useAuth } from '../../context/AuthContext';
import { Loader2, Link, RefreshCw, User as UserIcon, Shield, Copy, Check } from 'lucide-react';
import { env } from '../../config/env';

interface PBUser {
    id: string;
    email: string;
    name: string;
    role: string;
    partykit_id?: string;
    created: string;
}

export function FamilyManager() {
    const { token } = useAuth();
    const [users, setUsers] = useState<PBUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [generatedLink, setGeneratedLink] = useState<{ userId: string, url: string } | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        setIsLoading(true);
        try {
            const records = await pb.collection('users').getFullList<PBUser>({
                sort: '-created',
            });
            setUsers(records);
        } catch (error) {
            console.error("Failed to load users", error);
        } finally {
            setIsLoading(false);
        }
    };

    const generateMagicLink = async (user: PBUser, type: 'setup' | 'reset') => {
        setIsGenerating(true);
        setGeneratedLink(null);
        try {
            const response = await fetch(`${env.PARTYKIT_HOST}/admin/magic-link`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` // PartyKit verifies we are Admin (via PB token)
                },
                body: JSON.stringify({
                    userId: user.id,
                    email: user.email,
                    type // 'setup' or 'reset'
                })
            });

            if (!response.ok) throw new Error("Failed to generate link");

            const data = await response.json();
            setGeneratedLink({ userId: user.id, url: data.url });
        } catch (error) {
            console.error("Failed to generate link", error);
            alert("Error generating link. Ensure you are an Admin.");
        } finally {
            setIsGenerating(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (isLoading) {
        return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-slate-500" /></div>;
    }

    return (
        <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-800 overflow-hidden">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                        <Shield className="w-5 h-5 text-indigo-400" />
                        Family Identity
                    </h2>
                    <p className="text-sm text-slate-400 mt-1">
                        Manage users, roles, and onboarding.
                    </p>
                </div>
                <button
                    onClick={loadUsers}
                    className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                >
                    <RefreshCw className="w-4 h-4 text-slate-400" />
                </button>
            </div>

            <div className="divide-y divide-slate-800">
                {users.map(user => (
                    <div key={user.id} className="p-4 flex items-center justify-between hover:bg-slate-800/30 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                                <UserIcon className="w-5 h-5 text-slate-400" />
                            </div>
                            <div>
                                <h3 className="text-slate-200 font-medium">
                                    {user.name || "Unnamed User"}
                                </h3>
                                <p className="text-xs text-slate-500 font-mono">
                                    {user.email} • <span className="uppercase text-indigo-400">{user.role || 'user'}</span>
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {generatedLink?.userId === user.id ? (
                                <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2">
                                    <input
                                        type="text"
                                        readOnly
                                        value={generatedLink.url}
                                        className="bg-slate-950 border border-slate-700 rounded text-xs px-2 py-1 text-slate-400 w-48 truncate select-all"
                                    />
                                    <button
                                        onClick={() => copyToClipboard(generatedLink.url)}
                                        className="p-1.5 bg-indigo-500 hover:bg-indigo-600 rounded text-white transition-colors"
                                        title="Copy Link"
                                    >
                                        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                    </button>
                                </div>
                            ) : (
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => generateMagicLink(user, 'setup')}
                                        disabled={isGenerating}
                                        className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors flex items-center gap-2"
                                    >
                                        <Link className="w-3 h-3" />
                                        Setup Link
                                    </button>
                                    <button
                                        onClick={() => generateMagicLink(user, 'reset')}
                                        disabled={isGenerating}
                                        className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors"
                                    >
                                        Reset Password
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {users.length === 0 && (
                <div className="p-8 text-center text-slate-500 text-sm">
                    No users found. Create one in PocketBase Admin UI.
                </div>
            )}
        </div>
    );
}
