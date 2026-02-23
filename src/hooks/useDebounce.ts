import { useState, useEffect } from 'react';

/**
 * Returns a debounced version of `value` that only updates after
 * `delay` ms of inactivity. Use this to prevent expensive operations
 * (e.g. search, animations) from firing on every keystroke.
 */
export function useDebounce<T>(value: T, delay: number = 150): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(timer);
    }, [value, delay]);

    return debouncedValue;
}
