# CommonGround Production Readiness Status

**Date:** 11 September 2026  
**Repository:** `commongroundmauritius-sudo/guild-of-givers`  
**Working branch:** `production-readiness-finalization`

## Purpose

This document is the single progress record for the production-readiness work. It records what has been verified or implemented, what remains, and the exact point reached after each phase. A phase is only marked complete when the relevant implementation and validation evidence exists; historical PR claims alone are not treated as proof.

## Overall status

| Phase | Status | Where we have reached | Remaining work |
|---|---|---|---|
| 1. Repository / architecture audit | ✅ Complete | Repository structure, architecture and production baseline reviewed. | Maintain as baseline. |
| 2. Production branch | ✅ Complete | `production-readiness-finalization` established for finalization work. | Merge only after final gates pass. |
| 3. Build & CI infrastructure | 🟡 In progress | Production validation workflow added; Node/tooling standardized; broken `temp_skills` gitlink removed; dependency-lock synchronization identified as a real blocker. | Get a clean `npm ci`, then pass lint, production build, worker-output validation and E2E. |
| 4. Security / RLS | 🟡 In progress | Automated security/RLS audit added. Existing RLS protections and admin/organization access controls reviewed. `SECURITY DEFINER` signup trigger hardened with an explicit `search_path`. | Run the complete audit successfully after CI dependency state is clean; review every exposed table/function and verify negative-access cases. |
| 5. Payment & allocation | ⏳ Not started as final gate | Payment architecture and ledger model are documented: Peach webhook is the trusted payment confirmation source and `payment_events` is the audit trail. | Verify webhook validation/idempotency, subscription lifecycle, payment ledger, receipts, allocation rules, caps/overflow and failure/retry paths with tests. |
| 6. Membership / Organization / Community | ⏳ Not started as final gate | Core actors and workflows exist in the application architecture. | Full role matrix and end-to-end verification for member, organization, admin/moderation and community permissions. |
| 7. Compliance / accessibility / cookies | 🟡 In progress | Accessibility and cookie-consent work has been implemented in the project. | Perform final production validation, including keyboard/focus checks, semantic labels, contrast, consent persistence and analytics gating. |
| 8. Documentation cleanup | 🟡 In progress | This status document establishes the current production-readiness record. | Reconcile README, architecture notes, migration documentation, operational runbooks and known limitations. |
| 9. Final validation | ⏳ Blocked | Final gate is defined but cannot honestly pass while CI/security checks remain red or unverified. | All prior phases must pass; run full CI/E2E/security checks and record results before declaring production ready. |

## Stage-by-stage record

### Phase 1 — Repository / architecture audit

**Status: Complete.**

The repository is treated as a backend-source-of-truth application using React/TanStack on the frontend and Supabase/PostgreSQL/RLS for backend enforcement. The README documents the core actors, database model, payment flow and governance model.

**Reached:** Architecture baseline established.

**No outstanding audit task:** only normal maintenance if architecture changes.

### Phase 2 — Production branch

**Status: Complete.**

The production-readiness work is isolated on `production-readiness-finalization`.

**Reached:** Finalization work can be validated without treating unfinished work as production-ready.

### Phase 3 — Build & CI infrastructure

**Status: In progress.**

Implemented:

- Production validation workflow covering dependency installation, lint, production build, worker-output checks, Playwright installation, preview startup and E2E.
- CI Node version standardized to Node 22.
- Native `curl` polling used instead of an undeclared `wait-on` dependency.
- Repository cleanup removed the broken `temp_skills` gitlink from the production-readiness branch.
- Dependency-lock mismatch was identified rather than bypassed.

**Current blocker:** `npm ci` must succeed with the committed `package-lock.json` matching `package.json`.

**Next gate:** clean dependency installation, then lint → build → worker validation → E2E.

### Phase 4 — Security / RLS

**Status: In progress.**

Implemented/reviewed:

- Automated RLS/security audit workflow.
- Checks for RLS on public tables.
- Checks for anonymous write grants.
- Checks for unsafe `SECURITY DEFINER` functions.
- Checks for service-role credentials leaking into client code.
- Signup `SECURITY DEFINER` trigger hardened with `SET search_path = public`.
- Partner-application access model uses controlled server-side/admin access rather than unrestricted anonymous table writes.

**Reached:** Security controls are being validated as code, not only described in documentation.

**Next gate:** complete successful automated audit and manually verify sensitive financial/auth/profile/organization/community access boundaries.

### Phase 5 — Payment & allocation verification

**Status: Pending.**

The documented architecture states that Peach webhooks are the trusted confirmation source and that actual payment movement is recorded in the payment ledger and `payment_events` audit trail.

**Required before completion:**

- Verify webhook authenticity/validation.
- Verify idempotency and duplicate-event handling.
- Verify failed/abandoned payment behavior.
- Verify subscription activation only after successful payment confirmation.
- Verify receipts are generated from confirmed payments.
- Verify allocation priority order, caps and Impact Pool fallback.
- Verify fee/platform accounting does not corrupt allocation amounts.
- Verify refunds/cancellations and recurring-payment edge cases.

### Phase 6 — Membership / Organization / Community

**Status: Pending.**

**Required before completion:**

- Member signup/payment/profile lifecycle.
- Subscription pause/cancel/resume behavior.
- Member allocation priorities and persistence.
- Organization creation/verification/initiative approval.
- Organization ownership boundaries.
- Admin and super-admin permissions.
- Community posting, moderation, editing/resubmission and deletion rules.
- Organization restrictions to its own content.
- Suspension/deactivation behavior.

### Phase 7 — Compliance / accessibility / cookies

**Status: In progress.**

The platform has implementation work covering accessibility and cookie consent.

**Final verification required:**

- Necessary cookies always available.
- Analytics cookies/scripts blocked until consent.
- Preference changes respected after initial choice.
- Keyboard-only navigation.
- Visible focus states.
- Form labels and accessible names.
- Error messaging and validation.
- Dialog/modal focus management.
- Contrast and responsive behavior.
- Third-party scripts limited to required purposes.

### Phase 8 — Documentation cleanup

**Status: In progress.**

This document is the current dated progress record.

**Remaining:** consolidate final architecture, deployment, payment operations, security/RLS, compliance, testing and incident/runbook documentation once the implementation gates are complete.

### Phase 9 — Final validation

**Status: Pending / blocked by earlier phases.**

Final validation requires all of the following:

1. Clean dependency installation.
2. Lint passes.
3. Production build passes.
4. Cloudflare worker output/config validation passes.
5. E2E suite passes.
6. Security/RLS audit passes.
7. Payment/allocation tests pass.
8. Membership/organization/community permission tests pass.
9. Accessibility/cookie validation passes.
10. Documentation and known limitations are reconciled.

Only after all ten gates pass should the branch be considered **Production Ready**.

## Current checkpoint — 11 September 2026

**We have reached the Build & CI → Security/RLS transition.** The infrastructure and security validation mechanisms are in place, but the repository has not yet earned a final green status because the dependency lock state has prevented a clean CI run.

The next objective is therefore not to rewrite already-working application features. It is to get the repository into a reproducible dependency state, obtain clean CI/security results, and then proceed through payment, product-permission, compliance and final-validation gates in order.

## Change-control rule

Every subsequent production-readiness update should append or revise this document with:

- date,
- phase affected,
- implementation completed,
- validation result,
- remaining blocker(s),
- next gate.

No phase should be changed to `✅ Complete` solely because code exists; its required validation must also pass.
