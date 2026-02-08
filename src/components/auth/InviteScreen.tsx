import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Lock, ArrowRight, Loader2 } from 'lucide-react';

export function InviteScreen() {
    const { login } = useAuth();
    const [code, setCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(false);

        const success = await login(code);
        if (!success) {
            setError(true);
            setCode('');
        }
        setIsLoading(false);
    };

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
                        Secure Digital Airlock
                    </p>
                </div>

                {/* Card */}
                <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
                    {/* Decorative gradients */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50" />

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label htmlFor="invite-code" className="text-xs font-medium uppercase tracking-wider text-slate-500 ml-1">
                                Enter Access Code
                            </label>
                            <div className="relative group">
                                <input
                                    id="invite-code"
                                    type="password"
                                    value={code}
                                    onChange={(e) => {
                                        setCode(e.target.value);
                                        setError(false);
                                    }}
                                    className={`
                    w-full bg-slate-950/50 border rounded-xl px-4 py-3.5 outline-none transition-all duration-300
                    placeholder:text-slate-700 text-lg tracking-widest text-center
                    focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900
                    ${error
                                            ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20 text-red-200'
                                            : 'border-slate-800 focus:border-indigo-500 focus:ring-indigo-500/20 text-white'
                                        }
                  `}
                                    placeholder="••••-••••-••••"
                                    autoFocus
                                />
                            </div>
                            {error && (
                                <p className="text-red-400 text-xs text-center animate-in fade-in slide-in-from-top-1">
                                    Access Denied. Invalid Code.
                                </p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading || code.length < 3}
                            className={`
                w-full relative group overflow-hidden rounded-xl p-[1px]
                transition-all duration-300
                ${code.length < 3 ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02]'}
              `}
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-100 group-hover:opacity-90 transition-opacity" />
                            <div className="relative bg-slate-950/10 backdrop-blur-sm h-full rounded-xl px-4 py-3.5 flex items-center justify-center gap-2">
                                {isLoading ? (
                                    <Loader2 className="w-5 h-5 animate-spin text-white" />
                                ) : (
                                    <>
                                        <span className="font-semibold text-white">Unlock System</span>
                                        <ArrowRight className="w-4 h-4 text-indigo-200 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </div>
                        </button>
                    </form>
                </div>

                {/* Footer */}
                <p className="text-center text-xs text-slate-600">
                    Restricted Access area. Authorized personnel only.
                </p>
            </div>
        </div>
    );
}
