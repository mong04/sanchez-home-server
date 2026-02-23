import { getEmojiForCategory } from '../../lib/emojiMapper';
import { cn } from '../../lib/utils';

interface CategoryIconProps {
    categoryName: string;
    emojiOverride?: string;
    className?: string;     // For customizing the wrapper div (e.g. w-10 h-10)
    emojiClassName?: string; // For customizing the text emoji (e.g. text-2xl)
    onClick?: () => void;
}

/**
 * A premium, rounded-square icon wrapper that renders native Emojis 
 * rather than hardcoded SVGs or static images.
 */
export function CategoryIcon({
    categoryName,
    emojiOverride,
    className,
    emojiClassName,
    onClick,
}: CategoryIconProps) {
    const emoji = emojiOverride || getEmojiForCategory(categoryName);
    const Comp = onClick ? "button" : "div";

    return (
        <Comp
            type={onClick ? "button" : undefined}
            onClick={onClick}
            className={cn(
                "flex items-center justify-center shrink-0 transition-transform",
                "bg-accent/50 dark:bg-accent/30 backdrop-blur-sm border border-border/50 shadow-sm",
                "rounded-xl",
                onClick && "hover:bg-accent/80 hover:scale-105 active:scale-95 cursor-pointer ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                className
            )}
        >
            <span
                className={cn(
                    "leading-none transform drop-shadow-sm select-none",
                    emojiClassName
                )}
            >
                {emoji}
            </span>
        </Comp>
    );
}
