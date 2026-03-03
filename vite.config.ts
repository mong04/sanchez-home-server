/// <reference types="vitest" />
import { defineConfig, configDefaults } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      useCredentials: true,
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'robots.txt'],
      workbox: {
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB to ensure large dynamic chunks are precached
        globPatterns: ['**/*.{js,mjs,css,html,ico,png,svg,json,woff2}'],
        runtimeCaching: [
          {
            // Cache ALL dynamic JS chunks app-wide aggressively
            urlPattern: ({ url }) => url.pathname.endsWith('.js') || url.pathname.endsWith('.mjs'),
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'all-dynamic-chunks',
              expiration: { maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 60 },
            },
          },
          {
            urlPattern: ({ request }) => request.destination === 'document',
            handler: 'NetworkFirst',
            options: { cacheName: 'html-documents' },
          },
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/api/') || url.hostname.includes('pocketbase') || url.hostname.includes('supabase'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: { maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 7 },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
        ],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api/],
      },
      devOptions: { enabled: true },
      manifest: {
        name: 'Sanchez Family OS',
        short_name: 'SFOS',
        description: 'The Sanchez Family Operating System',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/pwa-512x512.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
          },
          {
            src: '/pwa-512x512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
          },
          {
            src: '/pwa-512x512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
    }),
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.ts',
    exclude: [...configDefaults.exclude, '**/tests/e2e/**', '**/*.spec.ts'],
  },
})