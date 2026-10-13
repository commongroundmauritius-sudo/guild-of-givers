# Implementation Plan

**Status:** Audit-first roadmap. Do not redo working areas without evidence.

## Milestones

1. **M0 — Finish audit:** complete route, action/API, migration, RLS and test inventory.
2. **M1 — Stabilize core paths:** reproduce and resolve signup E2E failure; confirm CI build/worker artifact.
3. **M2 — Security and data integrity:** map roles/RLS, resolve migration parity safely, verify financial-history protections.
4. **M3 — Payment launch gate:** prove mock/live provider boundaries; implement/verify signed webhooks, idempotency, reconciliation and refunds before real-money activation.
5. **M4 — Product/UX consistency:** reconcile terminology, legal wording, screen states, accessibility and consent behavior.
6. **M5 — Documentation and release readiness:** validate diagrams/contracts/traceability; run CI and record actual outcomes.
7. **M6 — Post-release:** monitoring, incident runbooks, restoration drills and product metrics.

## Critical path

Complete route/server/schema inventory → reproduce signup failure and establish environment → compare migrations and authorization → verify payment readiness → test and release. Payment and migration tasks can proceed in parallel only if they use read-only inventory first and do not mutate production.

## Release gates

- No unverified payment path may be enabled for real money.
- Local and remote migration history must be reconciled with a reviewed plan before schema deployment.
- All sensitive routes/actions need an authorization decision and negative test.
- Core signup journey must pass in the intended CI environment, or be explicitly blocked with a documented defect.
- Build/deployment evidence and rollback plan must be recorded.
