import { Modal } from './Modal';
import { cn } from '../../lib/utils';
import { useEffect, useState, useRef, useCallback, useMemo, startTransition } from 'react';
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { CATEGORIES, EMOJI_INFO, searchEmojis } from '../../lib/emojis';

interface EmojiPickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onEmojiSelect: (emoji: string) => void;
}

const RECENT_KEY = 'recent-emojis';
const MAX_RECENT = 12;

// ─── Performance-optimized EmojiButton ───
const EmojiButton = React.memo(({ emoji, onSelect, onHover }: { emoji: string; onSelect: (emoji: string) => void; onHover: (emoji: string | null) => void }) => (
    <button
        onClick={() => onSelect(emoji)}
        onMouseEnter={() => onHover(emoji)}
        onMouseLeave={() => onHover(null)}
        onPointerDown={() => onHover(emoji)}
        className={cn(
            "flex items-center justify-center text-3xl rounded-xl",
            "active:scale-95 transition-transform duration-75",
            "hover:bg-accent",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            "h-14 w-14 sm:h-12 sm:w-12 touch-manipulation"
        )}
        aria-label={`Select ${emoji}`}
        type="button"
    >
        {emoji}
    </button>
));
EmojiButton.displayName = 'EmojiButton';

// ─── Category section ───
const CategorySection = React.memo(function CategorySection({
    cat,
    handleSelect,
    handlePreview,
    categoryRefs,
}: {
    cat: typeof CATEGORIES[number];
    handleSelect: (emoji: string) => void;
    handlePreview: (emoji: string | null) => void;
    categoryRefs: React.MutableRefObject<Record<string, HTMLDivElement | null>>;
}) {
    return (
        <div
            key={cat.id}
            id={cat.id}
            ref={el => { categoryRefs.current[cat.id] = el; }}
            className="scroll-mt-4"
            style={{ contentVisibility: 'auto', containIntrinsicSize: '0 200px' }}
        >
            <h3 className="text-xs font-semibold tracking-widest text-muted-foreground mb-3 px-1 flex items-center gap-2 sticky top-0 bg-card/90 backdrop-blur-sm z-10 py-2">
                <span className="opacity-70">{cat.icon}</span> {cat.title.toUpperCase()}
            </h3>
            <div className="grid grid-cols-5 sm:grid-cols-6 gap-2 px-1">
                {cat.emojis.map(emoji => (
                    <EmojiButton key={`${cat.id}-${emoji}`} emoji={emoji} onSelect={handleSelect} onHover={handlePreview} />
                ))}
            </div>
        </div>
    );
});

