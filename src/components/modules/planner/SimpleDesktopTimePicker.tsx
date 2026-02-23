import React from 'react';
import { cn } from '../../../lib/utils';
import { format } from 'date-fns';
import { Clock, ChevronDown } from 'lucide-react';

interface SimpleDesktopTimePickerProps {
    label?: string;
    value: string; // HH:mm format
    onChange: (value: string) => void;
    required?: boolean;
}

// Generate all 15-min time slots
const TIME_SLOTS: string[] = [];
for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 15) {
        TIME_SLOTS.push(
            `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
        );
    }
}

function formatDisplay(time: string): string {
    const [h, m] = time.split(':').map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return format(d, 'h:mm a');
}

export function SimpleDesktopTimePicker({ label, value, onChange, required }: SimpleDesktopTimePickerProps) {

    // Use native <select> for absolute maximum speed and reliability
    // It's ugly by default, but we can style it or use a very simple custom dropdown.
    // Given the request for "incredibly snappy", a styled native select is unbeatable.
    // However, let's do a custom trigger with a native-feeling absolute list for better styling control 
    // without the heaviness of the previous Command Menu.

    // Actually, to keep it "simple" and "native feel", a standard HTML <select> is the most robust.
    // But styling <option> is limited. Let's do a very lightweight custom dropdown using standard React state.

    const [isOpen, setIsOpen] = React.useState(false);
    const containerRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        if (!isOpen) return;
        const handleClick = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [isOpen]);

    return (
        <div className="w-full relative space-y-1.5" ref={containerRef}>
            {label && (
                <label className="text-sm font-medium leading-none mb-1.5 block text-foreground/80">
                    {label} {required && <span className="text-destructive">*</span>}
                </label>
            )}

            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                    isOpen && "ring-2 ring-ring ring-offset-2 border-primary"
                )}
            >
                <span className={cn("flex items-center gap-2", !value && "text-muted-foreground")}>
                    <Clock className="h-4 w-4 opacity-50" />
                    {value ? formatDisplay(value) : "Select time..."}
                </span>
                <ChevronDown className="h-4 w-4 opacity-50" />
            </button>

            {isOpen && (
                <div className="absolute z-50 top-full left-0 w-full mt-1.5 max-h-[300px] overflow-y-auto rounded-md border border-border bg-popover shadow-md scrollbar-thin animate-in fade-in-0 zoom-in-95 duration-75">
                    {TIME_SLOTS.map((time) => (
                        <button
                            key={time}
                            type="button"
                            className={cn(
                                "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 px-2.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                                value === time && "bg-accent text-accent-foreground font-medium"
                            )}
                            onClick={() => {
                                onChange(time);
                                setIsOpen(false);
                            }}
                        >
                            {formatDisplay(time)}
                            {value === time && (
                                <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
                                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
