# Task Assignment: Research Agent (Updated)
**Priority**: High
**Context**: "Sanchez Family Finance Hub"
**Stack Pivot**: **PocketBase** + **Cloudflare Tunnels**.
**Reference Docs**: `docs/finance/PRD.md`

## Objective
We have switched the backend to **PocketBase**. We need to validate how to achieve our "Offline-First" and "RBAC" goals within the PocketBase ecosystem.

## Specific Questions to Answer
1.  **PocketBase "Offline" Strategy**:
    *   PocketBase is real-time first, but not strictly offline-first (like PouchDB).
    *   *Research*: What is the best pattern for offline transaction entry?
    *   *Options*:
        *   React Query (`tanstack-query`) with `persistClient`?
        *   Generic "Action Queue" stored in `localStorage` that replays on reconnect?
        *   RxDB replicating with PocketBase? (Too complex?)
    *   *Output*: Recommended "Good Enough" offline strategy for a family app (mostly online, but resilient to flaky WiFi).

2.  **RBAC via PocketBase API Rules**:
    *   We need 3 tiers: Admin (Parent), Partner (Parent), Child (Armin).
    *   *Task*: Draft the specific **API Rules** string logic for the `Envelopes` collection.
    *   *Scenario*:
        *   "Joint" items: Visible if `user.groups ?~ 'parents'`.
        *   "Private" items: Visible if `owner.id = request.auth.id`.
        *   "Child" items: Visible if `owner.id = request.auth.id` OR `request.auth.groups ?~ 'parents'`.

3.  **Cloudflare Tunnel Security**:
    *   Best practice for exposing the PocketBase Admin UI? Should we put it behind Cloudflare Access (Zero Trust) or just rely on PocketBase Admin Auth?

## Deliverable
Update your report (`.agent_comms/outbox/research_report_001.md`) to focus specifically on **PocketBase patterns**.
