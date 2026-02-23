# FINANCE_MODULE_SPEC.md — Master Plan (Updated Feb 20, 2026)

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