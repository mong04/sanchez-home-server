import { useState } from 'react';
import { Eye, EyeOff, Loader2, Key, AlertCircle } from 'lucide-react';
import { env } from '../../config/env';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';

interface AdminResetPasswordModalProps {
    isOpen: boolean;
    userId: string | null;
    userName: string;
    onClose: () => void;
}

export function AdminResetPasswordModal({ isOpen, userId, userName, onClose }: AdminResetPasswordModalProps) {
    const { token } = useAuth();
    const [password, setPassword] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    const PARTYKIT_HOST = env.PARTYKIT_HOST;
    const PROTOCOL = window.location.protocol === 'https:' ? 'https:' : 'http:';
    const API_URL = `${PROTOCOL}//${PARTYKIT_HOST}/parties/main/sanchez-family-os-v1`;

    const handleReset = async () => {
        if (!userId || !password) return;
        if (password.length < 8) {
            setErrorMessage("Password must be at least 8 characters.");
            return;
        }

        setStatus('loading');
        setErrorMessage(null);

        try {
            const response = await fetch(`${API_URL}/family/profiles/${userId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ password, passwordConfirm: password })
            });

            if (response.ok) {
                setStatus('success');
                setTimeout(() => {
                    onClose();
                    // Reset state after close
                    setTimeout(() => {
                        setStatus('idle');
                        setPassword('');
                    }, 500);
                }, 2000);
            } else {
                const data = await response.json();
                throw new Error(data.error || "Failed to reset password");
            }
        } catch (err: any) {
            console.error("Reset failed", err);
            setStatus('error');
            setErrorMessage(err.message || "Failed to update password.");
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose} />
            
            <div className="relative w-full max-w-md bg-background border border-border rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6 space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                            <Key className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold leading-none">Reset Password</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                Set a new password for <span className="font-medium text-foreground">{userName}</span>.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-3 pt-2">
                        <label className="text-sm font-medium text-foreground">New Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className={cn(
                                    "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                                    status === 'error' && "border-destructive focus-visible:ring-destructive"
                                )}
                                placeholder="Min 8 characters"
                                autoFocus
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                        
                        {status === 'error' && errorMessage && (
                            <div className="text-sm text-destructive flex items-center gap-2 animate-in slide-in-from-top-1">
                                <AlertCircle className="w-4 h-4" />
                                {errorMessage}
                            </div>
                        )}

                        {status === 'success' && (
                             <div className="text-sm text-green-500 flex items-center gap-2 animate-in slide-in-from-top-1 font-medium bg-green-500/10 p-2 rounded-md">
                                Password updated successfully!
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                         <button
                            onClick={onClose}
                            disabled={status === 'loading'}
                            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleReset}
                            disabled={status === 'loading' || status === 'success' || !password}
                            className={cn(
                                "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                                "bg-indigo-600 text-white hover:bg-indigo-700 h-10 px-4 py-2"
                            )}
                        >
                            {status === 'loading' ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : status === 'success' ? (
                                'Done'
                            ) : (
                                'Reset Password'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
