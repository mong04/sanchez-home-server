import { useState, useMemo, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { Plus } from 'lucide-react';
import { cn } from '../../lib/utils';
import { searchEmojis } from '../../lib/emojis';
import { useDebounce } from '../../hooks/useDebounce';

const EmojiPickerModal = lazy(() =>
    import('./EmojiPickerModal').then(m => ({ default: m.EmojiPickerModal }))
);

interface PredictiveEmojiBarProps {
    /** The category name (or any string) used to derive emoji suggestions. */
    searchTerm: string;
    /** The current emoji already selected (to visually highlight it). */
    currentEmoji?: string;
    /** Called when the user picks an emoji from the bar or full modal. */
    onSelect: (emoji: string) => void;
    /** Optional Tailwind classes for the outer container */
    className?: string;
}

/**
 * Stagger variants — only used on FIRST appearance.
 * After that we crossfade individual items to avoid visual noise on every keystroke.
 */
const CONTAINER_VARIANTS: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.045, delayChildren: 0.02 } },
    exit: {},
};

const ITEM_ENTER_VARIANTS: Variants = {
    hidden: { opacity: 0, scale: 0.65, y: 6 },
    show: {
        opacity: 1, scale: 1, y: 0,
        transition: { type: 'spring', stiffness: 420, damping: 24 },
    },
    exit: { opacity: 0, scale: 0.85, transition: { duration: 0.1 } },
};

/**
 * PredictiveEmojiBar renders 5 contextually-matched emoji + a lazy "More" trigger.
 *
 * Performance strategy:
 *  - `searchTerm` is debounced internally (150 ms) → animations only fire when
 *    the user *pauses* typing, not on every keystroke.
 *  - The full EmojiPickerModal is lazily imported and never mounted until clicked.
 *  - `searchEmojis()` is a plain O(n) loop over ~150 objects → < 0.1 ms per call.
 */
export function PredictiveEmojiBar({
    searchTerm,
    currentEmoji,
    onSelect,
    className,
}: PredictiveEmojiBarProps) {
    const [fullPickerOpen, setFullPickerOpen] = useState(false);

    // ▸ Debounce: wait for the user to pause before recomputing suggestions.
    //   This eliminates animation churn while typing fast.
    const debouncedTerm = useDebounce(searchTerm, 150);

    const suggestions = useMemo(
        () => searchEmojis(debouncedTerm, 5),
        [debouncedTerm]
    );

    // Stable key for the AnimatePresence group — only changes after debounce settles.
    const groupKey = suggestions.join('|');

    const handleFullPickerSelect = (emoji: string) => {
        onSelect(emoji);
        setFullPickerOpen(false);
    };

    return (
        <>
            {/* Outer wrapper is always visible immediately — no layout shift */}
            <div
                className={cn('flex items-center gap-1.5 min-h-[40px]', className)}
                role="group"
                aria-label="Suggested emoji"
            >
                {/*
                 * AnimatePresence wraps the whole group so that when suggestions
                 * change (after debounce), the old set fades out and the new set
                 * staggers in — creating a smooth crossfade-like feel.
                 */}
                <AnimatePresence mode="popLayout" initial={false}>
                    <motion.div
                        key={groupKey}
                        variants={CONTAINER_VARIANTS}
                        initial="hidden"
                        animate="show"
                        exit="exit"
                        className="flex items-center gap-1.5"
                    >
                        {suggestions.map((emoji) => (
                            <motion.button
                                key={emoji}
                                variants={ITEM_ENTER_VARIANTS}
                                layout
                                type="button"
                                onClick={() => onSelect(emoji)}
                                aria-label={`Select ${emoji}`}
                                whileTap={{ scale: 0.88 }}
                                className={cn(
                                    'h-10 w-10 rounded-xl text-xl flex items-center justify-center transition-colors',
                                    'hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                                    currentEmoji === emoji
                                        ? 'bg-primary/15 ring-2 ring-primary/40 scale-105'
                                        : 'bg-muted/70 hover:bg-muted'
                                )}
                            >
                                {emoji}
                            </motion.button>
                        ))}
                    </motion.div>
                </AnimatePresence>

                {/* "More" button — always visible, never animated (stable anchor) */}
                <button
                    type="button"
                    onClick={() => setFullPickerOpen(true)}
                    aria-label="Browse all emoji"
                    title="Browse all emoji"
                    className={cn(
                        'h-10 w-10 rounded-xl flex items-center justify-center shrink-0',
                        'bg-muted/50 border border-dashed border-border/70',
                        'hover:bg-accent hover:border-primary/40 text-muted-foreground hover:text-primary',
                        'transition-colors active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                    )}
                >
                    <Plus className="w-4 h-4" />
                </button>
            </div>

            {/* Lazy-loaded full modal — only mounted when explicitly opened */}
            {fullPickerOpen && (
                <Suspense fallback={null}>
                    <EmojiPickerModal
                        isOpen={fullPickerOpen}
                        onClose={() => setFullPickerOpen(false)}
                        onEmojiSelect={handleFullPickerSelect}
                    />
                </Suspense>
            )}
        </>
    );
}
