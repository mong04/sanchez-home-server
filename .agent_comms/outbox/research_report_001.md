# Research Report 001: PocketBase & Cloudflare Implementation

**To**: PM
**From**: Research Agent
**Date**: 2026-02-12
**Subject**: PocketBase Offline Strategy, RBAC, and Security Recommendations

## 1. Offline Strategy recommendation
**Verdict: Hybrid "Good Enough" Approach**

For the Sanchez Family Finance Hub, a full "Offline-First" database (like RxDB) introduces unnecessary complexity (custom replication plugins required). Instead, we recommend a robust **"Offline-Resilient"** approach using `TanStack Query` (React Query).

### The Architecture
1.  **Reads (Caching)**: Use `TanStack Query` with `persistQueryClient`.
    *   This automatically caches API responses to `localStorage` (or `IndexedDB`).
    *   *Result*: User opens app offline -> sees last known balance/transactions instantly.
2.  **Writes (Optimistic UI + Queue)**:
    *   **Optimistic Updates**: Immediately update the UI cache when a user adds a transaction.
    *   **Mutation Queue**: Use `TanStack Query`'s built-in `mutationCache` paired with a custom "Online Manager".
    *   *Handling Reloads*: To handle the "closing app while offline" scenario, we will persist the "Action Queue" to `localStorage`. On startup, the app checks this queue and replays mutations if online.

**Why not RxDB?**
*   RxDB is excellent but requires building a custom "Replication Plugin" for PocketBase. This is a significant engineering investment. The "Optimistic React Query" approach covers 95% of family use cases (e.g., entering a transaction at a grocery store with bad reception).

## 2. RBAC API Rules for `Envelopes` & `Transactions`
We need to handle 3 distinct visibility levels. Here is the draft logical syntax for PocketBase API Rules.

**Assumptions**:
*   `users` collection has a `groups` field (json array or relation) containing `'parents'`.
*   `envelopes` collection has an `owner` field (relation to `users`) and a `visibility` field (select: `'private', 'joint', 'child_view'`).

### The Rule Logic
Combine these into a single string for the **List/View Rule**:

```sql
// Rule: Can I see this envelope?
(
    // 1. I am the owner (Always true for personal items)
    (owner.id = @request.auth.id)
)
||
(
    // 2. It's a JOINT item AND I am a parent
    (visibility = 'joint' && @request.auth.groups ?~ 'parents')
)
||
(
    // 3. It's a CHILD_VIEW item AND (I am a parent OR I am the specific child owner)
    // Note: Assuming child items are owned by the child.
    // If child items are owned by parents but visible to child, logic changes slightly.
    // Assuming Child Owned:
    (visibility = 'child_view' && (owner.id = @request.auth.id || @request.auth.groups ?~ 'parents'))
)
```

**Simplified Final Rule String**:
```
owner.id = @request.auth.id || (visibility = 'joint' && @request.auth.groups ?~ 'parents') || (visibility = 'child_view' && @request.auth.groups ?~ 'parents')
```
*(Note: If `visibility` is `joint`, the owner is likely one of the parents, so the first clause catches the creator, the second clause catches the spouse).*

## 3. Cloudflare Tunnel Security
**Recommendation: Split Access Policy**

We should put the entire PocketBase instance behind a Cloudflare Tunnel, but apply different **Zero Trust (Access)** policies based on the path.

*   **Domain**: `finance.sanchezfam.com` (Example)
*   **Tunnel**: Routes traffic to `localhost:8090` (PocketBase)

**Cloudflare Access Policies**:
1.  **Admin UI Protection** (`/_,/*`)
    *   **Path**: `hostname/_,/*` (The PocketBase dashboard usually lives at `/_/`)
    *   **Action**: **Allow** (Auth Required)
    *   **Rule**: Include email `dad@sanchez.com`, `mom@sanchez.com`.
    *   *Benefit*: Even if PocketBase has a vulnerability, the Admin UI page is unreachable without Cloudflare Auth first.

2.  **API Integration** (`/api/*`)
    *   **Path**: `hostname/api/*`
    *   **Action**: **Bypass** (Service Auth)
    *   **Reason**: The mobile app/PWA needs to talk to the API directly. Using Cloudflare Auth headers in a standard PWA can be tricky (requires service tokens).
    *   **Security**: The API itself is protected by PocketBase's internal Auth (Bearer Tokens) and the RBAC rules defined above.

**Summary**:
*   **Strict Zero Trust** on the Admin Dashboard (`/_/`).
*   **Standard TLS + PocketBase Auth** on the API (`/api/`).
