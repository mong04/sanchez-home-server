# Project Roadmap - Family Finance Hub

**Total Duration**: 10-12 Weeks  
**Methodology**: Agile (2-week Sprints)

## Phase 1: Discovery & Foundation (Weeks 1-2)
**Goal**: Finalize requirements and set up the technical groundwork.
- [ ] **Sprint 1.1**: Requirements Gathering
    - Review existing `FinanceHero` components.
    - Define data schema (PocketBase Collections: Envelopes, Transactions, Accounts, **RBAC**).
    - Plan Cloudflare Tunnel configuration.
- [ ] **Sprint 1.2**: Architecture & Scaffolding
    - Install PocketBase (local dev mode).
    - Configure PocketBase Collections & API Rules.
    - Connect Frontend to PocketBase SDK.

## Phase 2: Core Engine & Data (Weeks 3-4)
**Goal**: Working backend and basic data entry.
- [ ] **Sprint 2.1**: Database Implementation
    - Implement PockerBase hooks/API rules for budget logic.
    - Seed test data via Admin UI.
- [ ] **Sprint 2.2**: Budget Logic
    - "Envelope Transfer" logic (Income -> Envelope).
    - Calculation of "Available Balance".

## Phase 3: Mobile Interactions (Weeks 5-6)
**Goal**: Enable on-the-go usage for "The Spender" persona.
- [ ] **Sprint 3.1**: Mobile Transaction UI
    - "Quick Add" floating action button.
    - Category selector with recent favorites.
- [ ] **Sprint 3.2**: Sync & Offline
    - Verify PocketBase Realtime (subscriptions).
    - Implement offline queueing (tanstack-query or localforage) for resilience.

## Phase 4: Desktop Dashboard & Polish (Weeks 7-8)
**Goal**: Advanced management for "The CFO".
- [ ] **Sprint 4.1**: Budget Allocation View
    - Drag-and-drop or spreadsheet-like allocation interface.
    - Month-over-month rollover logic.
- [ ] **Sprint 4.2**: Reporting & Insights
    - Visual graphs (Spending trends).
    - "Safe-to-Spend" widget implementation.

## Phase 5: Testing, Launch & Operations (Weeks 9-10)
**Goal**: Production readiness.
- [ ] **Sprint 5.1**: QA & Security
    - Penetration testing (local).
    - User Acceptance Testing (Family trial week).
- [ ] **Sprint 5.2**: Launch
    - Migration of legacy data (spreadsheets).
    - Full deployment to home server.

## Future Iterations (Phase 6+)
- Receipt OCR integration.
- Voice commands.
- Multi-currency support (if needed).
