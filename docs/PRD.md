# Sanchez Family OS — Product Requirements Document (PRD)
**Version:** 2.0 (February 25, 2026 — Post-Expert Consultation Edition)  
**Owner:** The Family (you + wife)  
**Authority:** This is the authoritative product vision document. All development decisions must reference this PRD.

---

## 1. Vision & Core Principles

### Vision
Sanchez Family OS (SFOS) is a **private, premium family operating system** that reduces daily household chaos, strengthens the couple's bond through shared visibility, and makes family life feel calm and organized instead of reactive and stressful.

It is not a generic productivity app. It is a **lovingly crafted tool built exclusively for this family** — delightful, motivating, and deeply personal.

### Core Principles

1. **"Wife-Approved" Standard** — Every feature must be intuitive and delightful enough that a non-technical spouse genuinely enjoys using it without prompting. This is the quality bar that gates every merge.

2. **Privacy-First, Portable Always** — Families own their data. Start on free cloud hosting in <90 seconds. Migrate to self-hosted in <10 minutes with zero data loss.

3. **Collaborative by Default** — Real-time presence, live editing, and shared visibility are first-class. Families work *together*, not in silos.

4. **Calm & Motivating** — The experience must feel premium and calming, not overwhelming. Every interaction should reduce anxiety, never create it.

5. **Habit-Forming, Not Feature-Heavy** — Build fewer things that families actually use daily, rather than many things they open once.

> [!IMPORTANT]
> **New Non-Negotiable (Feb 2026):** The BackendAdapter pattern is the new architectural north star. All data operations (CRUD, realtime, auth, storage) **must** route through the adapter. Direct imports of `pocketbase` or `@supabase/supabase-js` are now forbidden outside the adapter files.

---

## 2. Target Users & Personas

### Primary Persona: "The Organized Parent"
- **Who:** The family member (often Dad, sometimes Mom) who wants to bring order to household operations
- **Motivation:** Reduce mental load, eliminate "whose turn is it?" arguments, feel financially in control
- **Tech comfort:** High — willing to set up a home server and configure the app
- **Adoption driver:** Sees it work well, pulls the family in

### Secondary Persona: "The Spouse"
- **Who:** The partner who didn't set up the app but needs to love it
- **Motivation:** See the family is organized, budget together without spreadsheet friction, track shared responsibilities
- **Tech comfort:** Moderate — uses apps daily but doesn't configure them
- **Adoption driver:** The app must feel delightful and zero-friction from the very first interaction

### Tertiary Persona: "The Kids" (Future)
- **Who:** Children in the household
- **Motivation:** See their chore assignments, earn points, celebrate achievements
- **Tech comfort:** Native mobile users
- **Adoption driver:** Gamification (points, leaderboards, streaks)

---

## 3. Module-by-Module Requirements

### 3.1 🏠 Command Center (Dashboard)
The home base. A dynamic, real-time overview of the family's day.

**Requirements:**
- Today's Mission — active chores for logged-in user with point values
- Financial Forecast — upcoming bills, red alerts for ≤2 days due
- Family Scoreboard — gamified points ranking, live updates
- Weather widget
- Up Next — next 1–3 calendar events
- **Future:** Quick links to most-used actions, personalized insights

---

### 3.2 📅 Smart Planner (Calendar)
Full family calendar with rich event management.

**Current:**
- Month/week/day views
- Event creation (title, description, date/time, color, type)
- Bill markers on calendar with hover details
- Event completion toggle
- Current-day highlighting

**Planned (Phase 13 — Family Sync):**
- Recurring events (daily, weekly, monthly, custom)
- RSVP / invites between family members
- Integration with chore rotation schedule
- Push notification reminders (requires push notification infrastructure)

---

### 3.3 💰 Finance Module
The most ambitious module. Must feel noticeably better than YNAB or Monarch for a couple budgeting together.

**Full spec:** `docs/finance/FINANCE_MODULE_SPEC.md`, `docs/finance/FINANCE_PRD.md`, `docs/finance/BUDGET_GRID_PRD.md`

**Core philosophy:** Zero-based budgeting with positive rollover. "Every dollar gets a job."

**Current (Phases 1–2):**
- Accounts: CRUD, calculated balances from real transactions
- Transactions: search, sort, paginate, edit, delete, cleared toggle, CSV import
- Budget Grid: collaborative Yjs editing, hero "To Be Budgeted" card, category management, overspend detection, confetti at $0
- TransactionFab: 3-step quick-add (numpad → category → account)
- NewMonthModal: welcome wizard with three budget start options

