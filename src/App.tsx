import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { Loading } from './components/common/Loading';
import { GlobalNotifications } from './components/common/GlobalNotifications';
import { doc, provider } from './lib/yjs-provider';

function App() {
  const [isSyncing, setIsSyncing] = useState(true);

  // Sync Status Logic
  useEffect(() => {
    // Initial fake load for UX - REMOVED for instant feel
    setIsSyncing(false);

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
      clearTimeout(debounceTimer);
      provider.off('status', handleStatus);
      doc.off('update', updateListener);
    };
  }, []);



  return (
    <AuthProvider>
      <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
        <Loading isSyncing={isSyncing} />
        <Outlet />
        <GlobalNotifications />
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
