import { StrictMode } from 'react'
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

