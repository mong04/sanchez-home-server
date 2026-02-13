export interface InfinityLogItem {
    id: string;
    content: string;
    tags: string[];
    createdAt: number;
}

export interface Chore {
    id: string;
    title: string;
    assignees: string[];
    currentTurnIndex: number; // Index in assignees array
    frequency: 'daily' | 'weekly';
    points: number;
    lastCompleted: number; // Timestamp
}

export interface Bill {
    id: string;
    name: string;
    amount: number;
    dueDate: number;
    isPaid: boolean;
    category: string;
}

export interface ShoppingItem {
    id: string;
    name: string;
    isChecked: boolean;
    addedBy: string;
}


export type CalendarEventType = 'appointment' | 'family' | 'reminder' | 'work' | 'school' | 'sports' | 'chore' | 'meal';


export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface RecurrenceRule {
    frequency: RecurrenceFrequency;
    interval: number; // e.g. 1 = every day, 2 = every other day
    endDate?: number; // timestamp
    count?: number; // End after N occurrences
    daysOfWeek?: number[]; // 0=Sun, 1=Mon, etc. (for weekly)
    exceptions?: number[]; // Timestamps of skipped occurrences (start time of the instance)
}

export interface CalendarEvent {
    id: string;
    title: string;
    start: number;
    end: number;
    isLocked: boolean;
    type: CalendarEventType;
    description?: string;
    location?: string;
    color?: string; // Hex code or tailwind class
    recurrence?: RecurrenceRule;
}

export interface WellnessEntry {
    id: string;
    type: 'meal' | 'exercise' | 'sleep' | 'mood';
    value: string;
    timestamp: number;
    tags: string[];
}

export interface Message {
    id: string;
    senderId: string;
    sender: string;
    text: string;
    imageBase64?: string;
    timestamp: number;
    expiresAt: number;
}

export interface User {
    id: string;
    name: string;
    role: 'admin' | 'parent' | 'kid';
    avatar?: {
        type: 'preset' | 'upload';
        value: string;
    };
    xp: number;
    level: number;
    streaks: {
        current: number;
        max: number;
        lastActivityDate: number;
    };
    badges: string[];
    vibe?: string;
    lastAvatarUpdate?: number; // Timestamp of last avatar change for XP limiting
    activityLog: Record<string, number>; // Date string (YYYY-MM-DD) -> Count
}
