import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useMessenger } from '../../hooks/use-messenger';
import { MessageSquare } from 'lucide-react';

export function GlobalNotifications() {
    const { user } = useAuth();
    const { messages } = useMessenger();
    const [showNotification, setShowNotification] = useState(false);
    const [lastReadTimestamp, setLastReadTimestamp] = useState(() => {
        return parseInt(localStorage.getItem('sfos-messenger-last-read') || '0', 10);
    });

    const location = useLocation();
    const navigate = useNavigate();
    const isOnMessenger = location.pathname === '/messenger';

    // Update last read when entering messenger
    useEffect(() => {
        if (isOnMessenger) {
            const now = Date.now();
            setLastReadTimestamp(now);
            localStorage.setItem('sfos-messenger-last-read', now.toString());
            setShowNotification(false);
        }
    }, [isOnMessenger]);

    // Check for new messages - ONLY if authenticated
    useEffect(() => {
        if (!user) {
            setShowNotification(false);
            return;
        }
        if (isOnMessenger) return;

        const latestMessage = messages[messages.length - 1];
        if (latestMessage && latestMessage.timestamp > lastReadTimestamp) {
            setShowNotification(true);
        }
    }, [messages, lastReadTimestamp, isOnMessenger, user]);

    if (!showNotification || !user) return null;

    return (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-top duration-300">
            <div className="bg-indigo-600 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-3 cursor-pointer hover:bg-indigo-700 transition-colors"
                onClick={() => navigate('/messenger')}>
                <MessageSquare size={20} className="animate-pulse" />
                <span className="font-medium">New Message from Family!</span>
                <button
                    onClick={(e) => { e.stopPropagation(); setShowNotification(false); }}
                    className="ml-2 hover:text-indigo-200"
                >
                    ×
                </button>
            </div>
        </div>
    );
}