export default function EmojiPickerModal({ isOpen, onClose, onEmojiSelect }: EmojiPickerModalProps) {
    const [search, setSearch] = useState('');
    const [recent, setRecent] = useState<string[]>([]);
    const [preview, setPreview] = useState<string | null>(null);
    const [activeCategory, setActiveCategory] = useState('finance');
    const [hasMounted, setHasMounted] = useState(false);

    const searchRef = useRef<HTMLInputElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({});

    const scrollToCategory = (id: string) => {
        const element = categoryRefs.current[id];
        if (element && scrollContainerRef.current) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            setActiveCategory(id);
        }
    };

    useEffect(() => {
        if (search || !isOpen || !hasMounted) return;

        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (entry.isIntersecting) {
                        setActiveCategory(entry.target.id);
                        break;
                    }
                }
            },
            { root: scrollContainerRef.current, rootMargin: '-20% 0px -70% 0px', threshold: 0.3 }
        );

        Object.values(categoryRefs.current).forEach(ref => ref && observer.observe(ref));
        return () => observer.disconnect();
    }, [search, isOpen, hasMounted]);

    useEffect(() => {
        if (isOpen) {
            const saved = localStorage.getItem(RECENT_KEY);
            if (saved) setRecent(JSON.parse(saved));

            // Defer mount animation so the modal shell appears instantly
            const timer = requestAnimationFrame(() => {
                setHasMounted(true);
                searchRef.current?.focus();
            });

            return () => cancelAnimationFrame(timer);
        } else {
            setSearch('');
            setPreview(null);
            setHasMounted(false);
        }
    }, [isOpen]);

    const addToRecent = useCallback((emoji: string) => {
        const updated = [emoji, ...recent.filter(e => e !== emoji)].slice(0, MAX_RECENT);
        setRecent(updated);
        localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
    }, [recent]);

    const handleSelect = useCallback((emoji: string) => {
        addToRecent(emoji);
        onEmojiSelect(emoji);
        onClose();
    }, [addToRecent, onEmojiSelect, onClose]);

    const handlePreview = useCallback((emoji: string | null) => {
        // Use startTransition so hover previews don't block emoji grid rendering
        startTransition(() => setPreview(emoji));
    }, []);

    const filteredEmojis = useMemo(() => {
        if (!search.trim()) return [];
        return searchEmojis(search, 48);
    }, [search]);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Choose an Icon"
            className="w-full sm:max-w-[400px] h-[80vh] sm:h-[650px] !rounded-b-none sm:!rounded-2xl"
        >
            <div className="h-full flex flex-col pt-2">
                {!search && (
                    <div className="flex gap-1 pb-4 overflow-x-auto scrollbar-hide scroll-smooth -mx-1 px-1 flex-shrink-0">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => scrollToCategory(cat.id)}
                                className={cn(
                                    "flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-xl transition-all active:scale-90",
                                    activeCategory === cat.id
                                        ? "bg-primary text-primary-foreground shadow-sm"
                                        : "hover:bg-accent text-muted-foreground"
                                )}
                                title={cat.title}
                                type="button"
                            >
                                <span className="text-xl">{cat.icon}</span>
                            </button>
                        ))}
                    </div>
                )}

                <div className="sticky top-0 z-30 bg-card pb-4 flex-shrink-0">
                    <div className="relative">
                        <input
                            ref={searchRef}
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search icons... (gas, water, car)"
                            className="w-full bg-muted/50 border border-input rounded-2xl px-4 py-3 text-base placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                        />
                        {search && (
                            <button
                                onClick={() => { setSearch(''); searchRef.current?.focus(); }}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                                type="button"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>

                <div
                    ref={scrollContainerRef}
                    className="relative flex-1 overflow-hidden"
                    style={{
                        // Skip Framer entrance animation — just show immediately
                        opacity: hasMounted ? 1 : 0,
                        transition: 'opacity 0.15s ease-out',
                    }}
                >
                    <div className="custom-scroll h-full overflow-y-auto pr-2 pb-20 space-y-6">
                        {search ? (
                            <div className="grid grid-cols-5 sm:grid-cols-6 gap-2">
                                {filteredEmojis.length > 0 ? (
                                    filteredEmojis.map(emoji => (
                                        <EmojiButton key={`search-${emoji}`} emoji={emoji} onSelect={handleSelect} onHover={handlePreview} />
                                    ))
                                ) : (
                                    <p className="col-span-full py-12 text-center text-muted-foreground">No icons found</p>
                                )}
                            </div>
                        ) : (
                            <>
                                {recent.length > 0 && (
                                    <div>
                                        <h3 className="text-xs font-semibold tracking-widest text-muted-foreground mb-3 px-1">RECENT</h3>
                                        <div className="grid grid-cols-5 sm:grid-cols-6 gap-2">
                                            {recent.map(emoji => (
                                                <EmojiButton key={`recent-${emoji}`} emoji={emoji} onSelect={handleSelect} onHover={handlePreview} />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {CATEGORIES.map(cat => (
                                    <CategorySection
                                        key={cat.id}
                                        cat={cat}
                                        handleSelect={handleSelect}
                                        handlePreview={handlePreview}
                                        categoryRefs={categoryRefs}
                                    />
                                ))}
                            </>
                        )}
                    </div>

                    <AnimatePresence>
                        {preview && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="absolute bottom-0 left-0 right-0 bg-card/95 backdrop-blur-md border-t border-border p-3 flex items-center gap-4 z-40 rounded-b-2xl shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.3)]"
                            >
                                <div className="text-5xl flex-shrink-0 drop-shadow-sm">{preview}</div>
                                <div className="min-w-0">
                                    <div className="font-bold text-lg leading-tight truncate">
                                        {EMOJI_INFO[preview]?.name || 'Unknown'}
                                    </div>
                                    <div className="text-[10px] font-bold text-primary uppercase tracking-tighter opacity-80">Click to assign category icon</div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </Modal>
    );
}
