# Task Breakdown

**Status:** Initial tasks from the audit; refine affected files and estimates after inventory.

| ID | Task | Priority | Dependencies | Deliverable / acceptance | Complexity |
|---|---|---|---|---|---|
| TASK-001 | Complete route/screen inventory | P1 | None | Every route has path, audience, guard, data dependencies and error states. | M |
| TASK-002 | Trace signup journey and reproduce CI failure | P0 | Access to CI trace/logs | Root cause supported by console/network/server evidence; test asserts real behavior. | M |
| TASK-003 | Inventory migrations and compare remote history read-only | P0 | Read-only Supabase access | Version-diff report; no production schema writes performed. | M |
| TASK-004 | Build route/action/RLS permission matrix | P0 | TASK-001, migration inventory | Every sensitive operation has role and negative-access tests. | L |
| TASK-005 | Verify payment provider readiness | P0 | Server/API inventory | Explicit mock/live boundary and launch-gate report; no live charges. | L |
| TASK-006 | Complete API/server-action catalog | P1 | TASK-001 | Actual contracts and linked tests documented; no invented endpoints. | L |
| TASK-007 | Complete field-level schema and ER diagram | P1 | TASK-003 | Tables/fields/FKs/policies traced to migration/type evidence. | L |
| TASK-008 | Extract design tokens and screen states | P2 | TASK-001 | Screen inventory and tokens cited to source files. | M |
| TASK-009 | Audit privacy/consent behavior | P1 | Route/component inventory | Optional processing demonstrably blocked until consent where required. | M |
| TASK-010 | Validate docs/diagrams/traceability | P1 | TASK-001–009 | Link/ID/diagram checks complete and unknowns listed. | M |
| TASK-011 | Verify backup, restore, logs and alerts | P2 | Infrastructure access | Operational evidence and recovery runbook. | M |

## Sequencing

TASK-002 and TASK-003 can run in parallel after confirming access and using isolated test resources. TASK-004 depends on route and schema inventories. TASK-005 depends on API/provider code inventory. TASK-010 is final validation.


## Current signup/payment findings

- The source shows the UI creates a test payment intent before calling Supabase Auth signup. The database trigger finalizes the intent using the transaction ID and normalized email.
- Check the actual Auth signup response and Postgres logs for a payment-intent match failure or activity-trigger exception before changing code.
- The current webhook signature check is only a placeholder and must not be considered production-ready. Real Peach launch remains blocked until cryptographic verification and idempotency are tested.
