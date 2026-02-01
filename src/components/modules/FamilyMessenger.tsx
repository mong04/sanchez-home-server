import { useState, useRef, useEffect } from 'react';
import { useMessenger } from '../../hooks/use-messenger';
import { compressImage } from '../../utils/image-compression';
import { Camera, Send, Image as ImageIcon } from 'lucide-react';

export function FamilyMessenger() {
    const { messages, sendMessage } = useMessenger();
    const [inputValue, setInputValue] = useState('');
    const [isSending, setIsSending] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const endOfMessagesRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!inputValue.trim()) return;

        try {
            setIsSending(true);
            sendMessage(inputValue);
            setInputValue('');
        } finally {
            setIsSending(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setIsSending(true);
            const base64 = await compressImage(file);
            sendMessage('Sent a photo', base64);
        } catch (error) {
            console.error('Failed to process image:', error);
            alert('Failed to send image. It might be too large.');
        } finally {
            setIsSending(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-12rem)] bg-card rounded-xl shadow-sm border border-border overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-border bg-muted/30 flex items-center justify-between">
                <h2 className="font-bold text-foreground flex items-center gap-2">
                    <span className="p-2 bg-primary/10 text-primary rounded-lg">
                        <ImageIcon size={20} />
                    </span>
                    Family Messenger
                </h2>
                <div className="text-xs text-muted-foreground">
                    Messages expire after 24 hours
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                        <p>No messages yet.</p>
                        <p className="text-sm">Start the conversation!</p>
                    </div>
                ) : (
                    messages.map((msg) => {
                        const isMe = msg.sender === 'User'; // In real app, check ID
                        return (
                            <div
                                key={msg.id}
                                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`
                                        max-w-[75%] rounded-2xl p-3 shadow-sm
                                        ${isMe
                                            ? 'bg-primary text-primary-foreground rounded-br-none'
                                            : 'bg-card border border-border text-card-foreground rounded-bl-none'
                                        }
                                    `}
                                >
                                    {msg.imageBase64 && (
                                        <div className="mb-2 rounded-lg overflow-hidden border border-white/20">
                                            <img
                                                src={msg.imageBase64}
                                                alt="Shared attachment"
                                                className="max-h-60 w-auto object-cover"
                                            />
                                        </div>
                                    )}
                                    <p className="whitespace-pre-wrap">{msg.text}</p>
                                    <div className={`
                                        text-[10px] mt-1 text-right
                                        ${isMe ? 'text-primary-foreground/80' : 'text-muted-foreground'}
                                    `}>
                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={endOfMessagesRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-card border-t border-border">
                <div className="flex gap-2 items-end">
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="p-3 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
                        title="Send Photo"
                        disabled={isSending}
                    >
                        <Camera size={20} />
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageUpload}
                    />

                    <div className="flex-1 relative">
                        <textarea
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Type a message..."
                            className="w-full bg-input/10 border border-input rounded-xl px-4 py-3 pr-10 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-none max-h-32"
                            rows={1}
                            disabled={isSending}
                        />
                    </div>

                    <button
                        onClick={handleSend}
                        disabled={!inputValue.trim() || isSending}
                        className={`
                            p-3 rounded-xl transition-all focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none
                            ${!inputValue.trim()
                                ? 'bg-muted text-muted-foreground'
                                : 'bg-primary text-primary-foreground shadow-md hover:bg-primary/90 active:scale-95'
                            }
                        `}
                    >
                        <Send size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
}
