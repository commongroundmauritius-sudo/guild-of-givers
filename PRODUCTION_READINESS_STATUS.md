# CommonGround Production Readiness — Current Status

**Date:** 11 September 2026  
**Branch:** `production-readiness-finalization`

This is the current source-of-truth checklist. Older audit reports are historical records and are not treated as current green-light evidence by themselves.

## Phase status

| Phase                                 | Status        | Current result                                                                                                                                                    |
| ------------------------------------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Repository / architecture audit       | ✅ Complete   | Architecture and repository baseline reviewed.                                                                                                                    |
| Production branch                     | ✅ Complete   | Dedicated finalization branch maintained.                                                                                                                         |
| Build & CI infrastructure             | 🟢 Complete   | Node 22, reproducible `npm ci`, lint, production build, Worker validation, preview readiness and Playwright pipeline are implemented.                             |
| Security / RLS                        | 🟢 Complete   | Automated audit passes; RLS/function hardening and payment/priority constraints are in place.                                                                     |
| Payment & allocation                  | 🟢 Mock-ready | Payment is intentionally provider-agnostic and uses MockPaymentProvider for end-to-end testing. Peach is a future provider implementation, not a current blocker. |
| Membership / Organization / Community | 🟡 Validation | Core flows exist; final E2E/permission regression checks remain in the production gate.                                                                           |
| Compliance / accessibility / cookies  | 🟡 Validation | WCAG/cookie implementation exists; final browser regression validation remains.                                                                                   |
| Documentation cleanup                 | 🟢 Complete   | This document separates current validation from historical reports.                                                                                               |
| Final validation                      | ⏳ Pending    | Production Validation must pass after the migration-version correction.                                                                                           |

## Payment architecture decision

The MockPaymentProvider is intentional. It lets the complete membership → payment confirmation → subscription → allocation workflow be tested without a live gateway.

`PaymentProvider` and `PaymentService` are the provider boundary. A future Peach implementation should replace the provider implementation/configuration without changing membership, subscription, allocation or ledger domain logic.

Future Peach work: hosted checkout/session creation, provider-specific subscription/token handling, provider webhook signature verification, event mapping, idempotent event persistence, production secrets/webhook configuration, and sandbox-to-production verification.

No Peach credentials are required for the current readiness work.

## Mock payment contract

A successful mock checkout must confirm a transaction, confirm an active subscription, convert the lead only after confirmation, and permit member account creation only after confirmed payment. The mock/simulation tooling also exercises failure, cancellation, resume and renewal paths.

## Financial contract

**Gross payment → transaction fee → net amount → 20% CommonGround share + 80% Organization pool → priority allocation → overflow → Impact Pool fallback.**

Priority allocation is ordered by `priority_level`. Full initiatives do not consume funds; the remainder continues to the next priority and ultimately to the Impact Pool.

## Security contract

- Publicly exposed tables require RLS.
- Anonymous writes are blocked from sensitive financial/partner data.
- `SECURITY DEFINER` functions use a controlled `search_path`.
- Payment webhook events are uniquely identifiable by provider/event ID.
- Member priority slots and member/initiative preference pairs are unique.
- Organization access is tenant-scoped through authoritative organization ownership.

## Final gate

The repository is fully production-ready only when the latest GitHub Production Validation run is green. Implementation readiness and final runtime validation are tracked separately until that point.
