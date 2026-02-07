import React, { useState, useMemo } from 'react';
import { useInfinityLog } from '../../hooks/use-infinity-log';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../common/Card';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { Tag, Trash2, Plus, Search, Calendar } from 'lucide-react';
import { cn } from '../../lib/utils';

export const InfinityLog: React.FC = () => {
    const { items, addItem, removeItem } = useInfinityLog();
    const [searchQuery, setSearchQuery] = useState('');
    const [newItemContent, setNewItemContent] = useState('');
    const [newItemTags, setNewItemTags] = useState('');
    const [activeTag, setActiveTag] = useState<string | null>(null);

    // Collect unique tags from all items
    const allTags = useMemo(() => {
        const tags = new Set<string>();
        items.forEach(item => item.tags?.forEach(tag => tags.add(tag)));
        return Array.from(tags).sort();
    }, [items]);

    // Filter items based on search and active tag
    const filteredItems = useMemo(() => {
        return items.filter(item => {
            const matchesSearch = item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
            const matchesTag = activeTag ? item.tags?.includes(activeTag) : true;
            return matchesSearch && matchesTag;
        });
    }, [items, searchQuery, activeTag]);

    const handleAddItem = (e: React.FormEvent) => {
        e.preventDefault();
        if (newItemContent.trim()) {
            const tags = newItemTags.split(',').map(s => s.trim()).filter(Boolean);
            addItem(newItemContent, tags);
            setNewItemContent('');
            setNewItemTags('');
        }
    };

    const toggleTag = (tag: string) => {
        setActiveTag(prev => prev === tag ? null : tag);
    };

    return (
        <div className="container mx-auto p-4 max-w-5xl space-y-8 animate-in fade-in duration-500">
            {/* Header Section */}
            <header className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tight text-primary">Family Memory Bank</h2>
                <p className="text-muted-foreground">Secure, local-first key/value storage for preserving important moments.</p>
            </header>

            {/* Controls Section */}
            <section aria-label="Controls" className="grid gap-6 md:grid-cols-[2fr_1fr] items-start">
                {/* Add New Memory Form */}
                <Card className="md:col-span-2 border-primary/20 shadow-md">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Plus className="w-5 h-5 text-primary" />
                            Add Memory
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleAddItem} className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
                                <Input
                                    label="Memory Content"
                                    id="memory-content"
                                    placeholder="What do you want to remember?"
                                    value={newItemContent}
                                    onChange={(e) => setNewItemContent(e.target.value)}
                                    className="bg-background"
                                />
                            </div>
                            <div className="grid gap-4 sm:grid-cols-[1fr_auto] items-end">
                                <Input
                                    label="Tags (comma separated)"
                                    id="memory-tags"
                                    placeholder="e.g. funny, milestone, idea"
                                    value={newItemTags}
                                    onChange={(e) => setNewItemTags(e.target.value)}
                                    className="bg-background"
                                />
                                <Button type="submit" disabled={!newItemContent.trim()} className="w-full sm:w-auto">
                                    Remember
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* Search & Filter */}
                <div className="md:col-span-2 space-y-4">
                    <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                        <div className="relative w-full sm:max-w-md">
                            <Input
                                label="Search Memories"
                                id="search-memories"
                                placeholder="Search content or tags..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                            <Search className="absolute left-3 top-[34px] w-4 h-4 text-muted-foreground pointer-events-none" />
                        </div>
                        <div className="text-sm font-medium text-muted-foreground">
                            {filteredItems.length} {filteredItems.length === 1 ? 'Entry' : 'Entries'}
                        </div>
                    </div>

                    {/* Tag Cloud */}
                    {allTags.length > 0 && (
                        <div role="group" aria-label="Filter by tag" className="flex flex-wrap gap-2 pt-2">
                            <span className="text-sm text-muted-foreground sr-only">Filter by tags:</span>
                            {allTags.map(tag => (
                                <button
                                    key={tag}
                                    onClick={() => toggleTag(tag)}
                                    aria-pressed={activeTag === tag}
                                    className={cn(
                                        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                                        activeTag === tag
                                            ? "bg-primary text-primary-foreground shadow-sm ring-2 ring-primary ring-offset-1"
                                            : "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-transparent"
                                    )}
                                >
                                    <Tag className="w-3 h-3" />
                                    {tag}
                                </button>
                            ))}
                            {activeTag && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setActiveTag(null)}
                                    className="h-6 text-xs px-2 hover:bg-transparent text-muted-foreground underline"
                                >
                                    Clear filter
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </section>

            {/* List Section */}
            <section aria-label="Memory List" className="space-y-4">
                {filteredItems.length === 0 ? (
                    <div className="text-center py-16 rounded-xl border border-dashed border-border bg-muted/30 flex flex-col items-center justify-center gap-3">
                        <div className="p-4 rounded-full bg-background ring-1 ring-border shadow-sm">
                            <Tag className="w-8 h-8 text-muted-foreground/50" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="font-semibold text-lg">No memories found</h3>
                            <p className="text-muted-foreground max-w-sm mx-auto">
                                We couldn't find anything matching your search. Try adjusting your filters or add a new memory!
                            </p>
                        </div>
                        {(searchQuery || activeTag) && (
                            <Button
                                variant="outline"
                                onClick={() => { setSearchQuery(''); setActiveTag(null); }}
                                className="mt-2"
                            >
                                Clear filters
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {filteredItems.slice().reverse().map(item => (
                            <Card key={item.id} className="flex flex-col h-full hover:shadow-md transition-shadow duration-200 group">
                                <CardContent className="flex-1 pt-6">
                                    <p className="text-foreground leading-relaxed whitespace-pre-wrap">{item.content}</p>
                                </CardContent>
                                <CardFooter className="flex flex-col gap-3 items-start pt-0 pb-4">
                                    <div className="w-full h-px bg-border/50 my-1" />
                                    <div className="w-full flex items-center justify-between gap-2">
                                        <div className="flex flex-wrap gap-1.5">
                                            {item.tags?.map(tag => (
                                                <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-secondary text-secondary-foreground">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="w-full flex items-center justify-between text-muted-foreground">
                                        <div className="flex items-center gap-1.5 text-xs" title={new Date(item.createdAt).toLocaleString()}>
                                            <Calendar className="w-3 h-3" />
                                            {new Date(item.createdAt).toLocaleDateString()}
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeItem(item.id)}
                                            className="h-7 w-7 opacity-0 group-hover:opacity-100 focus:opacity-100 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                                            aria-label={`Delete memory: ${item.content.substring(0, 20)}...`}
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
};
