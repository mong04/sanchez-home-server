import {
    isSameDay
} from 'date-fns';


// Category Accent Colors (Categorical)
// Strictly following UI/UX Guidelines: Semantic Tokens + Categorical Borders
// "Semantic Chip" Pattern: Max readability (text-foreground) + Strong ID (border-l-4)
export const getTypeColor = (type: string) => {
    switch (type) {
        // Work / Professional
        case 'work':
            return 'bg-blue-500/5 text-foreground border-l-4 border-blue-500 hover:bg-blue-500/10';

        // Family / Home
        case 'family':
            return 'bg-purple-500/5 text-foreground border-l-4 border-purple-500 hover:bg-purple-500/10';

        // Education
        case 'school':
            return 'bg-orange-500/5 text-foreground border-l-4 border-orange-500 hover:bg-orange-500/10';

        // Extracurricular
        case 'sports':
            return 'bg-emerald-500/5 text-foreground border-l-4 border-emerald-500 hover:bg-emerald-500/10';

        // Household Ops
        case 'chore':
            return 'bg-emerald-500/5 text-foreground border-l-4 border-emerald-500 hover:bg-emerald-500/10';

        // Finance
        case 'bill':
            return 'bg-rose-500/5 text-foreground border-l-4 border-rose-500 hover:bg-rose-500/10';

        // Meals
        case 'meal':
            return 'bg-amber-500/5 text-foreground border-l-4 border-amber-500 hover:bg-amber-500/10';

        // General / Appointment
        case 'appointment':
        case 'reminder':
        default:
            return 'bg-sky-500/5 text-foreground border-l-4 border-sky-500 hover:bg-sky-500/10';
    }
};

// Recurrence Expansion Logic
// Extracted from original SmartPlanner.tsx
export const expandRecurringEvents = (baseEvents: any[], startRange: Date, endRange: Date) => {
    const expanded: any[] = [];

    baseEvents.forEach(event => {
        if (!event.recurrence) {
            if (event.start <= endRange.getTime() && event.end >= startRange.getTime()) {
                expanded.push(event);
            }
            return;
        }

        const { frequency, interval = 1, endDate, count, daysOfWeek, exceptions } = event.recurrence;
        const eventStart = new Date(event.start);
        const eventDuration = event.end - event.start;

        let current = new Date(eventStart);
        let index = 0; // Total occurrence index

        let iterations = 0;
        const MAX_ITERATIONS = 2000;

        while (
            (endDate ? current.getTime() <= endDate : true) &&
            (count ? index < count : true)
        ) {
            iterations++;
            if (iterations > MAX_ITERATIONS) break;

            if (current.getTime() > endRange.getTime()) break;

            let isValidInstance = true;
            if (frequency === 'weekly' && daysOfWeek && daysOfWeek.length > 0) {
                if (!daysOfWeek.includes(current.getDay())) {
                    isValidInstance = false;
                }
            }

            if (isValidInstance && exceptions && exceptions.some((ex: number) => isSameDay(new Date(ex), current))) {
                isValidInstance = false;
            }

            if (isValidInstance) {
                const instanceEnd = new Date(current.getTime() + eventDuration);

                // Only add if it overlaps with view range
                if (instanceEnd.getTime() >= startRange.getTime() && current.getTime() <= endRange.getTime()) {
                    expanded.push({
                        ...event,
                        id: `${event.id}_recur_${index}`,
                        start: current.getTime(),
                        end: instanceEnd.getTime(),
                        originalId: event.id // Keep ref to original
                    });
                }
                index++;
            }

            // Advance
            switch (frequency) {
                case 'daily':
                    current.setDate(current.getDate() + interval);
                    break;
                case 'weekly':
                    if (daysOfWeek && daysOfWeek.length > 0) {
                        const currentDayIdx = current.getDay();
                        const sortedDays = [...daysOfWeek].sort((a, b) => a - b);
                        const nextDayInWeek = sortedDays.find(d => d > currentDayIdx);

                        if (nextDayInWeek !== undefined) {
                            const diff = nextDayInWeek - currentDayIdx;
                            current.setDate(current.getDate() + diff);
                        } else {
                            const firstDayOfNext = sortedDays[0];
                            current.setDate(current.getDate() + (7 - current.getDay()));
                            current.setDate(current.getDate() + (interval - 1) * 7);
                            current.setDate(current.getDate() + firstDayOfNext);
                        }
                    } else {
                        current.setDate(current.getDate() + (interval * 7));
                    }
                    break;
                case 'monthly':
                    current.setMonth(current.getMonth() + interval);
                    break;
                case 'yearly':
                    current.setFullYear(current.getFullYear() + interval);
                    break;
                default:
                    current = new Date(endRange.getTime() + 1000); // Break
                    break;
            }
        }
    });
    return expanded;
};

// Filter Logic Helper
export const getFilteredEvents = (
    events: any[],
    viewStart: Date,
    viewEnd: Date,
    searchQuery: string,
    activeFilters: string[]
) => {
    let processedEvents = expandRecurringEvents(events, viewStart, viewEnd);

    // Text Search
    if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        processedEvents = processedEvents.filter(e =>
            e.title.toLowerCase().includes(query) ||
            e.description?.toLowerCase().includes(query) ||
            e.location?.toLowerCase().includes(query)
        );
    }

    // Type Filter
    if (activeFilters.length > 0) {
        processedEvents = processedEvents.filter(e => activeFilters.includes(e.type));
    }

    return processedEvents;
};
