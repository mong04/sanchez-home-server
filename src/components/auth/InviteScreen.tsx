import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Lock, ArrowRight, Loader2, Server, Mail, Key } from 'lucide-react';
import { env } from '../../config/env';

import { ForgotPasswordForm } from './ForgotPasswordForm';

export function InviteScreen() {
    const { loginWithPocketBase } = useAuth();
    const navigate = useNavigate();
    // Default to 'account' mode for Zero Trust
    const [view, setView] = useState<'login' | 'forgot-password'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(false);
    const [setupToken, setSetupToken] = useState<string | null>(null);

    React.useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const token = params.get('setup_token');
        if (token) {
            setSetupToken(token);
        }
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(false);

        if (setupToken) {
            // Unused vars: email unused in setup mode
            if (password !== confirmPassword) {
                setError(true);
                setIsLoading(false);
                alert("Passwords do not match");
                return;
            }

            try {
                const response = await fetch(`${env.PARTYKIT_HOST}/auth/setup-password`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token: setupToken, password, passwordConfirm: confirmPassword })
                });

                if (response.ok) {
                    alert("Password set successfully! Please log in.");
                    setSetupToken(null); // Switch back to login
                    setPassword('');
                    setConfirmPassword('');
                    // Remove query param
                    window.history.replaceState({}, '', window.location.pathname);
                } else {
                    const data = await response.json();
                    alert(data.error || "Failed to set password.");
                    setError(true);
                }
            } catch (err) {
                console.error(err);
                setError(true);
            }
        } else {
            const success = await loginWithPocketBase(email, password);
            if (success) {
                navigate('/');
            } else {
                setError(true);
                setPassword('');
            }
        }
        setIsLoading(false);
    };

    if (setupToken) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans text-slate-100">
                <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="text-center space-y-2">
                        <div className="inline-flex items-center justify-center p-3 bg-indigo-500/10 rounded-full ring-1 ring-indigo-500/30 mb-4">
                            <Key className="w-8 h-8 text-indigo-400" />
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-indigo-200 via-white to-indigo-200 bg-clip-text text-transparent">
                            Setup Account
                        </h1>
                        <p className="text-slate-400 text-sm">
                            Create your secure password.
                        </p>
                    </div>

                    <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50" />
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-medium uppercase tracking-wider text-slate-500 ml-1">New Password</label>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 transition-colors"
                                        placeholder="••••••••"
                                        required
                                        minLength={8}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-medium uppercase tracking-wider text-slate-500 ml-1">Confirm Password</label>
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 transition-colors"
                                        placeholder="••••••••"
                                        required
                                        minLength={8}
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                            >
                                {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : "Set Password"}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        );
    }
    // ... Login Render (Existing) ...

    if (view === 'forgot-password') {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans text-slate-100">
                <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="text-center space-y-2">
                         <div className="inline-flex items-center justify-center p-3 bg-indigo-500/10 rounded-full ring-1 ring-indigo-500/30 mb-4">
                            <Lock className="w-8 h-8 text-indigo-400" />
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-indigo-200 via-white to-indigo-200 bg-clip-text text-transparent">
                            Account Recovery
                        </h1>
                    </div>
                     <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50" />
                        <ForgotPasswordForm onBack={() => setView('login')} />
                     </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans text-slate-100">
            <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

                {/* Header */}
                <div className="text-center space-y-2">
                    <div className="inline-flex items-center justify-center p-3 bg-indigo-500/10 rounded-full ring-1 ring-indigo-500/30 mb-4">
                        <Lock className="w-8 h-8 text-indigo-400" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-indigo-200 via-white to-indigo-200 bg-clip-text text-transparent">
                        Sanchez Family OS
                    </h1>
                    <p className="text-slate-400 text-sm">
                        Secure Digital Vault
                    </p>
                </div>

                {/* Card */}
                <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
                    {/* Decorative gradients */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50" />

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="space-y-2">
                                <label htmlFor="email" className="text-xs font-medium uppercase tracking-wider text-slate-500 ml-1">
                                    Email Address
                                </label>
                                <div className="relative group">
                                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-indigo-400 transition-colors" />
                                    <input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => {
                                            setEmail(e.target.value);
                                            setError(false);
                                        }}
                                        className={`
                                            w-full bg-slate-950/50 border rounded-xl pl-10 pr-4 py-3 outline-none transition-all duration-300
                                            placeholder:text-slate-700 text-sm
                                            focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900
                                            ${error
                                                ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20'
                                                : 'border-slate-800 focus:border-indigo-500 focus:ring-indigo-500/20'
                                            }
                                        `}
                                        placeholder="user@sanchez.local"
                                        required
                                        autoFocus
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className='flex justify-between items-center'>
                                     <label htmlFor="password" className="text-xs font-medium uppercase tracking-wider text-slate-500 ml-1">
                                        Password
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => setView('forgot-password')}
                                        className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                                    >
                                        Forgot Password?
                                    </button>
                                </div>
                               
                                <div className="relative group">
                                    <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-indigo-400 transition-colors" />
                                    <input
                                        id="password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => {
                                            setPassword(e.target.value);
                                            setError(false);
                                        }}
                                        className={`
                                            w-full bg-slate-950/50 border rounded-xl pl-10 pr-4 py-3 outline-none transition-all duration-300
                                            placeholder:text-slate-700 text-sm
                                            focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900
                                            ${error
                                                ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20'
                                                : 'border-slate-800 focus:border-indigo-500 focus:ring-indigo-500/20'
                                            }
                                        `}
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {error && (
                            <p className="text-red-400 text-xs text-center animate-in fade-in slide-in-from-top-1">
                                Invalid email or password.
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading || !email || !password}
                            className={`
                                w-full relative group overflow-hidden rounded-xl p-[1px]
                                transition-all duration-300
                                ${(!email || !password) ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02]'}
                            `}
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-100 group-hover:opacity-90 transition-opacity" />
                            <div className="relative bg-slate-950/10 backdrop-blur-sm h-full rounded-xl px-4 py-3.5 flex items-center justify-center gap-2">
                                {isLoading ? (
                                    <Loader2 className="w-5 h-5 animate-spin text-white" />
                                ) : (
                                    <>
                                        <span className="font-semibold text-white">
                                            Open Vault
                                        </span>
                                        <ArrowRight className="w-4 h-4 text-indigo-200 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </div>
                        </button>
                    </form>
                </div>

                {/* Footer */}
                <div className="text-center space-y-2">
                    <p className="text-xs text-slate-600">
                        Zero Trust Architecture Enabled.
                    </p>
                    <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-slate-900/50 border border-slate-800 text-[10px] text-slate-500">
                        <Server className="w-3 h-3" />
                        <span>Identity Provider: PocketBase</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

