import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Copy, Check, ShieldAlert, Lock } from 'lucide-react';

export function AdminDashboard() {
    const { user } = useAuth();
    const [copied, setCopied] = useState(false);

    const INVITE_CODE = "SANCHEZ-KIDS-2025"; // Hardcoded for Phase 10a

    const copyToClipboard = () => {
        navigator.clipboard.writeText(INVITE_CODE);
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
                                Share this code to onboard new devices.
                            </p>
                        </div>
                    </div>

                    <div className="bg-muted/50 p-4 rounded-lg flex items-center justify-between group relative overflow-hidden">
                        <code className="font-mono text-lg font-bold tracking-wider text-primary">
                            {INVITE_CODE}
                        </code>
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
                    </div>
                </div>
            </div>
        </div>
    );
}
