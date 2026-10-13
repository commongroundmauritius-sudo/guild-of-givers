# Open Decisions

| ID | Decision | Why it matters | Current status / next step |
|---|---|---|---|
| DEC-001 | Is this documentation for CommonGround as implemented, or should it target planned Citizen+ branding/model? | Brand, terminology, tiers, merchant discounts and Impact Pool change product requirements. | This first pass documents the current repository as CommonGround. Confirm scope before changing product requirements. |
| DEC-002 | What is the approved membership and financial model? | UI wording, ledgers, receipts, allocations and legal obligations depend on actual funds flow. | Not settled by source code alone; product/legal owner decision required. |
| DEC-003 | What is the approved Impact Pool allocation and priority-overflow logic? | Financial reporting and acceptance tests depend on deterministic rules. | Existing documents describe this inconsistently; reconcile approved business rules. |
| DEC-004 | Is Peach Payments integrated and enabled in any current environment? | Real-money launch and webhook security depend on provider status. | Existing audit says real integration was deferred; inspect current code/config without exposing secrets. |
| DEC-005 | Which Cloudflare environment and bindings are production-authoritative? | Build, secrets and deployment verification. | Inspect deployment config and CI; record variable names only. |
| DEC-006 | Can Supabase migration history/schema be inspected read-only? | Required to resolve reported migration drift without destructive changes. | No live database queried during this audit. |
| DEC-007 | What are refund, cancellation, receipt, retention and account-deletion policies? | Member trust, compliance and support workflows. | Must be explicitly approved and reflected in code/docs. |
| DEC-008 | Which older audit/gap documents are authoritative? | Prevent repeated work and contradictions. | Compare each against current implementation and date findings. |
| DEC-009 | What support/monitoring and incident response commitments exist? | Production readiness and recovery. | Not established in this audit. |
