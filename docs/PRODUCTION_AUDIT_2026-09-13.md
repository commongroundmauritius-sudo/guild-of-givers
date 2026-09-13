# CommonGround Production Audit — 2026-09-13

## Scope
Database/RLS, RPC execution grants, financial integrity, initiative deletion, organization isolation, CRM/analytics exposure, storage, authentication posture, CSRF, CI/build readiness, development mock payment flow, migrations and performance.

## Completed hardening
- All public tables retain RLS; no public table was found without RLS during the audit.
- Removed client-side mutation paths for subscription state, payment records, financial ledger events and email queue.
- Financial events remain immutable and survive initiative deletion.
- Initiative deletion foreign-key paths preserve financial history and null non-financial profile references.
- Hardened profile security fields against self-service privilege/ownership changes.
- Hardened organization security fields against organization-staff modification of verification, owner and platform financial counters.
- Admin/super_admin status permission triggers are aligned.
- `super_admin` inherits `admin` permission checks through the central `has_role()` helper.
- Removed self-service role insertion policy.
- Removed public lead-update policy.
- Tightened initiative update visibility to authenticated members/organization staff/admins.
- Revoked client TRUNCATE privileges across public tables and removed direct client access to sensitive financial/audit tables.
- Added indexes for all remaining unindexed foreign keys; current FK coverage checks show no missing supporting indexes.
- Limited `community-posts` storage bucket to JPEG/PNG/WebP images with a 5 MiB object limit.
- Tightened SECURITY DEFINER RPC execution grants; sensitive financial/admin RPCs are no longer callable by anon/authenticated roles.
- Removed public-role mutation policies.
- Consolidated selected duplicate CRM/activity/initiative-version/member-preference read/write policies.
- Optimized many RLS expressions so session identity is evaluated as a stable init-plan expression rather than repeatedly invoking `auth.uid()`.
- Added explicit TanStack Start CSRF middleware for server functions.
- Added a production guard so the mock payment provider throws instead of creating fake active subscriptions/payments in production.
- Added a production guard to the membership server function so unverified subscription state cannot be created from client-supplied data.

## Development mock payment flow
The development mock is now structured as a real end-to-end test harness rather than directly trusting browser-supplied subscription state:
1. Signup validates a minimum monthly amount of Rs 167 and captures the lead.
2. The mock provider creates a development transaction identifier.
3. The account is created only after the mock checkout step.
4. After successful development signup, the authenticated session calls the protected `dev_complete_mock_membership()` database function.
5. The function validates the authenticated user, amount, billing date and mock transaction prefix.
6. It creates the active monthly subscription, member initiative priorities, successful payment, immutable allocation ledger entries and a CommonGround mock receipt atomically.
7. A unique payment-provider identifier prevents duplicate mock payment processing.
8. The function is unavailable to anonymous users and is never invoked by production code paths.
9. Production still rejects the mock provider and the production membership server function remains fail-closed.

This gives CommonGround a meaningful development-only simulation of the membership/payment/allocation lifecycle without pretending that Peach Payments is already integrated.

## CI finding fixed
The production-validation workflow previously failed at lint before build/E2E. The root route formatting issue was fixed in commit `6f81572c1d1cc4a836f085cb6bf734f48a9c6603`. The Security Audit workflow passed on the final security-hardening commit `aff1c259ab555eedffeb75762d820560eae533dd`.

## Deferred: real Peach Payments
Real Peach Payments is intentionally deferred and is **not** treated as a blocker for the current development/system assessment. Before real-money launch, the provider layer must be replaced with verified Peach Hosted Checkout V2, server-side credentials, signed webhook verification, idempotency, amount/currency/reference verification, recurring tokenization and reconciliation.

## Remaining external configuration required before real-money launch
These items require access to the CommonGround/Peach/Supabase production accounts and cannot be safely fabricated in source control:
- Peach merchant/client credentials and entity/merchant IDs.
- Peach sandbox and production webhook configuration and webhook signing secret.
- Peach allowlisted CommonGround merchant domain/redirect URLs.
- Confirmation of recurring/tokenisation capability enabled for the CommonGround merchant account.
- Supabase Auth leaked-password protection setting enabled in the project dashboard.
- Production email/SMTP configuration and domain authentication.
- Final production secrets/environment bindings in the Cloudflare deployment.

## Non-blocking technical debt
- Supabase Performance Advisor still reports multiple-permissive-policy findings. Remaining policies should be consolidated only when resulting access semantics are proven equivalent.
- Supabase reports unused indexes; they should not be removed solely from advisor output while the product is still evolving.
- Public-facing organization/profile reads should eventually use deliberately safe public views or explicit column exposure so private ownership/contact fields cannot be selected accidentally.
- Security Advisor intentionally reports the public/authenticated SECURITY DEFINER RPCs that are required for public submissions or RLS-safe helper operations; these should remain narrowly scoped and documented.

## Data-integrity checks
Current production checks found zero orphan payments/subscriptions/allocations/financial events/member preferences for the tested foreign-key relationships.

## Migration state
Production migration history was re-read during the audit. No migration repair was performed.

## Final readiness decision
**The CommonGround database/security foundation and development mock payment lifecycle are substantially hardened for continued system testing. Real-money launch remains intentionally blocked only by the deferred Peach integration and required external account configuration.**