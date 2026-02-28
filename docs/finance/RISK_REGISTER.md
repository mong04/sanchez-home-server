# Risk Register: Sanchez Family OS

| ID | Risk Description | Impact (1-5) | Probability (1-5) | Severity | Mitigation Strategy | Owner |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **R1** | **Data Loss / Sync Conflict** <br> Offline edits conflict with server updates. | 5 | 3 | **High** | Implement specific "Last Write Wins" or CRDT-based merging via PartyKit/Yjs. Frequent backups of `pb_data`. | Dev Agent |
| **R2** | **Mobile UX Friction** <br> Entry takes too long, users abandon logging. | 4 | 4 | **High** | "One-Thumb" design for Quick Add. Home screen widget or PWA shortcuts. | Design Agent |
| **R3** | **Privacy Leak** <br> Financial data exposed via Cloudflare Tunnel. | 5 | 2 | **Medium** | Ensure Zero Trust Auth is strictly enforced on ALL API routes. Review middleware rules. | QA Agent |
| **R4** | **Scope Creep** <br> Adding too many "smart" features (OCR, AI analysis). | 3 | 4 | **Medium** | Strict adherence to MVP scope (Phase 1). Move advanced ideas to "Icebox". | Planning Agent |
| **R5** | **Performance Degradation** <br> Large transaction history slows down dashboard. | 3 | 2 | **Low** | Pagination for transaction lists. Aggregate balances on backend (PocketBase options). | Dev Agent |
| **R6** | **Backend Migration Data Loss** <br> Export/import fails mid-migration, leaving family with partial data on both backends. | 5 | 2 | **Medium** | Migration wizard creates a downloadable backup before any write operations. Import is idempotent (safe to retry). Wizard cannot proceed without verified backup. Reverse migration available as safety valve. | Dev Agent |
| **R7** | **Bank Sync API Security** <br> Plaid/MX API keys or PII (account numbers, routing numbers) exposed in frontend or transit. | 5 | 2 | **Medium** | API keys stored server-side only (never in frontend bundle). PII encrypted at rest. All bank connections require explicit user authorization. Regular security audit of bank sync integration. | QA Agent |
| **R8** | **Onboarding Friction** <br> Families cannot start using SFOS in <90 seconds on cloud, blocking adoption before they experience value. | 4 | 3 | **Medium** | Default to Supabase cloud (zero hardware). One-click signup with email invite. Pre-populated demo data option. First-run wizard guides through key features in 60 seconds. | Design Agent |

**Last updated:** February 25, 2026 (Post-Expert Consultation)
