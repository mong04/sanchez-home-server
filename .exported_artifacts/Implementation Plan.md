# Phase 2 - Budget Engine Implementation Plan

## Goal Description
Build the core Budget Engine experience for the Sanchez Family OS Finance Module. This phase focuses on the `BudgetGrid`, `NewMonthModal`, and `TransactionFab` components, adhering strictly to the delightful, collaborative, and calming design vision outlined in `FINANCE_PRD.md` and `BUDGET_GRID_PRD.md`. 

## Component Breakdown

---

### `BudgetGrid` (`src/components/modules/finance/BudgetGrid.tsx`)

**Summary:** The central workspace for the budgeting process. It relies on Yjs for real-time collaboration (`peerCount`, awareness) and PocketBase for canonical truth.

**Implementation Details:**
- **Hero Card:** Uses Framer Motion's `AnimatePresence` for dynamic number changes and color transitions. Includes integrated input for inline "Income" editing. Integrates `canvas-confetti` for exact $0 celebrations.
- **Collaboration Indicator:** A pulsing dot badge utilizing `lucide-react` icons and Yjs awareness metadata, appearing only when `peerCount > 1`.
- **Data Table / Mobile View:** Responsive layout switching from a clean `shadcn/ui` table to a vertically spaced card list on small screens.
- **Row Animations & Highlighting:** Overspent rows get conditional styles using the `cn()` utility.
- **State Flow:** Use a strict 800ms debounce when propagating local Yjs edits up to the global PocketBase store to avoid jitter.

---

### `NewMonthModal` (`src/components/modules/finance/NewMonthModal.tsx`)

**Summary:** Displayed strictly on the first visit to a new month with unassigned funds. A welcoming transition to purposeful budgeting.

**Implementation Details:**
- **Layout:** Standard `shadcn/ui` Dialog with custom wide styling and increased padding for a premium feel.
- **Data Hooks:** Depends on PocketBase queries to fetch `budget_months` (Income + Rollover).
- **Actions:** The three options (Start Fresh, Copy Previous, 3-Month Average) will dispatch context actions that initialize the Yjs bindings and PocketBase allocations, then close the modal.
- **Animation:** Warm fade-in standard Dialog setup, augmented with Framer Motion delayed entry for the choices.

---

### `TransactionFab` (`src/components/modules/finance/TransactionFab.tsx`)

**Summary:** An omni-present floating action button allowing quick logging of expenses with an interactive numpad wizard.

**Implementation Details:**
- **Fixed Layout:** Absolute positioning using Tailwind (e.g. `fixed bottom-6 right-6 z-50`), ensuring it avoids overlapping any mobile navigation constraints.
- **Step Wizard State:** Local React state to manage flow: (0) Closed -> (1) Numpad -> (2) Select Category -> (3) Select Account.
- **Transitions:** `AnimatePresence` with sliding variants for each step in the wizard.
- **Numpad Engine:** Custom grid of buttons using `framer-motion` `whileTap` for immediate visual haptics, combined with `navigator.vibrate` for actual tactile feedback on supported devices.
- **Data Save:** Creates a `transactions` record in PocketBase upon completion, triggering a custom toast success message.

## Verification Plan

### Automated Tests
- Validate TypeScript strictness across all three components.
- Run `npm run build` or rely on the Vite HMR server to verify zero warning/error builds.

### Manual Verification
- **Collaboration Test:** Open the Budget Grid in two separate windows and observe live peer indicators and synced edits.
- **Animation UX:** Ensure $0 confetti appears optimally, minus layout shifts. Ensure numpad feels "clicky" and responsive, especially validating haptics on target devices.
- **Responsiveness:** Test `BudgetGrid` table collapse behavior when narrowing the viewport down to mobile widths.