**Planned:**
- Dashboard & Navigation (Finance Phase 3)
- UI/UX polish & delight pass (Finance Phase 4)
- Savings Goals / Sinking Funds / Debt Snowball (High-Value block)
- Reports & Analytics (cross-module analytics)
- Bank Sync / Plaid (Critical Must-Fix)
- Reconciliation mode (Phase 15)

---

### 3.4 🥗 Wellness Engine
Personal health and habit tracking.

**Current:**
- Nutrition logging (meals, snacks, water)
- Sleep tracking (duration, quality)
- Mood check-ins

**Planned improvements:**
- Trends and streaks visualization
- Social elements ("spouse logged a workout")
- Integration with meal planner (Phase 12)

---

### 3.5 💬 Family Messenger
Private, ephemeral family chat.

**Current:**
- Messages expire after 24 hours
- Image support
- In-app notification toasts
- Real-time delivery via Yjs/PartyKit

**Planned improvements:**
- Push notifications for new messages (Critical Must-Fix)
- Read receipts

---

### 3.6 🧹 Organizer (Chores & Household)
Consolidated household operations module.

**Current:**
- Chore Board: assignable, rotating, point-based
- Shopping List: shared, real-time sync, receipt scanning
- Finance Tracker: basic bill tracking with overdue alerts

**Planned improvements:**
- Deeper integration between chores and calendar (Phase 13)
- Auto-populate shopping list from meal planner (Phase 12)
- Motivational loops connecting chore completion to rewards/streaks

---

### 3.7 🏆 Infinity Log
Running family activity log and memory diary.

**Current:** Persistent, searchable feed of family milestones and notes

**Future integration:** Feeds into Memory Lane (Phase 14)

---

### 3.8 📸 Memory Lane (Phase 14)
**Status:** Planned

Photo journal, family timeline, milestone celebrations. Auto-generated highlights from app activity. A structured place to capture and celebrate family moments.

---

## 4. Cross-Cutting Platform Requirements

### 4.1 Offline-First
- All changes saved locally first, synced when reconnected
- Visual "SYNCING" indicator
- Yjs CRDT handles conflict resolution for collaborative data

### 4.2 Push Notifications (Critical Must-Fix — by May 31, 2026)
- Web Push API (Service Worker + Push subscription)
- Notification types: bill reminders, chore assignments, calendar events, messages
- User-controlled notification preferences per category
- Must work on iOS Safari 16.4+, Chrome, Firefox

### 4.3 Real-Time Collaboration (Yjs + PartyKit)
- Live presence indicators (peerCount, "Partner is viewing")
- Collaborative editing on budget grid, shopping lists
- PartyKit Cloud deployment, independent of backend choice
- **Yjs/PartyKit is unchanged by the backend abstraction** — it works identically with PocketBase or Supabase

### 4.4 Theming
- Light / Dark / System modes
- Full semantic token system (see `UI_UX_GUIDELINES.md`)
- All components must use semantic tokens, never hardcoded colors

### 4.5 Accessibility (WCAG AA)
- Keyboard navigation with visible focus rings
- Screen reader support (ARIA labels, live regions)
- Minimum 44×44px touch targets on mobile
- High-contrast color tuning

### 4.6 Responsive Design
- Mobile-first (iPhone SE → ultrawide)
- Breakpoints: default (<640px), sm (≥640), md (≥768), lg (≥1024), xl (≥1280)
- All modules must have dedicated mobile-optimized views

---

## 5. Backend Portability & Migration

> [!IMPORTANT]
> The BackendAdapter pattern is the new architectural north star. All data operations (CRUD, realtime, auth, storage) **must** route through the adapter. Direct imports of `pocketbase` or `@supabase/supabase-js` are now forbidden outside the adapter files. *(Note: The standalone `signaling.js` server has a temporary exemption until refactored).*

### Architecture: Ports & Adapters (Hexagonal Lite)
- Single `BackendAdapter` TypeScript interface defines all data operations
- Two concrete implementations: `PocketBaseAdapter`, `SupabaseAdapter`
- `BackendProvider` React context bootstraps the active adapter
- All hooks use `useBackend()` — zero direct PocketBase imports

### Onboarding Flow
- New families start on **free Supabase** in <90 seconds (no hardware required)
- Experienced families migrate to **self-hosted PocketBase** via a beautiful 5-screen wizard in <10 minutes
- Zero data loss guaranteed during migration (export → import with verification)

