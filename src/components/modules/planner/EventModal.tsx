import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { Modal } from '../../common/Modal';
import { Button } from '../../common/Button';
import { Input } from '../../common/Input';
import { ResponsiveTimePicker } from './ResponsiveTimePicker';
import type { CalendarEventType, RecurrenceFrequency } from '../../../types/schema';
import { Trash2 } from 'lucide-react';


// Helper types for the form
export interface EventFormValues {
    id?: string;
    title: string;
    start: number;
    end: number;
    type: CalendarEventType;
    description: string;
    location: string;
    recurrence: {
        frequency: RecurrenceFrequency | 'none';
        interval: number;
        endDate?: number;
        count?: number;
    };
    editScope: 'this' | 'all'; // For recurring updates
    isCompleted?: boolean;
}

interface EventModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: EventFormValues) => void;
    onDelete: (id: string, scope: 'this' | 'all') => void;
    initialDate?: Date;
    existingEvent?: any; // Using any to avoid complex recurrence type matching for now, should be CalendarEvent
}

export function EventModal({
    isOpen,
    onClose,
    onSave,
    onDelete,
    initialDate,
    existingEvent
}: EventModalProps) {
    // Form State
    const [title, setTitle] = useState('');
    const [date, setDate] = useState('');
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('10:00');
    const [type, setType] = useState<CalendarEventType>('appointment');
    const [description, setDescription] = useState('');
    const [location, setLocation] = useState('');

    // Recurrence State
    const [recurrenceFreq, setRecurrenceFreq] = useState<RecurrenceFrequency | 'none'>('none');
    const [recurrenceInterval, setRecurrenceInterval] = useState(1);

    const [editScope, setEditScope] = useState<'this' | 'all'>('all');

    // Completion State
    const [isCompleted, setIsCompleted] = useState(false);

    // Error State
    const [error, setError] = useState<string | null>(null);

    // Reset or Load on Open
    useEffect(() => {
        if (isOpen) {
            if (existingEvent) {
                // Edit Mode
                setTitle(existingEvent.title);
                const start = new Date(existingEvent.start);
                const end = new Date(existingEvent.end);
                setDate(format(start, 'yyyy-MM-dd'));
                setStartTime(format(start, 'HH:mm'));
                setEndTime(format(end, 'HH:mm'));
                setType(existingEvent.type || 'appointment');
                setDescription(existingEvent.description || '');
                setLocation(existingEvent.location || '');
                setIsCompleted(existingEvent.isCompleted || false);

                if (existingEvent.recurrence) {
                    setRecurrenceFreq(existingEvent.recurrence.frequency);
                    setRecurrenceInterval(existingEvent.recurrence.interval || 1);
                    setRecurrenceFreq('none');
                    setRecurrenceInterval(1);
                }
                setEditScope('all');
                setError(null);
            } else {
                // Create Mode
                setTitle('');
                const baseDate = initialDate || new Date();
                setDate(format(baseDate, 'yyyy-MM-dd'));
                setStartTime('09:00');
                setEndTime('10:00');
                setType('appointment');
                setDescription('');
                setLocation('');
                setIsCompleted(false);
                setRecurrenceFreq('none');
                setRecurrenceInterval(1);
                setEditScope('all');
                setError(null);
            }
        }
    }, [isOpen, existingEvent, initialDate]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!title.trim()) return;
        const start = new Date(`${date}T${startTime}`).getTime();
        const end = new Date(`${date}T${endTime}`).getTime();

        if (end <= start) {
            setError('End time must be after start time');
            return;
        }

        onSave({
            id: existingEvent?.id, // Might be undefined for new
            title,
            start,
            end,
            type,
            description,
            location,
            isCompleted,
            recurrence: {
                frequency: recurrenceFreq,
                interval: recurrenceInterval
            },
            editScope
        });
        onClose();
    };

    // Auto-advance end time when start time changes
    const handleStartTimeChange = useCallback((newStart: string) => {
        setStartTime(newStart);
        // Advance end time to +1 hour
        const [h, m] = newStart.split(':').map(Number);
        const endH = (h + 1) % 24;
        const newEnd = `${endH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
        setEndTime(newEnd);
    }, []);

    const isRecurring = !!existingEvent?.recurrence || (existingEvent?.id?.includes('_recur_'));

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={existingEvent ? 'Edit Event' : 'New Event'}
        >
            <form onSubmit={handleSubmit} className="space-y-4">

                {/* Title */}
                <Input
                    label="Event Title"
                    placeholder="e.g. Doctor's Appointment"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    autoFocus
                    required
                />

                {/* Scope Selection for Recurring Events */}
                {existingEvent && isRecurring && (
                    <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                        <label className="text-xs font-bold text-yellow-600 uppercase tracking-wider mb-2 block">
                            Updating Recurring Event
                        </label>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 text-sm cursor-pointer">
                                <input
                                    type="radio"
                                    name="editScope"
                                    checked={editScope === 'this'}
                                    onChange={() => setEditScope('this')}
                                    className="accent-yellow-500"
                                />
                                This event only
                            </label>
                            <label className="flex items-center gap-2 text-sm cursor-pointer">
                                <input
                                    type="radio"
                                    name="editScope"
                                    checked={editScope === 'all'}
                                    onChange={() => setEditScope('all')}
                                    className="accent-yellow-500"
                                />
                                Entire series
                            </label>
                        </div>
                    </div>
                )}

                {/* Date & Time Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 sm:col-span-1">
                        <Input
                            label="Date"
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            required
                        />
                    </div>
                    <div className="col-span-2 sm:col-span-1 grid grid-cols-2 gap-2">
                        <ResponsiveTimePicker
                            label="Start"
                            value={startTime}
                            onChange={(val) => {
                                handleStartTimeChange(val);
                                setError(null);
                            }}
                            required
                        />
                        <ResponsiveTimePicker
                            label="End"
                            value={endTime}
                            onChange={(val) => {
                                setEndTime(val);
                                setError(null);
                            }}
                            required
                        />
                    </div>
                </div>

                {/* Type & Location */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Type
                        </label>
                        <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={type}
                            onChange={(e) => setType(e.target.value as CalendarEventType)}
                        >
                            <option value="appointment">Appointment</option>
                            <option value="work">Work</option>
                            <option value="family">Family</option>
                            <option value="school">School</option>
                            <option value="sports">Sports</option>
                            <option value="chore">Chore</option>
                            <option value="meal">Meal</option>
                            <option value="reminder">Reminder</option>
                        </select>
                    </div>

                    <Input
                        label="Location"
                        placeholder="Optional"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                    />
                </div>

                {/* Description */}
                <div className="space-y-1">
                    <label className="text-sm font-medium leading-none">
                        Description
                    </label>
                    <textarea
                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                        placeholder="Add details..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </div>

                {/* Recurrence (Simple) */}
                {!initialDate && !existingEvent && (
                    <div className="p-3 bg-muted/30 rounded-lg border border-border space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium">Recurrence</label>
                            <select
                                className="h-8 text-xs rounded-md border border-input bg-background px-2"
                                value={recurrenceFreq}
                                onChange={(e) => setRecurrenceFreq(e.target.value as any)}
                            >
                                <option value="none">Does not repeat</option>
                                <option value="daily">Daily</option>
                                <option value="weekly">Weekly</option>
                                <option value="monthly">Monthly</option>
                                <option value="yearly">Yearly</option>
                            </select>
                        </div>
                    </div>
                )}

                {/* Completion Toggle (Existing Events Only) */}
                {existingEvent && (
                    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border">
                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-foreground">Mark as Complete</span>
                            <span className="text-xs text-muted-foreground">Fade out from calendar</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={isCompleted}
                                onChange={(e) => setIsCompleted(e.target.checked)}
                                className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                        </div>
                    </div>
                )}

                {error && (
                    <div className="p-3 my-2 rounded-xl bg-destructive/10 text-destructive border border-destructive/20 text-sm font-medium animate-in fade-in slide-in-from-bottom-2">
                        {error}
                    </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
                    {existingEvent && (
                        <Button
                            type="button"
                            variant="destructive"
                            className="mr-auto"
                            onClick={() => onDelete(existingEvent.id, editScope)}
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                        </Button>
                    )}
                    <Button type="button" variant="ghost" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="submit">
                        {existingEvent ? 'Save Changes' : 'Create Event'}
                    </Button>
                </div>

            </form>
        </Modal>
    );
}
