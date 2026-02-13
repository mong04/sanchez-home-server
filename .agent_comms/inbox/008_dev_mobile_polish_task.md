# Task Assignment: Development Agent (Mobile Polish)
**Priority**: Medium
**Context**: "Sanchez Family Finance Hub" - Phase 3
**Reference Docs**: `src/components/modules/finance/TransactionFab.tsx`

## Skills to Activate
You MUST reference the following skills to guide your implementation:
- `.agent/skills/fixing-motion-performance` (Critical for smooth 60fps animations on mobile)
- `.agent/skills/fixing-accessibility` (Ensure touch targets are min 44px)
- `.agent/skills/tailwind-design-system` (Use semantic tokens)
- `.agent/skills/ipados-design-guidelines` (For "Safe Area" logic)

## Objective
Refine the mobile user experience (UX) to feel like a native app.

## Tasks
1.  **Touch Targets**: Audit `TransactionFab.tsx` and ensure all buttons are at least 44x44px (referenced in accessibility skill).
2.  **Haptics**: Implement `navigator.vibrate(5)` on keypress in the calculator logic.
3.  **Input Modes**: Ensure the number input brings up the numeric keypad on mobile (input type="tel" or custom numpad).
4.  **Safe Areas**: Ensure content respects iPhone notch/dynamic island (viewport-fit=cover).

## Deliverable
Create a file: `.agent_comms/outbox/dev_mobile_polish_001.md` with the updated component code.
