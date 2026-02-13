# Task Assignment: Development Agent (UI Components)
**Priority**: High
**Context**: "Sanchez Family Finance Hub" - Phase 2b
**Reference Docs**: `.agent_comms/outbox/design_mockups_final.md`

## Objective
Build the visual components for the Finance Dashboard based on the Design Agent's mockups.

## Tasks
1.  **`src/components/modules/finance/EnvelopeCard.tsx`**:
    *   Implementation of the "Standard" and "Hidden" states.
    *   Props: `EnvelopeRecord` (from types), `spent` (calculated), `onClick`.
    *   Use `framer-motion` for the progress bar animation if possible.

2.  **`src/components/modules/finance/TransactionFab.tsx`**:
    *   Floating Action Button (Grid Layout for Mobile).
    *   Should open a Modal/Drawer (use `vaul` or standard Dialog).
    *   Implement the "Calculator" input logic (Screen 1 of Mockup).

3.  **`src/components/modules/finance/FinanceDashboard.tsx`**:
    *   The container component.
    *   Implement the "Joint / Personal" toggle (Segmented Control).
    *   Render the list of `EnvelopeCard`s.

## Deliverable
Create a file: `.agent_comms/outbox/dev_ui_components_001.md` containing the React components.
