# Risk Register: Family Finance Hub

| ID | Risk Description | Impact (1-5) | Probability (1-5) | Severity | Mitigation Strategy | Owner |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **R1** | **Data Loss / Sync Conflict** <br> Offline edits conflict with server updates. | 5 | 3 | **High** | Implement specific "Last Write Wins" or CRDT-based merging via PartyKit/Yjs. Frequent backups of `pb_data`. | Dev Agent |
| **R2** | **Mobile UX Friction** <br> Entry takes too long, users abandon logging. | 4 | 4 | **High** | "One-Thumb" design for Quick Add. Home screen widget or PWA shortcuts. | Design Agent |
| **R3** | **Privacy Leak** <br> Financial data exposed via Cloudflare Tunnel. | 5 | 2 | **Medium** | Ensure Zero Trust Auth is strictly enforced on ALL API routes. Review middleware rules. | QA Agent |
| **R4** | **Scope Creep** <br> Adding too many "smart" features (OCR, AI analysis). | 3 | 4 | **Medium** | Strict adherence to MVP scope (Phase 1). Move advanced ideas to "Icebox". | Planning Agent |
| **R5** | **Performance Degradation** <br> Large transaction history slows down dashboard. | 3 | 2 | **Low** | Pagination for transaction lists. Aggregate balances on backend (PocketBase options). | Dev Agent |
