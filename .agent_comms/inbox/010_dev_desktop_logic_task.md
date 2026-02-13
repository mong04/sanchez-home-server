# Task Assignment: Development Agent (Charts & Logic)
**Priority**: High
**Context**: "Sanchez Family Finance Hub" - Phase 4
**Dependencies**: `recharts` (or suggest better lib), `react-hook-form`

## Skills to Activate
- `.agent/skills/react-specialist` (Performance for data grids)
- `.agent/skills/vercel-react-best-practices` (Bundle size optimization for chart libs)

## Objective
Implement the logic and visualization components for the Desktop Dashboard.

## Tasks
1.  **Charts Setup**:
    - Recommend and install a charting library (e.g., `recharts` or `visx`).
    - Create `SpendingTrendChart.tsx`: Line chart showing cumulative spending vs. linear budget burn-down.
2.  **Budget Allocation Logic**:
    - Create `useBulkUpdateEnvelopes` hook (bulk update in PocketBase).
    - Implement the "Rollover" calculation logic (Previous Balance + New Income = Available).

## Deliverable
Create `.agent_comms/outbox/dev_desktop_logic.md` with:
- Proposed library choice.
- Component code for the Charts.
- Hook code for bulk updates.
