# FINANCE_MODULE_SPEC.md — Master Plan (Updated Feb 25, 2026)

---

## 🔍 Phase 2 – Budget Engine: Feature Audit Checklist

**Audited by:** Benjamin (Dev Lead) — Feb 25, 2026, 6:00 PM  
**Sources:** `docs/finance/BUDGET_GRID_PRD.md`, `docs/PRD.md` §3.3, `docs/finance/FINANCE_MODULE_SPEC.md`

### Budget Grid (`BudgetGrid.tsx` — 485 lines)

| Feature | Status | Notes |
|---------|--------|-------|
| Grouped categories (auto-categorized) | ✅ Done | `BudgetGroupHeader.tsx` with collapsible groups, `getGroupIdForCategory()` auto-detection |
| Collapsible groups | ✅ Done | `collapsedGroups` state + `toggleGroup()`, smooth AnimatePresence animation |
| Editable budget cells with debounce | ✅ Done | `EditableBudgetCell.tsx` — click-to-edit, debounced saves, keyboard nav (Tab/Arrow/Enter/Esc) |
| Available column color-coding | ✅ Done | Green positive, rose/destructive negative in `BudgetCategoryRow.tsx` |
| Overspend "Fix This" modal | ✅ Done | `FixOverspendModal.tsx` — donor category selection, amount transfer |
| Footer totals row | ✅ Done | `BudgetSummaryBar.tsx` — Total Budgeted \| Total Spent \| To Be Budgeted with animated numbers |
| Responsive card view on mobile | ✅ Done | 3 breakpoints: mobile cards (`BudgetCategoryCard`), tablet cards (`BudgetTabletCategoryCard`), desktop table (`BudgetCategoryRow`) |
| Skeleton loader | ✅ Done | `BudgetSkeletonLoader.tsx` — shows while data loads |
| Empty state (illustrated, delightful) | ✅ Done | `BudgetEmptyState.tsx` — 🌱 emoji illustration, encouraging copy, styled CTA. Uses semantic tokens. |
| Keyboard navigation between rows | ✅ Done | Tab advances to next row, Arrow Up/Down navigate, Enter to edit, Esc to cancel |
| Mobile bottom sheet | ✅ Done | `BudgetBottomSheet.tsx` — tap category card opens action sheet |
| Sticky column headers (desktop) | ✅ Done | `sticky top-[64px]` with backdrop-blur |
| Sticky summary bar | ✅ Done | Sticks below headers on all breakpoints |
| ARIA grid roles | ✅ Done | `role="grid"`, `role="row"`, `role="columnheader"`, `role="rowgroup"` |
| Mark Paid modal (recurring bills) | ✅ Done | `MarkPaidModal.tsx` — split payment support across accounts |

### To Be Budgeted Hero Card (`TbbHeroCard.tsx` — 95 lines)

| Feature | Status | Notes |
|---------|--------|-------|
| Huge prominent number (biggest text) | ✅ Done | `text-[clamp(2rem,16cqw,4.5rem)]` with container queries |
| Green when positive, rose when negative | ✅ Done | `bg-primary` / `bg-destructive` color transition, 500ms duration |
| Smooth scale animation on change | ✅ Done | `motion.div` with spring animation (stiffness: 300, damping: 20) |
| Click to edit Income inline | ✅ Done | Click → expand input with Framer Motion transition, Enter/blur to save |
| Confetti at exactly $0 | 🚧 Fix Needed | Currently fires when TBB goes from **negative → ≥ 0**. PRD says **exactly $0**. Needs adjustment. |
| "All money assigned" message | ✅ Done | `BudgetSummaryBar.tsx` shows "✓ All assigned!" when TBB === 0 |

### Live Collaboration Indicator (`FinanceDashboard.tsx`)

| Feature | Status | Notes |
|---------|--------|-------|
| "Partner is viewing" badge | ✅ Done | Shows "Partner Live" with pulsing green dot when `peerCount > 1`. Both desktop (line 137) and mobile (line 166). |
| Pulsing green dot | ✅ Done | `animate-ping` on inner span — matches PRD. |
| Only visible when peerCount > 1 | ✅ Done | Conditional render on `peerCount > 1` |
| "Partner is editing [Category]" toast | ⏳ Pending | Not implemented. PRD marks this as "Optional". Low priority. |

### NewMonthModal (`NewMonthModal.tsx` — 114 lines)

| Feature | Status | Notes |
|---------|--------|-------|
| Welcome wizard feel | ✅ Done | Modal with spring animation entrance, warm title |
| Large "Available to Assign" number | ✅ Done | `text-5xl font-bold` with income + rollover breakdown |
| "Start Fresh" (primary green button) | ✅ Done | `bg-emerald-600` with Calendar icon |
| "Copy Last Month's Budget" (secondary) | ✅ Done | Outline variant with Copy icon |
| "Use 3-Month Average" (secondary) | ✅ Done | Outline variant with Calculator icon |
| "Start a Money Date" CTA | ✅ Done | Shows at bottom, text changes if partner is online |
| **Dark mode compliance** | 🔴 BROKEN | **8 hardcoded zinc classes** (`text-zinc-900`, `text-zinc-500`, `border-zinc-200`, `bg-zinc-100`, `text-zinc-600`, `border-zinc-100`). These are invisible or wrong in dark mode. Must convert to semantic tokens. |

### TransactionFab (`TransactionFab.tsx` — 636 lines)

