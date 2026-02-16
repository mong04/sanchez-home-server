import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Eye, EyeOff, Lock, Check, AlertCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';

const passwordSchema = z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(10, 'Password must be at least 10 characters'),
    confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

type PasswordFormValues = z.infer<typeof passwordSchema>;

export function PasswordChangeForm() {
    const { updatePassword } = useAuth();
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        watch,
        reset,
        formState: { errors }
    } = useForm<PasswordFormValues>({
        resolver: zodResolver(passwordSchema)
    });

    const newPassword = watch('newPassword', '');

    const calculateStrength = (pwd: string) => {
        if (!pwd) return 0;
        let score = 0;
        // NIST: Length is king
        if (pwd.length >= 10) score += 1;
        if (pwd.length >= 12) score += 2; // Big boost for 12+ (Passphrase territory)
        if (pwd.length >= 15) score += 1; // Excellent

        // Complexity is secondary but still good
        if (/[A-Z]/.test(pwd) && /[0-9]/.test(pwd)) score += 1;

        return Math.min(score, 5);
    };

    const strength = calculateStrength(newPassword);

    const getStrengthLabel = (s: number) => {
        if (s <= 1) return { label: 'Weak', color: 'bg-destructive' };
        if (s <= 3) return { label: 'Good', color: 'bg-yellow-500' };
        return { label: 'Strong (Passphrase)', color: 'bg-green-500' };
    };

    const strengthInfo = getStrengthLabel(strength);

    const onSubmit = async (data: PasswordFormValues) => {
        setStatus('loading');
        setErrorMessage(null);
        try {
            await updatePassword(data.currentPassword, data.newPassword, data.confirmPassword);
            setStatus('success');
            reset();
            setTimeout(() => setStatus('idle'), 3000);
        } catch (err) {
            setStatus('error');
            if (err instanceof Error) {
                setErrorMessage(err.message);
            } else {
                setErrorMessage('Failed to update password');
            }
        }
    };

    return (
        <div className="space-y-6 max-w-md w-full">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-foreground">Change Password</h3>
                <Lock className="w-5 h-5 text-muted-foreground" />
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Current Password */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Current Password</label>
                    <div className="relative">
                        <input
                            type={showCurrent ? "text" : "password"}
                            className={cn(
                                "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                                errors.currentPassword && "border-destructive focus-visible:ring-destructive"
                            )}
                            placeholder="Enter current password"
                            {...register('currentPassword')}
                        />
                        <button
                            type="button"
                            onClick={() => setShowCurrent(!showCurrent)}
                            className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                        >
                            {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>
                    {errors.currentPassword && (
                        <p className="text-sm text-destructive animate-in slide-in-from-top-1 fade-in duration-200">
                            {errors.currentPassword.message}
                        </p>
                    )}
                </div>

                {/* New Password */}
                <div className="space-y-2">
                    <div className="flex justify-between items-baseline">
                        <label className="text-sm font-medium text-foreground">New Password</label>
                        <span className="text-xs text-muted-foreground">Tip: Use a phrase like "correct-horse-battery"</span>
                    </div>
                    <div className="relative">
                        <input
                            type={showNew ? "text" : "password"}
                            autoComplete="new-password"
                            className={cn(
                                "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                                errors.newPassword && "border-destructive focus-visible:ring-destructive"
                            )}
                            placeholder="Min 10 characters (longer is better)"
                            {...register('newPassword')}
                        />
                        <button
                            type="button"
                            onClick={() => setShowNew(!showNew)}
                            className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                        >
                            {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>

                    {/* Strength Indicator */}
                    {newPassword && (
                        <div className="space-y-1 pt-1">
                            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                <motion.div
                                    className={cn("h-full", strengthInfo.color)}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(strength / 5) * 100}%` }}
                                    transition={{ duration: 0.3 }}
                                />
                            </div>
                            <p className="text-xs text-muted-foreground text-right w-full font-medium">
                                {strengthInfo.label}
                            </p>
                        </div>
                    )}

                    {errors.newPassword && (
                        <p className="text-sm text-destructive animate-in slide-in-from-top-1 fade-in duration-200">
                            {errors.newPassword.message}
                        </p>
                    )}
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Confirm New Password</label>
                    <input
                        type="password"
                        autoComplete="new-password"
                        className={cn(
                            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                            errors.confirmPassword && "border-destructive focus-visible:ring-destructive"
                        )}
                        placeholder="Re-enter new password"
                        {...register('confirmPassword')}
                    />
                    {errors.confirmPassword && (
                        <p className="text-sm text-destructive animate-in slide-in-from-top-1 fade-in duration-200">
                            {errors.confirmPassword.message}
                        </p>
                    )}
                </div>

                {/* API Error Message */}
                <AnimatePresence>
                    {status === 'error' && errorMessage && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-destructive/15 text-destructive p-3 rounded-md text-sm flex items-start gap-2"
                        >
                            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                            <span>{errorMessage}</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Success Message */}
                <AnimatePresence>
                    {status === 'success' && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-green-500/15 text-green-600 dark:text-green-400 p-3 rounded-md text-sm flex items-start gap-2"
                        >
                            <Check className="w-4 h-4 mt-0.5 shrink-0" />
                            <span>Password updated successfully!</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="pt-2">
                    <button
                        type="submit"
                        disabled={status === 'loading' || status === 'success'}
                        className={cn(
                            "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                            "bg-primary text-primary-foreground hover:bg-primary/90",
                            "h-10 px-4 py-2 w-full"
                        )}
                    >
                        {status === 'loading' ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Updating...
                            </>
                        ) : (
                            'Update Password'
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
