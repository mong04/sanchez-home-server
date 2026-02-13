import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Shield, Baby, CheckCircle2, Camera } from 'lucide-react';
import { AvatarEditor } from '../profile/AvatarEditor';

export function ProfileSetup() {
    const { createProfile } = useAuth();
    const [name, setName] = useState('');
    const [role, setRole] = useState<'parent' | 'kid' | 'admin'>('kid');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Avatar State
    const [avatar, setAvatar] = useState<{ type: 'preset' | 'upload', value: string }>({
        type: 'preset',
        value: '🦁' // Default
    });
    const [showAvatarEditor, setShowAvatarEditor] = useState(false);

    // Update default avatar when name changes (if still using default preset type)
    useEffect(() => {
        if (avatar.type === 'preset' && name.trim()) {
            // Optional: You could dynamically change the preset based on name hash if desired,
            // but for now let's stick to a static default or the user's choice.
            // If we want to use the DiceBear logic as a fallback for 'value' if it was a URL:
            // setAvatar(prev => ({ ...prev, value: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}` }));
            // BUT, since we are using emoji presets now, let's just keep the user selection or default.
        }
    }, [name]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setIsSubmitting(true);

        try {
            await createProfile({
                name: name.trim(),
                role: role,
                avatar: avatar,
                xp: 0,
                level: 1,
                streaks: { current: 0, max: 0, lastActivityDate: 0 },
                badges: [],
                activityLog: {}
            });
        } catch (error) {
            console.error(error);
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4 font-sans text-foreground">
            <div className="w-full max-w-lg space-y-8 animate-in fade-in zoom-in-95 duration-500">

                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">
                        Welcome to the Family
                    </h1>
                    <p className="text-muted-foreground">
                        Let's get your profile set up.
                    </p>
                </div>

                <div className="bg-card/50 backdrop-blur-xl border border-border rounded-2xl p-8 shadow-2xl">
                    <form onSubmit={handleSubmit} className="space-y-8">

                        {/* Avatar Selection */}
                        <div className="flex flex-col items-center justify-center space-y-4">
                            <div className="relative group">
                                <button
                                    type="button"
                                    onClick={() => setShowAvatarEditor(true)}
                                    className="w-32 h-32 rounded-full bg-muted border-4 border-border flex items-center justify-center overflow-hidden transition-transform group-hover:scale-105 group-hover:border-primary"
                                >
                                    {avatar.type === 'preset' ? (
                                        <span className="text-6xl select-none">{avatar.value}</span>
                                    ) : (
                                        <img src={avatar.value} alt="Avatar" className="w-full h-full object-cover" />
                                    )}

                                    {/* Overlay */}
                                    <div className="absolute inset-0 bg-background/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Camera className="w-8 h-8 text-foreground" />
                                    </div>
                                </button>
                                <div className="absolute bottom-0 right-0 bg-primary rounded-full p-2 border-4 border-card">
                                    <Camera className="w-4 h-4 text-primary-foreground" />
                                </div>
                            </div>
                            <span className="text-sm text-muted-foreground">Tap to change avatar</span>
                        </div>

                        {/* Name Input */}
                        <div className="space-y-4">
                            <label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                                What should we call you?
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-background/50 border border-input rounded-xl px-4 py-4 text-lg text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:ring-1 focus:ring-ring outline-none transition-all"
                                placeholder="e.g. Dad, Mom, Leo..."
                                autoFocus
                            />
                        </div>

                        {/* Role Selection */}
                        <div className="space-y-4">
                            <label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                                Select your role
                            </label>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    onClick={() => setRole('parent')}
                                    className={`
                    relative p-4 rounded-xl border-2 transition-all duration-300 flex flex-col items-center gap-3
                    ${role === 'parent'
                                            ? 'border-primary bg-primary/10 text-foreground shadow-lg shadow-primary/20'
                                            : 'border-border bg-card/30 text-muted-foreground hover:border-muted-foreground/30 hover:bg-muted'
                                        }
                  `}
                                >
                                    <Shield className={`w-8 h-8 ${role === 'parent' ? 'text-primary' : 'text-muted-foreground/50'}`} />
                                    <span className="font-semibold">Parent</span>
                                    {role === 'parent' && (
                                        <div className="absolute top-3 right-3 text-primary">
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
                                            ? 'border-emerald-500 bg-emerald-500/10 text-foreground shadow-lg shadow-emerald-500/20'
                                            : 'border-border bg-card/30 text-muted-foreground hover:border-muted-foreground/30 hover:bg-muted'
                                        }
                  `}
                                >
                                    <Baby className={`w-8 h-8 ${role === 'kid' ? 'text-emerald-400' : 'text-muted-foreground/50'}`} />
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
                                    ? 'bg-muted text-muted-foreground cursor-not-allowed'
                                    : 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5'
                                }
              `}
                        >
                            {isSubmitting ? 'Creating Profile...' : 'Enter Sanchez OS'}
                        </button>
                    </form>
                </div>
            </div>

            {/* Avatar Editor Modal */}
            {showAvatarEditor && (
                <AvatarEditor
                    currentAvatar={avatar}
                    onSave={(type, value) => setAvatar({ type, value })}
                    onClose={() => setShowAvatarEditor(false)}
                />
            )}
        </div>
    );
}
