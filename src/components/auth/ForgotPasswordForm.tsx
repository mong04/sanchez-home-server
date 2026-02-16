import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Mail, Check, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import { pb } from '../../lib/pocketbase';
import { ClientResponseError } from 'pocketbase';

const forgotPasswordSchema = z.object({
    email: z.string().email('Please enter a valid email address'),
});

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

interface ForgotPasswordFormProps {
    onBack: () => void;
}

export function ForgotPasswordForm({ onBack }: ForgotPasswordFormProps) {
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors }
    } = useForm<ForgotPasswordValues>({
        resolver: zodResolver(forgotPasswordSchema)
    });

    const onSubmit = async (data: ForgotPasswordValues) => {
        setStatus('loading');
        setErrorMessage(null);
        try {
            await pb.collection('users').requestPasswordReset(data.email);
            setStatus('success');
        } catch (err) {
            setStatus('error');
            // Check for specific PocketBase errors if needed, but for security 
            // and local-first UX, we primarily want to guide them to the Admin.
            if (err instanceof ClientResponseError) {
                // Even if email is not found, PB might return 204 or 404.
                // We should be careful not to enumerate users, but for a home server, functionality is key.
                if (err.status === 404) {
                    setErrorMessage("Email address not found.");
                } else {
                    setErrorMessage(err.message || "Failed to send reset email.");
                }
            } else {
                setErrorMessage("An unexpected error occurred.");
            }
        }
    };

    return (
        <div className="space-y-6 w-full max-w-sm mx-auto">
            <div className="flex items-center gap-2">
                <button
                    onClick={onBack}
                    className="p-2 -ml-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="space-y-1">
                    <h3 className="text-xl font-semibold tracking-tight">Forgot password?</h3>
                    <p className="text-sm text-muted-foreground">
                        Enter your email to receive a reset link.
                    </p>
                </div>
            </div>

            {status === 'success' ? (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-card border border-border rounded-lg p-6 space-y-4 text-center shadow-sm"
                >
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto text-green-600 dark:text-green-400">
                        <Check className="w-6 h-6" />
                    </div>
                    <div>
                        <h4 className="font-medium text-foreground">Check your inbox</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                            We've sent a password reset link to your email.
                        </p>
                    </div>

                    <div className="bg-muted/50 rounded-md p-3 text-sm text-left border border-border">
                        <p className="font-medium text-foreground mb-1">Didn't get an email?</p>
                        <p className="text-muted-foreground text-xs leading-relaxed">
                            If this server doesn't have email configured (SMTP), please ask the
                            <span className="font-medium text-foreground"> Family Admin </span>
                            to reset your password manually from the Admin Dashboard.
                        </p>
                    </div>

                    <button
                        onClick={onBack}
                        className="text-sm text-primary hover:underline font-medium"
                    >
                        Back to Login
                    </button>
                </motion.div>
            ) : (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Email Address
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <input
                                type="email"
                                className={cn(
                                    "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pl-9 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                                    errors.email && "border-destructive focus-visible:ring-destructive"
                                )}
                                placeholder="name@example.com"
                                {...register('email')}
                            />
                        </div>
                        {errors.email && (
                            <p className="text-sm font-medium text-destructive">
                                {errors.email.message}
                            </p>
                        )}
                    </div>

                    {/* Error Message */}
                    <AnimatePresence>
                        {status === 'error' && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="bg-destructive/15 text-destructive p-3 rounded-md text-sm flex items-start gap-2"
                            >
                                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                                <div className="space-y-1">
                                    <p className="font-medium">{errorMessage}</p>
                                    <p className="text-xs opacity-90">
                                        Tip: Ask the Admin to reset it manually if email fails.
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <button
                        type="submit"
                        disabled={status === 'loading'}
                        className={cn(
                            "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                            "bg-primary text-primary-foreground hover:bg-primary/90",
                            "h-10 px-4 py-2 w-full shadow-sm"
                        )}
                    >
                        {status === 'loading' ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Sending Link...
                            </>
                        ) : (
                            'Send Reset Link'
                        )}
                    </button>

                    <div className="text-center">
                        <button
                            type="button"
                            onClick={onBack}
                            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                            Back to Sign In
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}
