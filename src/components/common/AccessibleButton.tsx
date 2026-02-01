import React from 'react';

interface AccessibleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    label: string;
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    icon?: React.ReactNode;
}

export const AccessibleButton = React.forwardRef<HTMLButtonElement, AccessibleButtonProps>(
    ({ label, variant = 'primary', icon, className = '', ...props }, ref) => {

        const baseStyles = "inline-flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed";

        const variants = {
            primary: "bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-ring shadow-sm",
            secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 focus-visible:ring-ring",
            danger: "bg-destructive text-destructive-foreground hover:bg-destructive/90 focus-visible:ring-destructive",
            ghost: "bg-transparent text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring"
        };

        return (
            <button
                ref={ref}
                aria-label={label}
                className={`${baseStyles} ${variants[variant]} ${className}`}
                {...props}
            >
                {icon && <span className="mr-2" aria-hidden="true">{icon}</span>}
                {props.children || label}
            </button>
        );
    }
);

AccessibleButton.displayName = 'AccessibleButton';
