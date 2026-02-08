import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, Shield, Baby, CheckCircle2 } from 'lucide-react';

export function ProfileSetup() {
    const { updateProfile } = useAuth();
    const [name, setName] = useState('');
    const [role, setRole] = useState<'parent' | 'kid' | 'admin'>('kid');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setIsSubmitting(true);

        // Simulate API delay
        setTimeout(() => {
            updateProfile({
                id: crypto.randomUUID(),
                name: name.trim(),
                role: role,
                avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
            });
        }, 800);
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans text-slate-100">
            <div className="w-full max-w-lg space-y-8 animate-in fade-in zoom-in-95 duration-500">

                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight text-white">
                        Welcome to the Family
                    </h1>
                    <p className="text-slate-400">
                        Let's get your profile set up.
                    </p>
                </div>

                <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-2xl">
                    <form onSubmit={handleSubmit} className="space-y-8">

                        {/* Name Input */}
                        <div className="space-y-4">
                            <label className="text-sm font-medium text-slate-300 uppercase tracking-wide">
                                What should we call you?
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-slate-950/50 border border-slate-700 rounded-xl px-4 py-4 text-lg text-white placeholder:text-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                                placeholder="e.g. Dad, Mom, Leo..."
                                autoFocus
                            />
                        </div>

                        {/* Role Selection */}
                        <div className="space-y-4">
                            <label className="text-sm font-medium text-slate-300 uppercase tracking-wide">
                                Select your role
                            </label>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    onClick={() => setRole('parent')}
                                    className={`
                    relative p-4 rounded-xl border-2 transition-all duration-300 flex flex-col items-center gap-3
                    ${role === 'parent'
                                            ? 'border-indigo-500 bg-indigo-500/10 text-white shadow-lg shadow-indigo-500/20'
                                            : 'border-slate-800 bg-slate-950/30 text-slate-500 hover:border-slate-700 hover:bg-slate-900'
                                        }
                  `}
                                >
                                    <Shield className={`w-8 h-8 ${role === 'parent' ? 'text-indigo-400' : 'text-slate-600'}`} />
                                    <span className="font-semibold">Parent</span>
                                    {role === 'parent' && (
                                        <div className="absolute top-3 right-3 text-indigo-400">
                                            <CheckCircle2 className="w-5 h-5" />
                                        </div>
                                    )}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setRole('kid')}
                                    className={`
                    relative p-4 rounded-xl border-2 transition-all duration-300 flex flex-col items-center gap-3
                    ${role === 'kid'
                                            ? 'border-emerald-500 bg-emerald-500/10 text-white shadow-lg shadow-emerald-500/20'
                                            : 'border-slate-800 bg-slate-950/30 text-slate-500 hover:border-slate-700 hover:bg-slate-900'
                                        }
                  `}
                                >
                                    <Baby className={`w-8 h-8 ${role === 'kid' ? 'text-emerald-400' : 'text-slate-600'}`} />
                                    <span className="font-semibold">Kid</span>
                                    {role === 'kid' && (
                                        <div className="absolute top-3 right-3 text-emerald-400">
                                            <CheckCircle2 className="w-5 h-5" />
                                        </div>
                                    )}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={!name || isSubmitting}
                            className={`
                w-full py-4 rounded-xl font-bold tracking-wide transition-all duration-300
                ${!name || isSubmitting
                                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5'
                                }
              `}
                        >
                            {isSubmitting ? 'Creating Profile...' : 'Enter Sanchez OS'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
