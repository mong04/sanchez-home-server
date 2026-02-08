import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Copy, Check, ShieldAlert, Lock } from 'lucide-react';

export function AdminDashboard() {
    const { user, token } = useAuth();
    const [inviteCode, setInviteCode] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Import env for host
    const PARTYKIT_HOST = "127.0.0.1:1999"; // TODO: Use env.PARTYKIT_HOST if compatible or pass via Context
    const PROTOCOL = window.location.protocol === 'https:' ? 'https:' : 'http:';
    const API_URL = `${PROTOCOL}//${PARTYKIT_HOST}/parties/main/sanchez-family-os-v1`;

    const generateCode = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`${API_URL}/admin/invite`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            const data = await response.json();
            if (data.code) {
                setInviteCode(data.code);
            }
        } catch (error) {
            console.error("Failed to generate code:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const copyToClipboard = () => {
        if (!inviteCode) return;
        navigator.clipboard.writeText(inviteCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (user?.role !== 'admin' && user?.role !== 'parent') {
        return (
            <div className="flex h-full items-center justify-center p-8">
                <div className="text-center space-y-4 max-w-md">
                    <div className="bg-red-500/10 p-4 rounded-full inline-flex">
                        <ShieldAlert className="w-12 h-12 text-red-500" />
                    </div>
                    <h2 className="text-2xl font-bold">Access Restricted</h2>
                    <p className="text-muted-foreground">
                        You do not have permission to view this area.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Admin Console</h1>
                    <p className="text-muted-foreground">Manage system access and settings.</p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Invite Code Card */}
                <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
                    <div className="flex items-start justify-between">
                        <div className="space-y-1">
                            <h3 className="font-semibold flex items-center gap-2">
                                <Lock className="w-4 h-4 text-indigo-500" />
                                Invite System
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                Generate a one-time code for new devices.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {!inviteCode ? (
                            <button
                                onClick={generateCode}
                                disabled={isLoading}
                                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors font-medium disabled:opacity-50"
                            >
                                {isLoading ? "Generating..." : "Generate New Code"}
                            </button>
                        ) : (
                            <div className="bg-muted/50 p-4 rounded-lg flex items-center justify-between group relative overflow-hidden animate-in fade-in zoom-in-95">
                                <code className="font-mono text-lg font-bold tracking-wider text-primary">
                                    {inviteCode}
                                </code>
                                <div className="flex gap-2">
                                    <button
                                        onClick={copyToClipboard}
                                        className="p-2 hover:bg-background rounded-md transition-colors"
                                        title="Copy to clipboard"
                                    >
                                        {copied ? (
                                            <Check className="w-5 h-5 text-emerald-500" />
                                        ) : (
                                            <Copy className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                        )}
                                    </button>
                                    <button
                                        onClick={() => setInviteCode(null)}
                                        className="p-2 hover:bg-background rounded-md transition-colors text-xs text-muted-foreground"
                                        title="Clear"
                                    >
                                        Clear
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
