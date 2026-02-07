import React, { useState, useRef, useEffect } from 'react';
import { useMessenger } from '../../hooks/use-messenger';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { MessageSquare, Send, Image as ImageIcon, CheckCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import { format } from 'date-fns';

export function FamilyMessenger() {
    const { messages, sendMessage } = useMessenger();
    const [inputText, setInputText] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    const handleSend = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!inputText.trim()) return;

        sendMessage(inputText.trim());
        setInputText('');
    };

    return (
        <div className="flex flex-col h-full bg-background relative selection:bg-primary/20">
            {/* Header (Optional, if not covered by AppLayout) - Keeping it clean for now */}

            {/* Message Area */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 space-y-6">
                {messages.length === 0 ? (
                    <EmptyState />
                ) : (
                    <div className="flex flex-col space-y-4 max-w-3xl mx-auto w-full">
                        <AnimatePresence initial={false}>
                            {messages.map((msg) => {
                                const isMe = msg.sender === 'User';

                                return (
                                    <motion.div
                                        key={msg.id}
                                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        layout
                                        className={cn(
                                            "flex w-full",
                                            isMe ? "justify-end" : "justify-start"
                                        )}
                                    >
                                        <div className={cn(
                                            "flex max-w-[85%] md:max-w-[70%] flex-col",
                                            isMe ? "items-end" : "items-start"
                                        )}>
                                            <div className={cn(
                                                "relative px-4 py-3 text-sm md:text-base shadow-sm break-words",
                                                isMe
                                                    ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-sm"
                                                    : "bg-secondary text-secondary-foreground rounded-2xl rounded-tl-sm"
                                            )}>
                                                {msg.text}
                                                {msg.imageBase64 && (
                                                    <img
                                                        src={msg.imageBase64}
                                                        alt="Attachment"
                                                        className="mt-2 rounded-lg max-h-48 object-cover border border-black/10"
                                                    />
                                                )}
                                            </div>

                                            <div className="flex items-center gap-1 mt-1 px-1">
                                                <span className="text-[10px] text-muted-foreground/60 font-medium">
                                                    {format(msg.timestamp, 'h:mm a')}
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
                        <div ref={scrollRef} />
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-background/80 backdrop-blur-lg border-t border-border sticky bottom-0 z-10 w-full">
                <form
                    onSubmit={handleSend}
                    className="max-w-3xl mx-auto w-full flex items-end gap-2"
                >
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="rounded-full text-muted-foreground hover:bg-secondary shrink-0"
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
                            inputText.trim()
                                ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105"
                                : "bg-muted text-muted-foreground hover:bg-muted"
                        )
                        }
                        disabled={!inputText.trim()}
                        aria-label="Send message"
                    >
                        <Send className="w-5 h-5 ml-0.5" />
                    </Button>
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