| Feature | Status | Notes |
|---------|--------|-------|
| 3-step flow: amount → category → account | ✅ Done | Step-based state machine with Framer Motion slide transitions |
| Numpad (amount entry) | ✅ Done | Full numpad with decimal support |
| Category selection with search | ✅ Done | Filtered category list |
| Account selection | ✅ Done | Account dropdown with balance display |
| Split transactions | ✅ Done | Multi-category splits via `SplitSquareHorizontal` icon |
| Haptic feedback on mobile | ✅ Done | `navigator.vibrate(10)` in `triggerHaptic()` |
| Smooth Framer Motion transitions | ✅ Done | AnimatePresence with slide variants between steps |
| Keyboard support | ✅ Done | Full keyboard handler with Enter/Escape/arrow navigation |
| Budget insight after save | ✅ Done | `generateInsight()` shows context-aware message |

### Category Management (In-Grid CRUD)

| Feature | Status | Notes |
|---------|--------|-------|
| Create category modal | ✅ Done | `CreateCategoryModal.tsx` — name, icon, type, amount fields |
| Edit category modal | ✅ Done | `EditCategoryModal.tsx` — name, icon, group override |
| Delete with confirmation | ✅ Done | `DeleteCategoryModal.tsx` — confirmation dialog with pending state |
| Inline emoji picker (desktop) | ✅ Done | Click icon → PredictiveEmojiBar popover, click-outside dismissal |
| "Add Category or Bill" button | ✅ Done | Bottom of grid with Plus icon, 44px min touch target on mobile |

### Data & State Layer

| Feature | Status | Notes |
|---------|--------|-------|
| Yjs real-time allocations | ✅ Done | `useBudgetYjs.ts` — Yjs doc per month, PartyKit WebSocket provider |
| PocketBase transactions (spent calc) | ✅ Done | `calculateSpentForCategory()` in `budgetUtils.ts` |
| Zero-based budgeting equation | ✅ Done | `calculateToBeBudgeted()` = income + rollover - sum(allocations) |
| Positive rollover from previous month | ✅ Done | `calculatePositiveRollover()` — only positive underspend rolls over |
| Copy previous month allocations | ✅ Done | `copyPreviousMonthAllocations()` |
| 3-month average allocations | ✅ Done | `calculateThreeMonthAverage()` |
| Global TBB state sync | ✅ Done | `useFinanceStore.setToBeBudgeted()` synced via Yjs observer in `FinanceDashboard.tsx` |
| 800ms debounce auto-save to PocketBase | ✅ Done | Handled in `useBudgetGridData.ts` observer |

---

### 📊 Summary

| Status | Count |
|--------|-------|
| ✅ Done | 40 |
| 🚧 Fix Needed | 1 (confetti trigger logic) |
| 🔴 BROKEN | 1 (NewMonthModal dark mode — 8 hardcoded zinc classes) |
| ⏳ Pending (optional) | 1 ("Partner is editing [Category]" toast — PRD marks optional) |

### 🎯 Action Items to Ship Phase 2

1. **Fix NewMonthModal dark mode** — Replace 8 hardcoded zinc classes with semantic tokens (`text-foreground`, `text-muted-foreground`, `border-border`, `bg-muted`, etc.)
2. **Fix confetti trigger** — Change `TbbHeroCard.tsx` confetti to fire when TBB reaches **exactly $0** (currently fires on any negative→positive transition)
3. **(Optional) "Partner is editing" toast** — Low priority, PRD marks as optional

---

## Current Status
- Phase 1 – Ledger Core is complete and working:
  - AccountsList loads and shows real accounts with calculated balances
  - Create account works and appears immediately
  - TransactionsTable with search, sort, pagination, edit, delete, cleared toggle, CSV import
  - AddTransactionModal works with proper account/category dropdowns
  - "Transaction" button on account cards opens modal with pre-selected account

## Goal
Build the most delightful, habit-forming, collaborative finance module for a private family web app that actually transforms our financial health. The app must feel calm, premium, clean, and motivating — a shared space where we work together on our money with intention and joy.

## Key Documents
- **Detailed screen-by-screen vision, user flows, emotional goals, delight requirements, and competitor inspiration**: `docs/finance/FINANCE_PRD.md` (this is the primary source of truth for how every screen should feel and behave)

## Phases

**Phase 2 – Budget Engine (The Heart & Magic of the App)**  
This is the most important phase. The Budget Grid must feel alive, collaborative, and emotionally rewarding — better than YNAB or Monarch.

- BudgetGrid.tsx: Live Yjs collaborative table, huge motivating "To Be Budgeted" hero card, income editing, totals row, category management directly in-grid, smooth animations, overspend highlighting, and confetti when To Be Budgeted hits $0.
- NewMonthModal.tsx: Beautiful welcome wizard for new months with "Start Fresh", "Copy Last Month", "Use 3-Month Average", and optional "Start a Money Date".
- TransactionFab.tsx: Delightful numpad quick-add flow (amount → category → account) with haptic feedback and smooth transitions.

The entire Budget experience should make us feel calm and in control while being motivating. Live collaboration must feel natural and exciting.

**Phase 3 – Dashboard & Navigation**
- DashboardOverview.tsx: Real net worth, prominent To Be Budgeted card, mini account cards, recent activity, upcoming bills.
- FinanceDashboard.tsx: Main orchestrator with tab navigation, month picker, dynamic live indicator.

**Phase 4 – UI/UX Polish & Delight**
- Framer Motion animations everywhere
- Premium empty states, micro-interactions, confetti, haptic feedback
- Mobile perfection (feels like a native app)
- Final visual and accessibility polish

**Phase 5 – Extras** (later)
- Reconciliation mode, Reports tab, Goals/Sinking funds, etc.

## Execution Rules
- Execute phases in strict order.
- After each phase, stop and wait for human review before continuing.
- Always read FINANCE_PRD.md for detailed emotional and interaction requirements.
- Use only existing shadcn/ui components and real PocketBase data.
- Prioritize delight, responsiveness, and the feeling of shared ownership.

This module must be noticeably better than YNAB or Monarch for a couple who wants to work on their finances together.