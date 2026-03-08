import { useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { UserPlus, X, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useBackend } from '../../providers/BackendProvider';

// --- Schema ---
const addUserSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address").optional().or(z.literal('')),
    role: z.enum(['admin', 'parent', 'kid']),
    initialPin: z.string().regex(/^\d{4,6}$/, "PIN must be 4-6 digits").optional().or(z.literal('')),
});

type AddUserFormValues = z.infer<typeof addUserSchema>;

interface AddUserDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onUserAdded?: () => void;
}

export function AddUserDialog({ isOpen, onClose, onUserAdded }: AddUserDialogProps) {
    const { adapter } = useBackend();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const firstInputRef = useRef<HTMLInputElement>(null);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors }
    } = useForm<AddUserFormValues>({
        resolver: zodResolver(addUserSchema),
        defaultValues: {
            role: 'kid',
            name: '',
            email: '',
            initialPin: ''
        }
    });

    // Focus management
    useEffect(() => {
        if (isOpen) {
            // Small timeout to allow animation/mounting
            setTimeout(() => firstInputRef.current?.focus(), 100);
            reset();
            setError(null);
            setSuccess(false);
        }
    }, [isOpen, reset]);

    const onSubmit = async (data: AddUserFormValues) => {
        setIsSubmitting(true);
        setError(null);

        try {
            const newUser = {
                id: uuidv4(),
                name: data.name,
                email: data.email || `${data.name.toLowerCase().replace(/\s+/g, '.')}@local`,
                role: data.role,
                pin: data.initialPin, // Note: storing PIN directly for now based on auth implementation patterns
                avatar: { type: 'preset', value: '👤' },
            };

            await adapter.create('users', newUser);

            setSuccess(true);
            setTimeout(() => {
                onClose();
                onUserAdded?.();
            }, 1500);

        } catch (err) {
            console.error("Add user failed", err);
            setError(err instanceof Error ? err.message : "Failed to create user");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Modal Content */}
            <div
                className="relative bg-background w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-border"
                role="dialog"
                aria-modal="true"
                aria-labelledby="add-user-title"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border/50">
                    <h2 id="add-user-title" className="text-xl font-bold flex items-center gap-2 text-foreground">
                        <div className="bg-primary/10 p-2 rounded-full">
                            <UserPlus className="w-5 h-5 text-primary" />
                        </div>
                        Add Family Member
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-muted-foreground hover:text-foreground hover:bg-muted p-2 rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden"
                        aria-label="Close"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <div className="p-6">
                    {success ? (
                        <div className="text-center py-8 space-y-4 animate-in fade-in slide-in-from-bottom-4">
                            <div className="mx-auto w-16 h-16 bg-success/10 text-success rounded-full flex items-center justify-center">
                                <CheckCircle2 className="w-8 h-8" />
                            </div>
                            <h3 className="text-lg font-semibold text-foreground">User Added!</h3>
                            <p className="text-muted-foreground">Redirecting...</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            {error && (
                                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2 text-destructive text-sm animate-in fade-in slide-in-from-top-2">
                                    <AlertCircle className="w-4 h-4 shrink-0" />
                                    {error}
                                </div>
                            )}

                            {/* Name */}
                            <div className="space-y-2">
                                <label htmlFor="name" className="text-sm font-medium text-foreground">FullName</label>
                                <input
                                    {...register('name')}
                                    id="name"
                                    ref={(e) => {
                                        register('name').ref(e);
                                        firstInputRef.current = e;
                                    }}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    placeholder="e.g. Maria Sanchez"
                                    aria-invalid={!!errors.name}
                                />
                                {errors.name && (
                                    <p className="text-xs text-destructive font-medium">{errors.name.message}</p>
                                )}
                            </div>

                            {/* Role */}
                            <div className="space-y-2">
                                <label htmlFor="role" className="text-sm font-medium text-foreground">Role</label>
                                <select
                                    {...register('role')}
                                    id="role"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 cursor-pointer"
                                >
                                    <option value="kid">Kid (Chores & Allowance)</option>
                                    <option value="parent">Parent (Manage Family)</option>
                                    <option value="admin">Admin (Full Access)</option>
                                </select>
                            </div>

                            {/* Email (Optional) */}
                            <div className="space-y-2">
                                <label htmlFor="email" className="text-sm font-medium text-foreground">Email (Optional)</label>
                                <input
                                    {...register('email')}
                                    id="email"
                                    type="email"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    placeholder="user@example.com"
                                />
                                {errors.email && (
                                    <p className="text-xs text-destructive font-medium">{errors.email.message}</p>
                                )}
                            </div>

                            {/* PIN (Optional) */}
                            <div className="space-y-2">
                                <label htmlFor="initialPin" className="text-sm font-medium text-foreground">Initial PIN (Optional)</label>
                                <input
                                    {...register('initialPin')}
                                    id="initialPin"
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={6}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    placeholder="1234"
                                />
                                <p className="text-[10px] text-muted-foreground">Used for quick switching on tablets.</p>
                                {errors.initialPin && (
                                    <p className="text-xs text-destructive font-medium">{errors.initialPin.message}</p>
                                )}
                            </div>


                            {/* Footer Actions */}
                            <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    disabled={isSubmitting}
                                    className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-colors disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden focus-visible:ring-offset-2"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Adding...
                                        </>
                                    ) : (
                                        <>
                                            <UserPlus className="w-4 h-4" />
                                            Create User
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
}
