# Requirements Traceability Matrix

**Status:** Initial mappings; UNKNOWN means evidence is not yet sufficient.

| Requirement | User story | Flow | Screen | API/action | Data | Test | Task |
|---|---|---|---|---|---|---|---|
| FR-001 initiative discovery | US-001 | FLOW-001 | SCR-002 | API-002 (specific query UNKNOWN) | initiatives | UNKNOWN | TASK-001, TASK-007 |
| FR-002 signup | US-002 | FLOW-002 | SCR-004 | API-001 (specific Auth call UNKNOWN) | auth.users, profiles (details UNKNOWN) | `tests/e2e-signup-journey.spec.ts` referenced | TASK-002 |
| FR-003 role initialization | US-002 | FLOW-002 | SCR-004 | Database trigger/function UNKNOWN | user_roles, profiles | UNKNOWN | TASK-004, TASK-007 |
| FR-004 subscription | US-005 | FLOW-003 | UNKNOWN | API-003/API-004 actual operation UNKNOWN | subscriptions | UNKNOWN | TASK-005, TASK-006 |
| FR-006 organization/initiative management | US-006 | FLOW-004 | UNKNOWN | UNKNOWN | initiatives, organizations (relationship to verify) | UNKNOWN | TASK-001, TASK-004 |
| FR-007 admin governance | US-007 | FLOW-005 | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | TASK-001, TASK-004 |
| FR-008 financial history | US-008 | FLOW-005 | SCR-003 (partial evidence) | API-002 (queries to inventory) | payments, financial_events | UNKNOWN | TASK-004, TASK-007 |
| FR-009 trusted payment confirmation | US-009 | FLOW-003 | NOT APPLICABLE | API-004 implementation unverified | subscriptions, payments, payment_events | UNKNOWN | TASK-005 |
| FR-012 consent/privacy | US-010 | FLOW-006 | UNKNOWN | UNKNOWN | consent storage UNKNOWN | consent tests mentioned in project history; current status unknown | TASK-009 |

## Orphan and gap checks

- Requirements without verified implementation: FR-009 real provider confirmation, until actual code proves otherwise.
- Screens without complete behavior: SCR-001 through SCR-004 need full component and state inspection.
- API contracts without catalog: most Supabase calls and server operations.
- Data entities without field-level schema: all entities in preliminary schema list.
- Critical requirements without verified acceptance tests: payment security, RLS denial, role escalation prevention and migration parity.
- Proposed changes requiring possible migrations: event idempotency constraints, audit metadata, consent persistence or any new reporting fields; only add after schema review.
