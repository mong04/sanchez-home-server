# Product Requirements Document (PRD) - Family Finance Hub

**Version**: 1.0  
**Status**: Draft  
**Owner**: PM Agent  
**Date**: 2026-02-12  

## 1. Overview
The **Family Finance Hub** is a secure, privacy-first, local-web application designed to empower the Sanchez family to manage their finances effectively. It adopts the "Envelope Budgeting" method (inspired by YNAB/Dave Ramsey) to provide clear visibility into spending, savings, and debt reduction without relying on external cloud services or bank connections.

## 2. Problem Statement
Current manual tracking methods are tedious, lack real-time visibility, and don't provide a "safe-to-spend" metric, leading to overspending or financial anxiety. Cloud-based apps pose privacy risks and often require monthly subscriptions.

## 3. Goals & Success Metrics
- **Goal**: Replace spreadsheets with a unified, offline-first web app.
- **Goal**: Enable real-time "Safe-to-Spend" visibility on mobile devices.
- **Goal**: Reduce time spent on monthly budgeting to under 30 minutes.

### Key Metrics
- **Adoption**: Used for >90% of transactions.
- **Efficiency**: Budget reconciliation time < 1 hour/month.
- **Accuracy**: Sync conflicts < 1 per week.

## 4. User Personas
1.  **The CFO (Chief Financial Officer)**: Sets the Joint Budget, allocates income, reviews reports. Needs visibility into everything *except* surprise gift planning.
2.  **The Partner**: Has their own "Fun Money" or "Work Lunch" budget. Wants autonomy over these specific envelopes without needing CFO approval for every coffee.
3.  **The Household**: The "Joint Entity" that pays the mortgage, utilities, and groceries.
4.  **The Future Saver (Child/Armin)**: Needs a highly simplified view. Should *only* see their Allowance and Savings envelopes. Must NOT see household bills or parent bank balances.

## 5. Functional Requirements (MoSCoW)

### Must Have (MVP)
- **Hybrid Budgeting Engine**:
    - **Joint Envelopes**: Shared visibility/funding (e.g., Mortgage, Groceries).
    - **Individual Envelopes**: Assigned to specific user (e.g., "His Hobbies", "Her Lunches").
    - **"Quasi-Private" Toggle**: Option to hide specific envelopes (e.g., "Gifts") from the main dashboard unless explicitly revealed (e.g., "Show Hidden").
- **Role-Based Visibility**:
    - Support for `view: ['owner', 'admins']` vs `view: ['public']`.
    - Architecture must support "Limited Users" effectively hiding non-permitted data at the API/Resolver level.
- **Envelope Budgeting Engine**: Create envelopes, allocate funds, track balances.
- **Transaction Logging**: Manual entry of income and expenses against specific envelopes.
- **Local Sync**: Real-time synchronization between devices (PartyKit).
- **Secure Auth**: PIN/Password protection for access.
- **Mobile-First UI**: "Quick Add" for transactions on mobile.

### Should Have (Phase 2)
- **Recurring Transactions**: Auto-entry for bills/subscriptions.
- **Safe-to-Spend Gauge**: Visual indicator of daily spending limit vs actual.
- **Receipt Scanning**: Camera capture and basic storage.
- **Reporting**: Monthly spending pie charts and trend lines.

### Could Have (Phase 3)
- **OCR Receipt Parsing**: Auto-extract amount/merchant from photos.
- **Savings Goals**: Visual progress bars for specific targets.
- **Bill Reminders**: Push notifications for upcoming due dates.
- **Voice Entry**: "Spent $50 at Costco for Groceries".

### Won't Have (Initial Scope)
- **Bank Integration (Plaid/Yodlee)**: Strict privacy/no monthly fee requirement.
- **Stock Tracking**: Focus is on cash flow/budgeting.

## 6. Non-Functional Requirements
- **Privacy**: All data stored locally on PocketBase (self-hosted).
- **Access**: Secure remote access via **Cloudflare Tunnels** (no open ports).
- **Performance**: Real-time subscriptions via PocketBase SDK.
- **Reliability**: Offline-capable (verify PocketBase JS SDK offline support or local caching strategy).

## 7. Assumptions & Constraints
- **Constraint**: Must run on existing low-power home server setup.
- **Stack**:
    - **Backend**: **PocketBase** (Go + SQLite embedded).
    - **Frontend**: React + Tailwind CSS.
    - **Auth**: PocketBase Auth (handling Users/RBAC).
    - **Remote**: Cloudflare Tunnel (`cloudflared`).

## 8. UX/UI Guidelines
- **Desktop**: Dashboard view with dense data tables and graphs.
- **Mobile**: Large buttons, high contrast, focus on speed of entry.
- **Theme**: Consistent with Sanchez Family OS design system.
