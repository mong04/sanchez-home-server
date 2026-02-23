import { NativeTimePicker } from './NativeTimePicker';
import { SimpleDesktopTimePicker } from './SimpleDesktopTimePicker';

interface ResponsiveTimePickerProps {
    label?: string;
    value: string; // HH:mm format
    onChange: (value: string) => void;
    required?: boolean;
}

export function ResponsiveTimePicker({ label, value, onChange, required }: ResponsiveTimePickerProps) {
    // We use CSS display: none to toggle visibility to avoid hydration mismatch
    // and ensure both are rendered but only one is functional/visible.

    return (
        <div className="w-full">
            {/* Mobile View: Visible up to md (Native Input) */}
            <div className="block md:hidden">
                <NativeTimePicker
                    label={label}
                    value={value}
                    onChange={onChange}
                    required={required}
                />
            </div>

            {/* Desktop View: Visible from md up (Simple Dropdown) */}
            <div className="hidden md:block">
                <SimpleDesktopTimePicker
                    label={label}
                    value={value}
                    onChange={onChange}
                    required={required}
                />
            </div>
        </div>
    );
}
