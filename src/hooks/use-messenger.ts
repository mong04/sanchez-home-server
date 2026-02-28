import { useState, useEffect, useCallback } from 'react';
import { messages } from '../lib/yjs-provider';
import type { Message } from '../types/schema';
import { v4 as uuidv4 } from 'uuid';
import { useBackend } from '../providers/BackendProvider';

export function useMessenger() {
    const [messageList, setMessageList] = useState<Message[]>(messages.toArray());
    const { adapter } = useBackend();

    const cleanupExpiredMessages = useCallback(() => {
        const now = Date.now();
        messages.doc?.transact(() => {
            let i = messages.length - 1;
            while (i >= 0) {
                const msg = messages.get(i);
                if (msg.expiresAt < now) {
                    messages.delete(i, 1);
                }
                i--;
            }
        });
    }, []);

    useEffect(() => {
        const updateHandler = () => {
            setMessageList(messages.toArray());
        };

        messages.observe(updateHandler);

        // Initial clean up of expired messages
        cleanupExpiredMessages();

        return () => {
            messages.unobserve(updateHandler);
        };
    }, [cleanupExpiredMessages]);

    const sendMessage = useCallback((text: string, imageBase64?: string, sender?: { id: string, name: string }) => {
        const newMessage: Message = {
            id: uuidv4(),
            senderId: sender?.id || 'anonymous',
            sender: sender?.name || 'User',
            text,
            imageBase64,
            timestamp: Date.now(),
            expiresAt: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
        };
        messages.push([newMessage]);

        // Notify family of new message
        adapter.sendPush('family', {
            title: `New message from ${sender?.name || 'Family'}`,
            body: text.length > 50 ? text.substring(0, 47) + '...' : text,
            url: "/messenger",
            icon: "/pwa-512x512.svg"
        }).catch(err => console.error('Failed to send messenger push:', err));
    }, [adapter]);

    return {
        messages: messageList,
        sendMessage,
        cleanupExpiredMessages
    };
}
