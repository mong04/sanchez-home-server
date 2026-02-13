# Task Assignment: Design Agent
**Priority**: High
**Context**: "Sanchez Family Finance Hub" - Phase 2 (UI)
**Reference Docs**: `docs/finance/PRD.md`

## Objective
Design the user interface for the "Hybrid Budgeting" system. We need distinct views for the "Details Dashboard" (Desktop) vs "Quick Entry" (Mobile).

## Tasks
1.  **Mockup: The "Envelope" Card**:
    *   Visual design for a single budget category (e.g., "Groceries").
    *   Must show: Name, Icon, Progress Bar (Spent vs Limit), "Safe to Spend" amount.
    *   *Variant*: "Hidden/Private" state (blurred or collapsed).

2.  **Mockup: Mobile Quick-Add**:
    *   A floating action button (FAB) interaction.
    *   Screen 1: "Amount" (Numpad focus).
    *   Screen 2: "Envelope Selector" (Smart chips: 'Groceries', 'Dining', 'Gas').
    *   *Goal*: Speed. Max 3 taps to enter a transaction.

3.  **Mockup: Dashboard Layout**:
    *   How do we separate "Joint" vs "Personal" envelopes?
    *   (Tabs? Sections? Toggle switch?)

## Deliverable
Create a file: `.agent_comms/outbox/design_mockups_001.md` containing:
- Text-based descriptions or ASCII/Mermaid wireframes of the UI components.
- Tailwind CSS class recommendations for the "Envelope Card".
