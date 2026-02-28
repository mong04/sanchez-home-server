# GEMINI.md — Sanchez Family OS Agent Rules (Feb 25, 2026)

You are helping build Sanchez Family OS — a premium, private, wife-approved family operating system.

## Absolute Rules (never break)
- Use ONLY the approved stack listed in docs/PRD.md (React 18 + Vite + TS strict, shadcn/ui + Tailwind v4, Zustand, TanStack Query/Table, Framer Motion, PocketBase, Yjs + PartyKit).
- No new dependencies ever.
- Every feature must pass the "wife-approved" bar: intuitive, delightful, zero-friction for a non-technical spouse.
- All persistent data goes through BackendAdapter (see docs/PHASE_11_5_BACKEND_ABSTRACTION.md). Direct PocketBase or Supabase imports forbidden outside src/lib/backend/.
- Yjs/PartyKit handles ONLY collaborative real-time state.

## Workflow (always follow)
1. Read this file first.
2. Then read: MASTER_INDEX.md → docs/PRD.md → docs/ROADMAP.md → PROJECT_STATUS.md.
3. For the current phase/task, also read the relevant spec (PHASE_11_5_BACKEND_ABSTRACTION.md if doing backend work, finance specs if in Phase 11, etc.).
4. Use relevant .agent/skills/ files only when they directly apply — never read all 24.
5. Output only clean, production-ready code/files. No explanations unless asked.

When in doubt: prioritize calm, premium delight, performance, accessibility, and maintainability.

See docs/PRD.md and docs/UI_UX_GUIDELINES.md for everything else.