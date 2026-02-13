# Task Assignment: Research Agent (PWA & Offline)
**Priority**: High
**Context**: "Sanchez Family Finance Hub" - Phase 3
**Reference Docs**: `src/lib/query-client.ts`

## Skills to Activate
You MUST reference the following skills to ensure best practices:
- `.agent/skills/pocketbase-best-practices` (for offline data patterns)
- `.agent/skills/android-design-guidelines` (for understanding PWA install prompts on Android)
- `.agent/skills/ipados-design-guidelines` (for iOS PWA constraints)

## Objective
Identify the best practices for converting the current Vite+React app into a robust PWA that can handle offline writes.

## Questions
1.  **Vite PWA Plugin**: What is the minimal config needed to make the app "installable" on iOS/Android?
2.  **Offline Indicator**: How should we detect and display "Offline Mode" to the user without being annoying?
3.  **Sync Conflicts**: If two users edit the same envelope offline, how does PocketBase handle the conflict? (Last write wins? Or do we need custom logic?)

## Deliverable
Create a file: `.agent_comms/outbox/research_pwa_offline.md` with your findings.
