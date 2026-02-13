# Task Assignment: Planning Agent (Updated)
**Priority**: High
**Context**: "Sanchez Family Finance Hub"
**Stack Pivot**: **PocketBase**.

## Objective
The schema must now be defined in terms of **PocketBase Collections** and **API Rules**, not generic SQL.

## Tasks
1.  **Draft the PocketBase Schema**:
    *   Define **Collections**:
        *   `users` (system default, add `role` or `groups` field)
        *   `accounts` (type: select, balance: number, owner: relation->users)
        *   `envelopes` (name: text, budget_limit: number, current_balance: number, owner: relation->users, visibility: select['public','private','hidden'])
        *   `transactions` (payee: text, amount: number, envelope: relation->envelopes, account: relation->accounts)
    
2.  **Define API Rules (Security)**:
    *   For each collection, provide the pseudo-code for `List/View`, `Create`, `Update`, `Delete` rules.
    *   *Goal*: Ensure the "Child User" (Armin) literally returns 0 results if they try to `GET /api/collections/envelopes/records` for data they don't own.

3.  **User Story Mapping**:
    *   Update stories to reflect the "PocketBase Admin UI" vs "Custom Frontend" split.
    *   *Note*: We can use the PB Admin UI for the "CFO" initially to save time! (MVP Hack).

## Deliverable
Create a file: `.agent_comms/outbox/planning_schema_draft_001.md` containing:
- **Collections_Draft.json** (Conceptual export).
- **API_Rules_Logic.md**.
