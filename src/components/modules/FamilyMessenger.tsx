import React, { useState, useRef, useEffect } from 'react';
import { useMessenger } from '../../hooks/use-messenger';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { MessageSquare, Send, Image as ImageIcon, CheckCheck, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import { format } from 'date-fns';

export function FamilyMessenger() {
    const { user, profiles } = useAuth(); // Get current user and all profiles
    const { messages, sendMessage } = useMessenger();
    const [inputText, setInputText] = useState('');
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Helper to find avatar
    const getAvatar = (senderId: string, senderName: string) => {
        const profile = profiles.find(p => p.id === senderId);
        if (profile?.avatar) {
            return profile.avatar; // Returns { type, value }
        }
        // Fallback to old behavior but wrapped in object
        return {
            type: 'url' as const,
            value: `https://api.dicebear.com/7.x/avataaars/svg?seed=${senderName}`
        };
    };

    // ... (keep useEffect for auto-scroll) ...
    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    const handleSend = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!inputText.trim() && !selectedImage) return;

        sendMessage(inputText.trim(), selectedImage ?? undefined, user ? { id: user.id, name: user.name } : undefined);
        setInputText('');
        setSelectedImage(null);
    };

    // ... (keep handleFileSelect, triggerFileInput) ...
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setSelectedImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="flex flex-col h-[calc(100vh-6rem)] md:h-[calc(100vh-4rem)] bg-background relative selection:bg-primary/20 rounded-xl overflow-hidden border border-border shadow-sm">
            {/* Header ... */}
            <div className="flex-none p-4 border-b border-border bg-background/95 backdrop-blur z-20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <MessageSquare className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-foreground">Family Chat</h3>
                        <p className="text-xs text-muted-foreground">{messages.length} messages</p>
                    </div>
                </div>
            </div>

            {/* Message Area */}
            <div className="flex-1 overflow-y-auto min-h-0 bg-background/50 p-4 md:p-6 space-y-6 scroll-smooth">
                {messages.length === 0 ? (
                    <EmptyState />
                ) : (
                    <div className="flex flex-col space-y-4 max-w-3xl mx-auto w-full pb-2">
                        <AnimatePresence initial={false}>
                            {messages.map((msg) => {
                                const isMe = msg.senderId === user?.id || (msg.sender === 'User' && !msg.senderId); // Fallback for old messages
                                const avatar = getAvatar(msg.senderId, msg.sender);

                                return (
                                    <motion.div
                                        key={msg.id}
                                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        layout
                                        className={cn(
                                            "flex w-full gap-2",
                                            isMe ? "justify-end" : "justify-start"
                                        )}
                                    >
                                        {!isMe && (
                                            <div className="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden self-end mb-1 border border-border bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                                {avatar.type === 'preset' ? (
                                                    <span className="text-lg select-none leading-none">{avatar.value}</span>
                                                ) : (
                                                    <img src={avatar.value} alt={msg.sender} className="w-full h-full object-cover" />
                                                )}
                                            </div>
                                        )}

                                        <div className={cn(
                                            "flex max-w-[85%] md:max-w-[70%] flex-col",
                                            isMe ? "items-end" : "items-start"
                                        )}>
                                            {!isMe && <span className="text-[10px] text-muted-foreground ml-1 mb-1">{msg.sender}</span>}

                                            <div className={cn(
                                                "relative px-4 py-3 text-sm md:text-base shadow-sm break-words",
                                                isMe
                                                    ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-sm"
                                                    : "bg-secondary text-secondary-foreground rounded-2xl rounded-tl-sm"
                                            )}>
                                                {msg.imageBase64 && (
                                                    <img
                                                        src={msg.imageBase64}
                                                        alt="Attachment"
                                                        className="mb-2 rounded-lg max-h-48 w-full object-cover border border-black/10 bg-black/5"
                                                    />
                                                )}
                                                {msg.text && <p>{msg.text}</p>}
                                            </div>

                                            <div className="flex items-center gap-1 mt-1 px-1">
                                                <span className="text-[10px] text-muted-foreground/60 font-medium">
                                                    {format(new Date(msg.timestamp), 'h:mm a')}
                                                </span>
                                                {isMe && (
                                                    <CheckCheck className="w-3 h-3 text-primary/60" />
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                        <div ref={scrollRef} className="h-px" />
                    </div>
                )}
            </div>

            {/* Input Area - Fixed at bottom */}
            <div className="flex-none p-4 bg-background border-t border-border z-20">
                <form
                    onSubmit={handleSend}
                    className="max-w-3xl mx-auto w-full flex flex-col gap-2"
                >
                    {/* Image Preview */}
                    <AnimatePresence>
                        {selectedImage && (
                            <motion.div
                                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                                animate={{ opacity: 1, height: 'auto', marginBottom: 8 }}
                                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                                className="relative w-fit overflow-hidden"
                            >
                                <img src={selectedImage} alt="Preview" className="h-20 rounded-lg border border-border shadow-sm" />
                                <button
                                    type="button"
                                    onClick={() => setSelectedImage(null)}
                                    className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 shadow-md hover:bg-destructive/90 transition-colors"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="flex items-end gap-2">
                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                        />
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={triggerFileInput}
                            className={cn(
                                "rounded-full text-muted-foreground hover:bg-secondary shrink-0",
                                selectedImage && "text-primary bg-primary/10"
                            )}
                            aria-label="Attach image"
                        >
                            <ImageIcon className="w-5 h-5" />
                        </Button>

                        <div className="flex-1 relative">
                            <Input
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                placeholder="Type a message..."
                                className="w-full rounded-2xl pl-4 pr-12 min-h-[44px] py-2.5 border-muted-foreground/20 focus-visible:ring-primary/50 bg-secondary/30"
                            />
                        </div>

                        <Button
                            type="submit"
                            size="icon"
                            className={cn(
                                "rounded-full shrink-0 h-11 w-11 transition-all duration-300 shadow-md",
                                inputText.trim() || selectedImage
                                    ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105"
                                    : "bg-muted text-muted-foreground hover:bg-muted"
                            )
                            }
                            disabled={!inputText.trim() && !selectedImage}
                            aria-label="Send message"
                        >
                            <Send className="w-5 h-5 ml-0.5" />
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function EmptyState() {
    return (
        <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-80 select-none">
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, type: 'spring' }}
                className="w-24 h-24 bg-gradient-to-br from-primary/20 to-secondary/30 rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-primary/5"
            >
                <MessageSquare className="w-10 h-10 text-primary" />
            </motion.div>
            <motion.h3
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-xl font-bold text-foreground mb-2"
            >
                It's quiet in here...
            </motion.h3>
            <motion.p
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-muted-foreground max-w-xs text-sm leading-relaxed"
            >
                Be the first to say hello! Share a photo or send a message to the family.
            </motion.p>
        </div>
    );
}
