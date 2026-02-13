import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Copy, Check, ShieldAlert, Lock, Fingerprint, Loader2 } from 'lucide-react';
import { env } from '../../config/env';
import { UserManagement } from '../admin/UserManagement';

export function AdminDashboard() {
    const { user, token, passkeySupported, registerPasskey } = useAuth();
    const [activeTab, setActiveTab] = useState<'overview' | 'users'>('overview');
    const [inviteCode, setInviteCode] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [passkeyLoading, setPasskeyLoading] = useState(false);
    const [passkeyStatus, setPasskeyStatus] = useState<{ success?: boolean; message?: string } | null>(null);

    // Import env for host
    const PARTYKIT_HOST = env.PARTYKIT_HOST;
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

    const handleRegisterPasskey = async () => {
        setPasskeyLoading(true);
        setPasskeyStatus(null);

        const deviceName = navigator.userAgent.includes('iPhone') ? 'iPhone'
            : navigator.userAgent.includes('Android') ? 'Android'
                : navigator.userAgent.includes('Mac') ? 'Mac'
                    : navigator.userAgent.includes('Windows') ? 'Windows PC'
                        : 'Device';

        const result = await registerPasskey(deviceName);

        if (result.success) {
            setPasskeyStatus({ success: true, message: 'Passkey registered successfully!' });
        } else {
            setPasskeyStatus({ success: false, message: result.error || 'Failed to register passkey' });
        }
        setPasskeyLoading(false);
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

            {/* Segmented Control (iPadOS Style) */}
            <div
                className="relative flex p-1 bg-muted/80 backdrop-blur-md rounded-xl border border-border/50 shadow-inner"
                role="tablist"
                aria-label="Admin Sections"
            >
                {/* Sliding Background */}
                <div
                    className={`absolute top-1 bottom-1 rounded-lg bg-background shadow-sm transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)] ${activeTab === 'overview' ? 'left-1 w-[calc(50%-4px)]' : 'left-[50%] w-[calc(50%-4px)]'
                        }`}
                    aria-hidden="true"
                />

                <button
                    role="tab"
                    aria-selected={activeTab === 'overview'}
                    aria-controls="overview-panel"
                    id="overview-tab"
                    onClick={() => setActiveTab('overview')}
                    className={`relative z-10 w-1/2 py-2 text-sm font-semibold transition-colors duration-200 ${activeTab === 'overview'
                        ? 'text-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                        }`}
                >
                    System Overview
                </button>
                <button
                    role="tab"
                    aria-selected={activeTab === 'users'}
                    aria-controls="users-panel"
                    id="users-tab"
                    onClick={() => setActiveTab('users')}
                    className={`relative z-10 w-1/2 py-2 text-sm font-semibold transition-colors duration-200 ${activeTab === 'users'
                        ? 'text-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                        }`}
                >
                    User Management
                </button>
            </div>

            {activeTab === 'overview' ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 animate-in fade-in slide-in-from-left-4 duration-300">
                    {/* Invite Code Card */}
                    <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
                        <div className="flex items-start justify-between">
                            <div className="space-y-1">
                                <h3 className="font-semibold flex items-center gap-2">
                                    <Lock className="w-4 h-4 text-primary" />
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
                                    className="w-full py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors font-medium disabled:opacity-50"
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

                    {/* Passkey Registration Card */}
                    {passkeySupported && (
                        <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
                            <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                    <h3 className="font-semibold flex items-center gap-2">
                                        <Fingerprint className="w-4 h-4 text-primary" />
                                        Passkey Security
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        Use Face ID or fingerprint for faster login.
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <button
                                    onClick={handleRegisterPasskey}
                                    disabled={passkeyLoading}
                                    className="w-full py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {passkeyLoading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span>Registering...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Fingerprint className="w-4 h-4" />
                                            <span>Register Passkey</span>
                                        </>
                                    )}
                                </button>

                                {passkeyStatus && (
                                    <p className={`text-sm text-center ${passkeyStatus.success ? 'text-emerald-500' : 'text-red-400'}`}>
                                        {passkeyStatus.message}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                    <UserManagement />
                </div>
            )}
        </div>
    );
}
