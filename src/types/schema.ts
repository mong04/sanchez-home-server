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

export interface CalendarEvent {
    id: string;
    title: string;
    start: number;
    end: number;
    isLocked: boolean;
    type: 'appointment' | 'family' | 'reminder';
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
    sender: string;
    text: string;
    imageBase64?: string;
    timestamp: number;
    expiresAt: number;
}
