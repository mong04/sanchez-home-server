# Risk Register - Family Finance Hub

| ID | Risk Description | Impact (1-5) | Probability (1-5) | Severity (IxP) | Mitigation Strategy | Owner |
|----|------------------|--------------|-------------------|----------------|---------------------|-------|
| R1 | **Data Loss**: Local database corruption or sync failure leads to lost financial records. | 5 | 2 | 10 | Implement automated daily backups to separate drive/cloud. Use append-only logs (`Yjs` history) where possible. | Dev Agent |
| R2 | **Low Adoption**: "The Spender" finds manual entry too tedious. | 4 | 3 | 12 | Focus heavily on Mobile UI speed (load < 1s, < 3 taps to enter). Gamify entry ("Streak" counter). | Design Agent |
| R3 | **Security Breach**: unauthorized access to financial data on local network. | 5 | 1 | 5 | Enforce strict Auth (authelia/custom JWT). Encrypt sensitive fields in DB. | Security Agent |
| R4 | **Sync Conflicts**: Two users editing budget simultaneously causes math errors. | 4 | 3 | 12 | Use CRDTs (PartyKit/Yjs) for mathematical correctness. "Last Write Wins" for metadata. | Dev Agent |
| R5 | **Scope Creep**: Desire for "Bank Sync" complicates project. | 3 | 4 | 12 | strictly adhere to "No Bank Sync" rule for MVP. Revisit in Phase 6 only. | PM Agent |
