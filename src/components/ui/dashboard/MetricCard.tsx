import { cva, type VariantProps } from 'class-variance-authority';
import { type LucideIcon } from 'lucide-react';
import { cn } from '../../../lib/utils';
import React from 'react';

const metricCardVariants = cva(
    'relative overflow-hidden rounded-xl border p-4 md:p-6 shadow-sm transition-all duration-300 hover:shadow-md',
    {
        variants: {
            variant: {
                neutral: 'bg-card text-card-foreground border-border',
                success: 'bg-success/10 text-success border-success/20',
                warning: 'bg-warning/10 text-warning border-warning/20',
                destructive: 'bg-destructive/10 text-destructive border-destructive/20',
                info: 'bg-info/10 text-info border-info/20',
            },
        },
        defaultVariants: {
            variant: 'neutral',
        },
    }
);

interface MetricCardProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof metricCardVariants> {
    title: string;
    value: string | number;
    subtext?: string;
    icon?: LucideIcon;
    trend?: {
        value: number;
        label: string;
        direction: 'up' | 'down' | 'neutral';
    };
}

export function MetricCard({ className, variant, title, value, subtext, icon: Icon, trend, ...props }: MetricCardProps) {
    return (
        <div className={cn(metricCardVariants({ variant, className }))} {...props}>
            <div className="flex items-center justify-between space-y-0 pb-2">
                <p className="text-xs md:text-sm font-medium opacity-80 truncate min-w-0">{title}</p>
                {Icon && (
                    <Icon className={cn("h-4 w-4 shrink-0 opacity-70",
                        variant === 'neutral' ? "text-muted-foreground" : "text-current"
                    )} />
                )}
            </div>
            <div className="flex items-baseline gap-2 flex-wrap min-w-0">
                <div className="text-xl md:text-2xl font-bold tracking-tight truncate">{value}</div>
                {subtext && (
                    <p className="text-[11px] md:text-xs opacity-70 truncate">
                        {subtext}
                    </p>
                )}
            </div>
            {trend && (
                <div className={cn("mt-2 text-xs flex items-center gap-1",
                    trend.direction === 'up' ? "text-success" :
                        trend.direction === 'down' ? "text-destructive" : "text-muted-foreground"
                )}>
                    <span>{trend.value > 0 ? '+' : ''}{trend.value}%</span>
                    <span className="opacity-70">{trend.label}</span>
                </div>
            )}
        </div>
    );
}
