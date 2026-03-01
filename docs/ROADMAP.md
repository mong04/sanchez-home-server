# Sanchez Family OS (SFOS) — Project Roadmap
**Last updated:** February 27, 2026  
**Source:** Expert Consultation (Feb 2026) + Internal Team Alignment (Sprint Directive)
**Authority:** This is the authoritative phased plan. All work must reference this document.

---

## ✅ Completed Phases (Foundation → MVP → Security)
- [x] **Phase 1: Foundation** — Setup, Yjs Init, Test Data
- [x] **Phase 2: Data Layer** — Infinity Log, Basic Store Logic
- [x] **Phase 3: UI & Core Modules** — Command Center, Planner, Wellness UI
- [x] **Phase 4: Advanced Features** — Family Messenger, E2E Tests, Notifications
- [x] **Phase 5: Polish & Testing** — User Manual, Loading States, Build Verification
- [x] **Phase 6: Feature Implementation** — Chore & Finance Manager (basic chores, bills, shopping lists, doc scanner)
- [x] **Phase 7: Cross-Module Integrations & Polish**
- [x] **Phase 8/8b/8c: Advanced QA, E2E, Infrastructure & UI Overhaul** — PartyKit migration, theming, WCAG
- [x] **Phase 9: Security & Privacy Audit**
- [x] **Phase 10: Smart Planner** — Calendar views, event management, bill markers

---

## 🚧 In Progress

### Phase 11: Financial Command — Budget Engine
**Status:** IN PROGRESS (started Feb 20, 2026)  
**Focus:** Premium collaborative zero-based budgeting system

| Sub-Phase | Status |
|-----------|--------|
| Finance Phase 1 – Ledger Core (Accounts, Transactions, CSV) | ✅ Complete |
| Finance Phase 2 – Budget Engine (Grid, NewMonthModal, FAB, Yjs collab) | ✅ Shipped Feb 25, 2026 |
| Finance Phase 3 – Dashboard & Navigation | ⏳ Next |
| Finance Phase 4 – UI/UX Polish & Delight | ⏳ Following |

---

## 📋 Upcoming — Expert-Recommended Phasing

### Phase 11.5: Backend Abstraction & Migration Wizard
**Status:** IN PROGRESS
**Target Start:** Immediately after Budget Engine ships  
**Deadline:** April 15, 2026  
**Duration:** 2–3 weeks  
**Spec:** `docs/PHASE_11_5_BACKEND_ABSTRACTION.md`

The highest-priority new work recommended by the expert consultant. Creates a pluggable backend that allows families to start on free Supabase cloud (<90 seconds) and migrate to self-hosted PocketBase (<10 minutes) with zero data loss.

Key deliverables:
- `BackendAdapter` interface (Ports & Adapters pattern)
- `PocketBaseAdapter` + `SupabaseAdapter` implementations
- `BackendProvider` React context
- All existing hooks refactored to use `useBackend()` (zero breaking changes)
- Beautiful 5-screen Migration Wizard (Admin Dashboard → Advanced)
- Export/import with full data portability

---

### Critical Must-Fix Block (Next 3 Months)
**Deadline:** May 31, 2026

These are non-negotiable adoption drivers identified by market research:

| # | Feature | Why Critical |
|---|---------|-------------|
| 1 | **✅ Web Push Notifications [COMPLETE]** | Families won't check an app proactively — they need reminders for bills, chores, and calendar events |
<!-- Web Push Implementation Checklist -->
<!-- ✅ Complete: Service worker registration -->
<!-- ✅ Complete: VAPID key setup -->
<!-- ✅ Complete: Subscription management (DB storage) -->
<!-- ✅ Complete: Backend integration (BackendAdapter.sendPush) -->
<!-- ✅ Complete: UI for permission prompt + toasts -->
| 2 | **Delightful Manual Finance** | Bank sync was dropped for privacy. Manual entry must become fast, smart, and satisfying to use. |
<!-- Delightful Manual Finance Implementation Checklist -->
<!-- 🔎 Phase 0: Research & Alignment (Feb 27, 2026) -->
<!-- 1. Where does income currently live? In the 'budget_months' collection record 'income' field. -->
<!-- 2. How is “To Be Budgeted” calculated today? budget.income + budget.rollover - sum(allocations). -->
<!-- 3. Is there already a system “Income” category? No, currently relies on ad-hoc categories or manual income pool updates. Phase 1 will create a locked system 'Income' category. -->
<!-- 4. What should happen the moment income is logged? TBB hero card updates instantly via TanStack Query invalidation, adding the amount to the monthly income pool. -->

<!-- ✅ Complete: TransactionFab 2.0 (Smart defaults, haptics, repeat last) -->
<!-- ✅ Complete: Recurring income/expense templates -->
<!-- ⏳ Pending: Receipt scanning + auto-categorization -->
<!-- ⏳ Pending: Smart CSV import (auto-map, duplicate detection, bulk edit) -->
<!-- ⏳ Pending: Daily Quick Log Spending card in Command Center -->
| 3 | **Basic Cross-Module Analytics** | Users need spending trends, category breakdowns, and net worth history to trust the app |

---

### High-Value Block (Next 6 Months)
**First items live by:** August 31, 2026

| # | Feature | Value |
|---|---------|-------|
| 4 | **Savings Goals / Sinking Funds / Debt Snowball** | Foundational YNAB concept — families set aside money for big purchases and pay down debt |
| 5 | **Meal Planner + Auto-Populate Shopping** | Connects nutrition, recipes, and shopping list into a single workflow |
| 6 | **Memory Lane MVP** | Structured place to capture and celebrate family moments |

---

## 🔮 Future Deep Dives

### Phase 12: "Master Chef" — Pantry + Recipe Engine
Meal planning, recipe management, pantry inventory, auto-generated shopping lists, nutrition integration with Wellness module.

### Phase 13: "Family Sync" — Smart Calendar & Unified Alerts
Recurring events, RSVP between family members, chore rotation integration, push notification reminders, unified alert center.

### Phase 14: "Memory Lane" — Timeline & Memories
Photo journal, family timeline, milestone celebrations, auto-generated highlights from app activity.

### Phase 15: Finance Phase 5 — Advanced Extras
Reconciliation mode, Reports/analytics tab, budget history and trends, multi-currency support.

---

## 🎯 Milestone Summary

| Milestone | Target Date |
|-----------|-------------|
| Finance Budget Engine complete | March 2026 |
| **Phase 11.5 complete (Backend Abstraction)** | **April 15, 2026** |
| **Critical Must-Fix block complete** | **May 31, 2026** |
| **First High-Value items live** | **August 31, 2026** |
| Master Chef deep dive | Q4 2026 |
| Family Sync deep dive | Q1 2027 |

---

**Success Metric:** "Wife-approved" — every feature passes the bar of being intuitive and delightful enough that a non-technical spouse genuinely enjoys using it without prompting.

**Key Documents** (always read in this order):
1. `GEMINI.md` (global rules)
2. `docs/PRD.md` (full-app product requirements)
3. `docs/PHASE_11_5_BACKEND_ABSTRACTION.md` (backend abstraction blueprint)
4. `docs/finance/FINANCE_MODULE_SPEC.md` (finance execution plan)
5. `docs/finance/BUDGET_GRID_PRD.md` (budget grid bible)