### Schema Parity
- PocketBase collections = Supabase tables (exact same names, fields, types)
- Relations use identical field names
- Files: both support signed URLs
- PocketBase API rules mirrored as Supabase RLS policies

**Full spec:** `docs/PHASE_11_5_BACKEND_ABSTRACTION.md`

---

## 6. Bank Sync & Import (Critical Must-Fix — by May 31, 2026)

### Current State
Manual transaction entry and CSV import only. This is the #1 adoption barrier.

### Target State
1. **Improved CSV import** — Support more bank formats, auto-detect columns, duplicate detection
2. **Bank sync integration** — Plaid or MX Connect for automatic transaction pull
3. **Security requirements:**
   - API keys stored server-side only (never in frontend)
   - PII (account numbers, routing numbers) encrypted at rest
   - User explicitly authorizes each bank connection
   - Connection status visible in UI with easy revoke

---

## 7. Analytics & Reporting (Critical Must-Fix — by May 31, 2026)

### Current State
Transaction data exists but no visualizations, trends, or insights.

### Target State
1. **Spending trends** — Category-level spending over time (bar/line charts by month)
2. **Net worth history** — Rolling graph of total assets minus liabilities
3. **Budget vs. actual** — Monthly comparison of budgeted amounts vs. actual spending
4. **Cross-module insights** — "You've completed 92% of chores this month" style dashboard cards
5. **Export** — PDF/CSV report generation for tax season or record-keeping

---

## 8. Success Metrics

### Quantitative KPIs

| Metric | Target |
|--------|--------|
| **Adoption Rate** | >80% of adults log ≥1 transaction/week |
| **Transaction Latency** | <3 seconds to add on mobile |
| **System Uptime** | 99.9% during waking hours (7am–11pm) |
| **Critical Sync Bugs** | 0 post-launch |
| **Migration Success Rate** | ≥98% of families complete Supabase→PocketBase migration without support |
| **Self-Hosted Migration** | ≥30% of families migrate to self-hosted within 6 months |
| **TTI** | <200ms |

### Qualitative Metrics

| Metric | Method | Target |
|--------|--------|--------|
| Ease of use ("How easy to check grocery budget?") | 1–5 scale | >4 |
| Trust ("Do you trust the numbers?") | Yes/No | 100% Yes |
| Most-used feature | Survey | "Quick Add" and "Budget View" |
| Emotional response | "How do you feel opening the app?" | "Calm and in control" |

### Evaluation Schedule
- Post-Sprint 2: Usability test with "Spouse" persona
- Post-Launch Week 10: Family retro on adoption and satisfaction
- 6-month mark: Migration rate assessment

---

## 9. Design & UX Principles

Full design system: `docs/UI_UX_GUIDELINES.md`

### Summary
- **Semantic tokens** — never hardcoded colors
- **Mobile-first responsive** — design for iPhone SE, enhance upward
- **Framer Motion** — tasteful micro-interactions and page transitions
- **shadcn/ui** — consistent component library
- **Premium, not minimal** — gradients, shadows, depth, visual hierarchy
- **Alive, not static** — hover effects, animations, live indicators
- **Empty states matter** — every list/grid needs a styled empty state with icon + message
- **Touch-friendly** — 44×44px minimum targets, large numpad, excellent keyboard avoidance

---

## Appendix: Key Documents Reference

| Document | Path | Purpose |
|----------|------|---------|
| Global Rules | `GEMINI.md` | AI agent rules and approved stack |
| This PRD | `docs/PRD.md` | Full-app product vision |
| Roadmap | `docs/ROADMAP.md` | Phased plan with milestones |
| Backend Abstraction | `docs/PHASE_11_5_BACKEND_ABSTRACTION.md` | Phase 11.5 blueprint |
| UI/UX Guide | `docs/UI_UX_GUIDELINES.md` | Design system |
| Architecture | `docs/ARCHITECTURE_DECISION.md` | Hybrid stack strategy |
| Finance Module Spec | `docs/finance/FINANCE_MODULE_SPEC.md` | Finance execution plan |
| Finance PRD (detail) | `docs/finance/FINANCE_PRD.md` | Finance emotional goals |
| Budget Grid PRD | `docs/finance/BUDGET_GRID_PRD.md` | Budget grid bible |
| Risk Register | `docs/finance/RISK_REGISTER.md` | Identified risks |
| Success Metrics | `docs/finance/SUCCESS_METRICS.md` | Finance-specific KPIs |
