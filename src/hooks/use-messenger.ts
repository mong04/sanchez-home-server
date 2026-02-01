import { useState, useEffect, useCallback } from 'react';
import { messages } from '../lib/yjs-provider';
import type { Message } from '../types/schema';
import { v4 as uuidv4 } from 'uuid';

export function useMessenger() {
    const [messageList, setMessageList] = useState<Message[]>(messages.toArray());

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

    const sendMessage = useCallback((text: string, imageBase64?: string) => {
        const newMessage: Message = {
            id: uuidv4(),
            sender: 'User', // In a real app this would be dynamic
            text,
            imageBase64,
            timestamp: Date.now(),
            expiresAt: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
        };
        messages.push([newMessage]);
    }, []);

    return {
        messages: messageList,
        sendMessage,
        cleanupExpiredMessages
    };
}
