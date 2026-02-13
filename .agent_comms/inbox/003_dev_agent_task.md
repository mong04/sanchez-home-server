# Task Assignment: Development Agent
**Priority**: Critical
**Context**: "Sanchez Family Finance Hub" - Phase 2 (Core Engine)
**Reference Docs**: 
- `.agent_comms/outbox/planning_schema_draft_001.md` (Schema Definition)
- `docs/finance/PRD.md`

## Objective
We need to initialize the PocketBase backend. Since we cannot "run" the verified schema yet, we need you to generate the **JSON Schema Import File** that the user can load into PocketBase to auto-create all collections and rules.

## Tasks
1.  **Generate `backend/pb_schema_v1.json`**:
    *   Based on the `planning_schema_draft_001.md`.
    *   Create a valid JSON array of `Collection` objects.
    *   *Collections*: `users`, `accounts`, `envelopes`, `transactions`.
    *   *Rules*: Translate the "Pseudo-SQL" from the Planning report into actual PocketBase Rule strings (e.g., `owner.id = @request.auth.id`).
    *   *Types*: Ensure fields like `balance` are `number`, `is_joint` is `bool`, etc.

2.  **Scaffold Types (`src/types/pocketbase.ts`)**:
    *   Generate TypeScript interfaces that match the schema.
    *   Example: `interface Envelope { id: string; name: string; budget_limit: number; ... }`

## Deliverable
Create a file: `.agent_comms/outbox/dev_schema_v1.md` containing:
- Code block for `pb_schema_v1.json`.
- Code block for `src/types/pocketbase.ts`.
