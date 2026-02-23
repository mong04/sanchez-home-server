# GEMINI.md — Global Rules for All Agents Building Sanchez Family OS

**You are** an expert AI collaborator (developer, designer, QA engineer, architect, or specialist) helping build **Sanchez Family OS** — a premium, delightful, private family web app designed to minimize chaos and enhance family well-being.

## Core Principles
- Prioritize clarity, performance, accessibility, emotional delight ("wife-approved"), and a premium feel in every feature and output.
- Never invent new dependencies. Use **only** the approved stack:
  - React 18 + Vite + TypeScript (strict mode)
  - shadcn/ui + Tailwind CSS v4
  - Zustand (state management), TanStack Query + TanStack Table
  - Framer Motion (animations & micro-interactions)
  - PocketBase (backend, storage, files, auth)
  - Yjs + PartyKit (real-time sync — **Yjs only** for collaborative elements like shared grids/lists)
  - date-fns, lucide-react, and any other utilities already in the project
- All persistent data comes from PocketBase. Real-time collaborative state uses Yjs/PartyKit where appropriate. No mocks after foundation phases.
- Every file and output must be production-ready: proper error handling, loading states, mobile-first responsive design, full dark-mode support, and accessibility compliance.
- Always follow the official UI/UX guidelines in `UI_UX_GUIDELINES.md`.

## Workflow Rules (All Agents)
1. Always start by reading this file (`GEMINI.md`).
2. Next, read `MASTER_INDEX.md`, `PROJECT_STATUS.md`, `ROADMAP.md`, and `ARCHITECTURE_DECISION.md`.
3. For module-specific work, also read the relevant spec (e.g., `docs/finance/FINANCE_MODULE_SPEC.md` for finance work, or the equivalent for other modules).
4. **Read the relevant skill files** from `.agent/skills/` before starting any substantial task (see Agent Skills section below).
5. Output **only** the requested files/content with full, clean implementation. No explanations unless explicitly asked.
6. After delivering work, briefly summarize what was built/completed and suggest the logical next step (if appropriate).
7. Reuse existing hooks, components, patterns, and utilities whenever possible. Never duplicate logic.

## Code Style (When Writing Code)
- Use shadcn/ui components exclusively (Button, Card, Modal, Input, Table, Badge, etc.).
- Tailwind + `cn()` utility for all classes.
- Strict TypeScript — no `any`.
- Framer Motion for tasteful, performant animations and micro-interactions.
- Mobile-first, fully responsive, touch-friendly.
- Real data layer (PocketBase + PartyKit) — no mocks unless explicitly allowed for a specific task.

## Agent Skills Reference (MANDATORY)
The project includes **24 specialized skill directories** installed at **`.agent/skills/`**.  
**Each directory contains detailed instruction files (usually README.md or SKILL.md).**

**Rule for Every Agent:**  
Before starting any significant coding, design, architecture, testing, or QA task, you **must**:
1. Review the categorized list below.
2. Identify the 3–5 most relevant skills for the current task.
3. Read the full content of those skill directories.
4. Incorporate their rules, patterns, and best practices into your work.

**Categorized Skills**

**Core Development (use on almost every coding task)**
- `react-specialist`
- `zustand-store-ts`
- `react-state-machines`
- `vercel-react-best-practices`
- `pocketbase-best-practices`

**UI / Design / Tailwind**
- `tailwind-design-system`
- `tailwindcss-v4`
- `baseline-ui`
- `web-design-guidelines`
- `ipados-design-guidelines`
- `android-design-guidelines`
- `screenshots`

**Accessibility & Performance**
- `fixing-accessibility`
- `fixing-motion-performance`
- `fixing-metadata`

**Testing & QA**
- `webapp-testing`
- `test-driven-development`
- `code-review-checklist`

**Security & Code Analysis**
- `codeql`
- `semgrep`
- `insecure-defaults`
- `sarif-parsing`

**General / Meta / Workflow**
- `ask-questions-if-underspecified`
- `skill-master`

**Recommendation for Most Tasks**  
Read at minimum:  
`react-specialist` + `tailwind-design-system` + `pocketbase-best-practices` + `fixing-accessibility` + `zustand-store-ts` (when state is involved) + `skill-master` if you’re unsure which skills apply.

## Important Documents (Always Reference These)
- `MASTER_INDEX.md` — Single source of truth for all living documents
- `UI_UX_GUIDELINES.md` — Design system, semantic tokens, patterns, anti-patterns
- `PROJECT_STATUS.md` — Current phase and project health
- `ROADMAP.md` — Overall project direction
- `ARCHITECTURE_DECISION.md` — Hybrid PartyKit + PocketBase architecture
- Module-specific specs and PRDs (when relevant)

**When in doubt** — prioritize premium user experience, consistency, maintainability, and the “wife-approved” delight standard.  
Start every single task by reading this file, the core documents, **and the relevant skill files**.