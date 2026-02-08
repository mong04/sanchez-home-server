import { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { AuthLayout } from './components/layout/AuthLayout';
import { AppLayout } from './components/layout/AppLayout';
import { CommandCenter } from './components/modules/CommandCenter';
import { SmartPlanner } from './components/modules/SmartPlanner';
import { WellnessEngine } from './components/modules/WellnessEngine';
import { FamilyMessenger } from './components/modules/FamilyMessenger';
import { InfinityLog } from './components/modules/InfinityLog';
import { Loading } from './components/common/Loading';
import { useMessenger } from './hooks/use-messenger';
import { doc, provider } from './lib/yjs-provider';
import { MessageSquare } from 'lucide-react';

import { OrganizerLayout } from './components/modules/organizer/OrganizerLayout';
import { AdminDashboard } from './components/modules/AdminDashboard';
function InfinityLogView() {
  return <InfinityLog />;
}


function App() {
  const [activeTab, setActiveTab] = useState('command-center');
  const [organizerTab, setOrganizerTab] = useState<'chores' | 'finance' | 'shopping'>('chores');
  const [isSyncing, setIsSyncing] = useState(true);

  // Notification Logic
  const { messages } = useMessenger();
  const [showNotification, setShowNotification] = useState(false);
  const [lastReadTimestamp, setLastReadTimestamp] = useState(() => {
    return parseInt(localStorage.getItem('sfos-messenger-last-read') || '0', 10);
  });

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
    if (activeTab === 'family-messenger') {
      const now = Date.now();
      setLastReadTimestamp(now);
      localStorage.setItem('sfos-messenger-last-read', now.toString());
      setShowNotification(false);
    }
  }, [activeTab]);

  // Check for new messages
  useEffect(() => {
    if (activeTab === 'family-messenger') return;

    const latestMessage = messages[messages.length - 1];
    if (latestMessage && latestMessage.timestamp > lastReadTimestamp) {
      setShowNotification(true);
    }
  }, [messages, lastReadTimestamp, activeTab]);

  const handleNavigation = (tab: string, subTab?: string) => {
    setActiveTab(tab);
    if (tab === 'organizer' && subTab) {
      setOrganizerTab(subTab as any);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'command-center': return <CommandCenter onNavigate={handleNavigation} />;
      case 'smart-planner': return <SmartPlanner />;
      case 'wellness-engine': return <WellnessEngine />;
      case 'family-messenger': return <FamilyMessenger />;
      case 'infinity-log': return <InfinityLogView />;
      case 'organizer': return <OrganizerLayout initialTab={organizerTab} />;
      case 'admin': return <AdminDashboard />;
      default: return <CommandCenter onNavigate={handleNavigation} />;
    }
  };

  return (
    <AuthProvider>
      <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
        <AuthLayout>
          <AppLayout activeTab={activeTab} onTabChange={setActiveTab}>
            <Loading isSyncing={isSyncing} />
            {renderContent()}

            {/* Global Notification Overlay */}
            {showNotification && (
              <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-top duration-300">
                <div className="bg-indigo-600 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-3 cursor-pointer hover:bg-indigo-700 transition-colors"
                  onClick={() => setActiveTab('family-messenger')}>
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
          </AppLayout>
        </AuthLayout>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
