import { useRef } from 'react';
import { cn } from '../../../lib/utils';
import { format } from 'date-fns';
import { Clock } from 'lucide-react';

interface NativeTimePickerProps {
    label?: string;
    value: string; // HH:mm format (24h)
    onChange: (value: string) => void;
    required?: boolean;
}

function formatDisplay(time: string): string {
    if (!time) return '';
    const [h, m] = time.split(':').map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return format(d, 'h:mm a');
}

export function NativeTimePicker({ label, value, onChange, required }: NativeTimePickerProps) {
    const inputRef = useRef<HTMLInputElement>(null);

    const handleContainerClick = () => {
        // Programmatically trigger the native picker
        if (inputRef.current) {
            // showPicker() is supported in modern browsers (Chrome 99+, Safari 16+, Firefox 101+)
            if ('showPicker' in inputRef.current) {
                try {
                    (inputRef.current as any).showPicker();
                } catch (e) {
                    (inputRef.current as HTMLInputElement).focus();
                }
            } else {
                (inputRef.current as HTMLInputElement).focus();
            }
        }
    };

    return (
        <div className="w-full relative">
            {label && (
                <label className="text-sm font-medium leading-none mb-1.5 block text-foreground/80">
                    {label} {required && <span className="text-destructive">*</span>}
                </label>
            )}

            <div
                onClick={handleContainerClick}
                className={cn(
                    "flex h-12 w-full items-center justify-between rounded-xl border border-input bg-background/50 backdrop-blur-sm px-4 text-base shadow-sm ring-offset-background transition-all cursor-pointer",
                    "hover:bg-accent/50 hover:border-primary/20",
                    "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:border-primary",
                    !value && "text-muted-foreground"
                )}
            >
                <span className="font-medium text-foreground">
                    {value ? formatDisplay(value) : "Select time..."}
                </span>
                <Clock className="h-5 w-5 text-muted-foreground shrink-0" />

                {/* 
                  The generic native input. 
                  - Opacity 0 to hide it visually but keep it interactive/accessible 
                  - Absolute positioned to cover the container or be invisible but focusable
                */}
                <input
                    ref={inputRef}
                    type="time"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    required={required}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                // aria-hidden="true" // Actually we want it accessible
                />
            </div>
        </div>
    );
}
