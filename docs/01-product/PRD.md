# Product Requirements Document (PRD)

**Status:** Draft — initial requirements inferred from repository documentation; not yet reconciled against every route and database operation.  
**Product name:** CommonGround (current repository terminology).  
**Source of truth:** source code and current migrations take precedence for existing behavior; approved business/legal decisions take precedence for future requirements.

## 1. Product vision and problem

**Documented intent:** CommonGround is a social-impact platform connecting members with organizations and initiatives, supporting recurring membership, allocation preferences, transparency and administrative governance.

**Assumption:** The product aims to make sustained community support easier to discover and track. Validate through product-owner confirmation.

## 2. Personas

- **US-001 Member:** discovers initiatives, signs up, manages membership and preferences, and views account/impact information.
- **US-002 Organization representative:** manages an organization profile and its initiatives or reporting, subject to approval and permissions.
- **US-003 Administrator:** reviews organization/initiative content and oversees platform operations.
- **US-004 Public visitor:** browses public content and starts membership signup.
- **US-005 Payment service:** external actor that may report payment events; real live integration is not verified.

## 3. Functional requirements

| ID | Requirement | Status / evidence |
|---|---|---|
| FR-001 | Provide public entry points to discover organizations/initiatives. | Documented; route inventory incomplete. |
| FR-002 | Provide a member signup journey. | Playwright test and signup route references exist; recent failure reported, current cause unverified. |
| FR-003 | Support authentication and profile/role initialization. | Supabase Auth configuration and README describe this; exact trigger and live behavior need verification. |
| FR-004 | Support membership/subscription records. | Tables and workflow described in README and migrations search results; end-to-end production behavior unverified. |
| FR-005 | Support member allocation preferences. | Described in project docs; current UI and backend consistency must be checked. |
| FR-006 | Support organization and initiative management. | Initiative slug route exists; complete create/edit/publish permissions require route and RLS audit. |
| FR-007 | Support administrative moderation/governance. | Described in README; route/action inventory required. |
| FR-008 | Maintain financial records/history. | `payments`, `payment_events`, `financial_events` are named in project evidence; schema and immutability controls need full verification. |
| FR-009 | Confirm successful real payments only from authenticated provider events. | Security requirement stated in `AGENTS.md`; real Peach integration is described as deferred in existing audit. |
| FR-010 | Support transparency/reporting on impact and financial allocation. | Documented product intent; calculation paths and access control remain to verify. |
| FR-011 | Provide account recovery, cancellation/refund and account deletion behavior. | Expected for a membership platform; implementation and policy are not yet verified. |
| FR-012 | Provide legal/privacy/cookie information and respect consent choices where applicable. | Recent project history mentions policy pages and cookie-consent tests; current routes and actual script blocking need audit. |

## 4. Non-functional requirements

| ID | Requirement | Status |
|---|---|---|
| NFR-001 | Enforce authorization server-side and with database RLS for protected data. | Required by project guidance; complete coverage unverified. |
| NFR-002 | Never trust client state alone to confirm payment or assign privileged roles. | Explicit project security principle. |
| NFR-003 | Preserve financial audit history and prevent unauthorized mutation/deletion. | Explicit guidance; database enforcement must be verified. |
| NFR-004 | Handle signup/payment failures with understandable recovery paths. | Required; recent signup E2E failure makes this a priority to validate. |
| NFR-005 | Keep responsive, keyboard-accessible, readable screens. | Proposed audit acceptance standard; actual accessibility score not measured. |
| NFR-006 | Protect secrets and personal/financial data; minimize logs containing sensitive values. | Required; detailed data inventory pending. |
| NFR-007 | Make builds and migrations reproducible in CI and new environments. | Required; prior migration drift and worker-build issues are reported in project history, not re-tested here. |
| NFR-008 | Provide observable errors and actionable operational logs for authentication and payment workflows. | Proposed; observability implementation not yet inventoried. |

## 5. Business rules

| ID | Rule | Status |
|---|---|---|
| BR-001 | Role assignment must be controlled by trusted backend/database logic. | Project guidance; verify trigger and privilege boundaries. |
| BR-002 | Payment success must not be inferred from a browser redirect or client-side status. | Project guidance; verify actual implementation. |
| BR-003 | Financial history should be auditable and protected against unauthorized deletion. | Project guidance; verify schema and grants/RLS. |
| BR-004 | Public, member, organization and administrator capabilities must be distinct. | Documented role model; exact matrix remains unknown. |
| BR-005 | The platform's legal description and customer-facing financial wording must match the actual funds flow. | Proposed governance rule; requires owner/legal approval. |
| BR-006 | Do not launch real-money payments until provider signatures, amount/currency/reference checks, idempotency, reconciliation and refund/failure paths are verified. | Proposed launch gate based on existing audit gap. |

## 6. Acceptance criteria examples

- **FR-002 / signup:** Given a valid signup form and a functioning test Auth service, when a user submits valid details, then the flow reaches the documented next step and displays actionable errors if Auth rejects the request. Exact steps must be aligned with the current screen implementation.
- **FR-003 / roles:** Given a new account, when trusted signup initialization runs, then the default role/profile are created once and the user cannot assign themselves a privileged role.
- **FR-009 / payments:** Given an unsigned, duplicate, wrong-amount, wrong-currency or unknown-reference event, when the backend receives it, then no successful subscription is created and the event is safely rejected or quarantined.
- **FR-006 / organization ownership:** Given an organization user, when they attempt to modify another organization's record, then both server/database authorization layers deny the operation.
- **FR-012 / consent:** Given optional analytics consent is not granted, when a page loads, then optional tracking does not execute. This criterion needs to be reconciled with the actual consent design and tested.

## 7. MVP and out of scope

**Candidate MVP (confirm against actual release scope):** public discovery, signup/auth, member account, organization/initiative pages, admin review, trustworthy subscription status, and transparent reporting.

**Not verified / do not assume live:** real Peach processing, automatic recurring charges, fully automated allocation, full reconciliation, Citizen+ tiers/rewards/merchant offers, and any unimplemented CRM/automation.

## 8. Dependencies and risks

Supabase project/configuration, Cloudflare runtime configuration, payment provider contract, email delivery, approved financial/legal wording, and consistent local/remote migration history. Risks are listed in `../06-audit/repository-audit.md`.

## 9. Open product questions

See [open decisions](../06-audit/open-decisions.md). In particular, confirm CommonGround vs planned Citizen+ scope, approved membership tiers, allocation/Impact Pool rules, payment launch status, and refund/cancellation/receipt policy.
