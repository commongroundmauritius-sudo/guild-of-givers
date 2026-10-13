# Application Flows

**Status:** Preliminary. Flow steps below separate known architecture from required verification.

## FLOW-001 — Public initiative discovery

- **Actor:** Public visitor/member.
- **Starting point:** Initiative detail route `/initiatives/$slug` (verified route module).
- **Preconditions:** Initiative slug exists and is readable by the current user.
- **Observed evidence:** Route module uses TanStack `createFileRoute`, React Query and Supabase client; full loader behavior not yet documented.
- **Expected branches to verify:** loading, unknown slug, unpublished/private initiative, query error, successful render.
- **Authorization:** Public-read rules must be checked against RLS and query filters.
- **Related:** FR-001, NFR-001.

## FLOW-002 — Member signup

- **Actor:** Prospective member.
- **Starting point:** Signup entry point and Playwright journey.
- **Observed evidence:** E2E test `tests/e2e-signup-journey.spec.ts` is invoked by production-validation workflow; current failure is reported in project history but not reproduced in this audit.
- **Must inspect:** actual form fields, step transitions, validation, Auth sign-up call, profile/role trigger, success navigation, retry behavior and worker/Auth logs.
- **Failure branches:** invalid form, duplicate email, Auth/network failure, profile/role initialization failure, interrupted navigation.
- **Related:** FR-002, FR-003, NFR-004.

## FLOW-003 — Membership/payment

- **Actor:** Member, application backend and payment provider.
- **Documented intended flow:** signup → select membership → checkout → verified provider event → trusted subscription/payment records → member-visible status.
- **Important status:** this is the README's documented flow, not verified live behavior. Existing production audit says real Peach integration was deferred.
- **Must inspect:** actual mock/live provider selection, server endpoint, signature validation, idempotency, amount/currency/reference verification, duplicate events, refunds, retries and reconciliation.
- **Related:** FR-004, FR-008, FR-009, BR-002, BR-006.

## FLOW-004 — Organization content management

- **Actor:** Organization representative/admin.
- **Status:** Documented product scope; detailed routes and operations remain to be inventoried.
- **Must inspect:** ownership model, draft/publish lifecycle, approval rules, file uploads, RLS and cross-organization denial tests.
- **Related:** FR-006, FR-007, NFR-001.

## FLOW-005 — Administrative governance and finance

- **Actor:** Admin.
- **Status:** README describes moderation and financial monitoring; full screen/API/schema mapping pending.
- **Must inspect:** role guard, permitted transitions, audit trail, finance data joins, export/download behavior and sensitive-data redaction.
- **Related:** FR-007, FR-008, NFR-003.

## FLOW-006 — Cookie/privacy choices

- **Actor:** Visitor/member.
- **Status:** Recent project context mentions consent banner and policy tests; current implementation not inspected in this audit.
- **Must inspect:** default consent state, script loading order, persistence, withdrawal, policy routes and whether optional scripts are blocked before consent.
- **Related:** FR-012, NFR-006.
