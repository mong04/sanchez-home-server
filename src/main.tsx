import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import './index.css'
import { router } from './router'
import { queryClient, idbPersister } from './lib/query-client'
import { BackendProvider } from './providers/BackendProvider'
import { registerSW } from 'virtual:pwa-register'

// Register Service Worker for PWA & Push Notifications
registerSW({
  onNeedRefresh() {
    console.log('New content available, please refresh.')
  },
  onOfflineReady() {
    console.log('App ready to work offline.')
  },
})

import { OfflineFallback } from './components/OfflineFallback'

function AppRoot() {
  const isOnline = navigator.onLine;

  useEffect(() => {
    const supabase = (window as any).supabase;
    if (!supabase) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: string, session: any) => {
      console.log(`[Auth] ${event} — user: ${session?.user?.email || 'none'}`);
      // Your AuthContext can listen to this if needed
    });

    return () => subscription?.unsubscribe();
  }, []);

  if (!isOnline) {
    return <OfflineFallback />;
  }

  return <RouterProvider router={router} />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister: idbPersister }}
    >
      <BackendProvider>
        <AppRoot />
      </BackendProvider>
    </PersistQueryClientProvider>
  </StrictMode>,
)

