# Research Report: PWA & Offline Strategies

**Context**: Sanchez Family Finance Hub (Phase 3)
**Date**: 2026-02-12

## 1. Vite PWA Configuration

To make the app installable on iOS and Android, use `vite-plugin-pwa`.

**Minimal Config (`vite.config.ts`):**

```typescript
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Sanchez Family Finance',
        short_name: 'SanchezFin',
        description: 'Family finance tracking application',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ],
        display: 'standalone',
        background_color: '#ffffff',
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [{
            urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
            handler: 'NetworkFirst',
            options: {
                cacheName: 'api-cache',
                expiration: {
                    maxEntries: 100,
                    maxAgeSeconds: 300
                },
                cacheableResponse: {
                    statuses: [0, 200]
                }
            }
        }]
      }
    })
  ]
});
```

**Key Notes**:
-   **iOS**: Safari requires strict manifest adherence. Ensure `display: standalone` is set.
-   **Icons**: You MUST generate `pwa-192x192.png` and `pwa-512x512.png`. The plugin will not generate these for you.

## 2. Offline Indicator Strategy

Avoid blocking the UI with full-screen "You are offline" modals. Use a **Passive-Active** approach.

-   **Passive (Always Visible)**: A subtle, non-intrusive indicator in the top header or user avatar area (e.g., a small grey dot becoming a slashed cloud icon).
-   **Active (Action & Error)**:
    -   Use **React Hot Toast** (or similar) to show a persistent but dismissible toast: *"You are offline. Changes will sync when connected."*
    -   When a mutation occurs offline, `TanStack Query` naturally queues it. Show an "Optimistic" success state immediately, but maybe with a "pending sync" icon on the specific item (e.g., an envelope card).

**Implementation Pattern**:
```typescript
// src/hooks/use-online-status.ts
import { useSyncExternalStore } from 'react';

export function useOnlineStatus() {
  const isOnline = useSyncExternalStore(
    (callback) => {
      window.addEventListener('online', callback);
      window.addEventListener('offline', callback);
      return () => {
        window.removeEventListener('online', callback);
        window.removeEventListener('offline', callback);
      };
    },
    () => navigator.onLine,
    () => true
  );
  return isOnline;
}
```

## 3. Sync Conflict Resolution

**PocketBase Behavior**:
PocketBase uses **Last-Write-Wins (LWW)** logic by default. It does not have built-in differential sync (like Git) or field-level merging for concurrent updates from different clients.

**Scenario**:
1.  **User A** (Offline) edits Envelope X (Balance $100 -> $50).
2.  **User B** (Online) edits Envelope X (Balance $100 -> $80).
3.  **User A** goes online.

**Result**:
-   User A's request ($50) is sent. It overwrites User B's change ($80). Final balance: $50.
-   *PocketBase generally does not detect this as a conflict unless you use optimistic concurrency control (checking a `updated` timestamp).*

**Recommendation for Phase 3**:
1.  **Accept LWW**: For a family finance app, the likelihood of *simultaneous* edits to the *same* envelope is low. Implementing complex CRDTs is overkill for Phase 3.
2.  **Use React Query Mutations**: Your `src/lib/query-client.ts` is already set to `networkMode: 'offlineFirst'`. This is excellent. It will retry mutations automatically.
3.  **Conflict Mitigation**:
    -   If strict safety is required for specific fields (e.g., transactions), considering appending updates (creating Transaction records) rather than updating a single balance field.
    -   **Transactions Collection**: Ideally, "Balance" is a computed view or aggregated on the fly from a `Transactions` collection. This generally avoids write conflicts completely because User A and User B are creating *new* records, not updating the same one.

**Conclusion**: Reliance on `Transactions` (append-only) instead of `Envelopes` (mutable state) is the best architectural pattern to avoid meaningful conflicts in this domain.
