
import React, { useState, useRef } from 'react';
import { Badge } from './Badge';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface TagInputProps {
    label?: string;
    placeholder?: string;
    tags: string[];
    setTags: (tags: string[]) => void;
    id?: string;
    className?: string;
    description?: string;
}

export function TagInput({
    label,
    placeholder,
    tags,
    setTags,
    id,
    className,
    description
}: TagInputProps) {
    const [inputValue, setInputValue] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);
    const generatedId = React.useId();
    const inputId = id || generatedId;

    const addTag = () => {
        const trimmed = inputValue.trim();
        if (trimmed && !tags.includes(trimmed)) {
            setTags([...tags, trimmed]);
            setInputValue('');
        }
    };

    const removeTag = (index: number) => {
        setTags(tags.filter((_, i) => i !== index));
        inputRef.current?.focus();
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            addTag();
        } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
            removeTag(tags.length - 1);
        }
    };

    return (
        <div className={cn("grid w-full max-w-sm items-center gap-1.5", className)}>
            {label && (
                <label
                    htmlFor={inputId}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                    {label}
                </label>
            )}

            <div
                className={cn(
                    "flex min-h-11 w-full flex-wrap gap-2 rounded-lg border border-input bg-muted/30 px-3 py-2 text-sm shadow-sm transition-all focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
                )}
                onClick={() => inputRef.current?.focus()}
            >
                {tags.map((tag, index) => (
                    <Badge key={`${tag}-${index}`} variant="secondary" className="gap-1 pr-1">
                        {tag}
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                removeTag(index);
                            }}
                            className="ml-1 rounded-full p-0.5 hover:bg-secondary-foreground/20 focus:outline-none"
                            aria-label={`Remove ${tag}`}
                        >
                            <X className="h-3 w-3" />
                        </button>
                    </Badge>
                ))}

                <input
                    ref={inputRef}
                    id={inputId}
                    type="text"
                    className="flex-1 bg-transparent border-none outline-none placeholder:text-muted-foreground min-w-[120px]"
                    placeholder={tags.length === 0 ? placeholder : ''}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={addTag}
                />
            </div>

            {description && (
                <p className="text-[0.8rem] text-muted-foreground">
                    {description}
                </p>
            )}
        </div>
    );
}
