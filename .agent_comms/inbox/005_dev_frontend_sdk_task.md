# Task Assignment: Development Agent (Frontend Core)
**Priority**: Critical
**Context**: "Sanchez Family Finance Hub" - Phase 2b
**Reference Docs**: `docs/finance/PRD.md`, `src/types/pocketbase.ts`

## Objective
Initialize the frontend "Core Engine" for fetching and caching financial data using PocketBase and TanStack Query.

## Tasks
1.  **`src/lib/pocketbase.ts`**:
    *   Initialize the `PocketBase` client (singleton).
    *   Point to `import.meta.env.VITE_POCKETBASE_URL` (default to `http://127.0.0.1:8090`).
    *   Export a helper `pb` instance.

2.  **`src/lib/query-client.ts`**:
    *   Configure `QueryClient` with recommended defaults (staleTime: 5 mins).
    *   Set up `persistQueryClient` using `idb-keyval` (install if missing or use localStorage) to ensure offline caching work.

3.  **`src/hooks/useFinanceData.ts`**:
    *   Create `useEnvelopes()`: Fetches list of envelopes, sorts by name.
    *   Create `useTransactions(envelopeId)`: Fetches transactions for a specific envelope.
    *   Create `useAddTransaction()`: Mutation with `onMutate` (Optimistic Update) logic. *This is critical for the "Quick Add" feel.*

## Deliverable
Create a file: `.agent_comms/outbox/dev_frontend_sdk_001.md` containing the code for these 3 files.
