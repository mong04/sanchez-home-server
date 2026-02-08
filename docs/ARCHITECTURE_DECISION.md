# Architecture Decision: Hybrid PartyKit + PocketBase

## The "Hybrid" Stack
We are adopting a "Best of Both Worlds" approach for the Sanchez Family OS.

### 1. PartyKit (The Signal) - *Implemented*
*   **Role**: Real-Time Connectivity & "Magic" Sync.
*   **Technology**: Yjs + WebSockets (managed by PartyKit Cloud).
*   **Data**: Todo lists, chores, short text logs, state (checked/unchecked).
*   **Why**: Best-in-class for collaborative text and offline conflict resolution.

### 2. PocketBase (The Storage) - *Next Phase*
*   **Role**: Heavy Lifting & Asset Storage.
*   **Technology**: SQLite + Go (Single binary) running on your Local Home Server.
*   **Data**: Receipt images, PDF docs, User Avatars, User Authentication.
*   **Why**: Yjs is poor at syncing large binary blobs (images). PocketBase is excellent at serving files and providing a traditional API.

## Workflow Example: Receipt Scanning
1.  **User Actions**: User takes a photo of a grocery receipt.
2.  **Upload (PocketBase)**: App uploads the 5MB image to your Home Server (PocketBase).
3.  **Response**: PocketBase returns a tiny ID: `receipt_xyz123`.
4.  **Sync (PartyKit)**: App adds `{ id: "receipt_xyz123", total: "$50" }` to the shared Yjs list.
5.  **Propagation**: PartyKit pushes this tiny JSON to your wife's phone in milliseconds.
6.  **Download**: Her phone sees the ID and loads the image from your Home Server.

## Deployment Strategy
*   **App**: Vercel (Cloud).
*   **Sync**: PartyKit (Cloud).
*   **Storage**: PocketBase (Your Laptop/Home Server).
    *   *Note*: To make Vercel talk to your Laptop, we will use a **Secure Tunnel** (e.g., Cloudflare Tunnel).
