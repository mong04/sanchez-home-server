import { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { Loading } from './components/common/Loading';
import { useMessenger } from './hooks/use-messenger';
import { doc, provider } from './lib/yjs-provider';
import { MessageSquare } from 'lucide-react';

function App() {
  const [isSyncing, setIsSyncing] = useState(true);

  // Notification Logic
  const { messages } = useMessenger();
  const [showNotification, setShowNotification] = useState(false);
  const [lastReadTimestamp, setLastReadTimestamp] = useState(() => {
    return parseInt(localStorage.getItem('sfos-messenger-last-read') || '0', 10);
  });

  const location = useLocation();
  const navigate = useNavigate();

  // Derive whether we're on the messenger route
  const isOnMessenger = location.pathname === '/messenger';

  // Sync Status Logic
  useEffect(() => {
    // Initial fake load for UX
    const timer = setTimeout(() => setIsSyncing(false), 800);

    let debounceTimer: ReturnType<typeof setTimeout>;

    // Flash "Syncing..." on document updates (remote or local)
    const updateListener = () => {
      setIsSyncing(true);
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => setIsSyncing(false), 600);
    };

    doc.on('update', updateListener);

    const handleStatus = ({ connected: _connected }: { connected: boolean }) => {
      // Optional: could handle connection status here
    };

    provider.on('status', handleStatus);

    return () => {
      clearTimeout(timer);
      clearTimeout(debounceTimer);
      provider.off('status', handleStatus);
      doc.off('update', updateListener);
    };
  }, []);

  // Update last read when entering messenger
  useEffect(() => {
    if (isOnMessenger) {
      const now = Date.now();
      setLastReadTimestamp(now);
      localStorage.setItem('sfos-messenger-last-read', now.toString());
      setShowNotification(false);
    }
  }, [isOnMessenger]);

  // Check for new messages
  useEffect(() => {
    if (isOnMessenger) return;

    const latestMessage = messages[messages.length - 1];
    if (latestMessage && latestMessage.timestamp > lastReadTimestamp) {
      setShowNotification(true);
    }
  }, [messages, lastReadTimestamp, isOnMessenger]);

  return (
    <AuthProvider>
      <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
        <Loading isSyncing={isSyncing} />
        <Outlet />

        {/* Global Notification Overlay */}
        {showNotification && (
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
        )}
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
