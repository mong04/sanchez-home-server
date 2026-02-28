/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'
import { registerRoute, NavigationRoute } from 'workbox-routing'
import { NetworkFirst, CacheFirst } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'
import { CacheableResponsePlugin } from 'workbox-cacheable-response'
import { clientsClaim } from 'workbox-core'

declare let self: ServiceWorkerGlobalScope

self.skipWaiting()
clientsClaim()

// Precaching
precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()

// SPA Navigation fallback (managed by Vite PWA usually, but explicit here for injectManifest)
registerRoute(new NavigationRoute(new NetworkFirst({
    cacheName: 'navigations'
})))

// Google Fonts caching
registerRoute(
    /^https:\/\/fonts\.googleapis\.com\/.*/i,
    new CacheFirst({
        cacheName: 'google-fonts-cache',
        plugins: [
            new ExpirationPlugin({
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
            }),
            new CacheableResponsePlugin({
                statuses: [0, 200]
            })
        ]
    })
)

// Font files caching
registerRoute(
    /^https:\/\/fonts\.gstatic\.com\/.*/i,
    new CacheFirst({
        cacheName: 'gstatic-fonts-cache',
        plugins: [
            new ExpirationPlugin({
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
            }),
            new CacheableResponsePlugin({
                statuses: [0, 200]
            })
        ]
    })
)

// Push event listener
self.addEventListener('push', (event) => {
    if (!event.data) return

    try {
        const payload = event.data.json()
        const options: NotificationOptions = {
            body: payload.body,
            icon: payload.icon || '/pwa-512x512.svg',
            badge: '/favicon.ico', // Simple fallback for now
            data: {
                url: payload.url || '/',
                ...payload.data
            }
        }

        event.waitUntil(
            self.registration.showNotification(payload.title || 'SFOS Alert', options)
        )
    } catch (e) {
        // Fallback for non-JSON push
        event.waitUntil(
            self.registration.showNotification('SFOS Alert', {
                body: event.data.text()
            })
        )
    }
})

// Notification click listener
self.addEventListener('notificationclick', (event) => {
    event.notification.close()

    const urlToOpen = event.notification.data?.url || '/'

    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            // Check if there is already a window open and focus it
            for (const client of windowClients) {
                if ('focus' in client && 'url' in client) {
                    // If we want to focus exact URL match, we could check here
                    return client.focus()
                }
            }
            // If no window is open, open a new one
            if (self.clients.openWindow) {
                return self.clients.openWindow(urlToOpen)
            }
        })
    )
})
