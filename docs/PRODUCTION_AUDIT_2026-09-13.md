# CommonGround Production Audit — 2026-09-13

## Scope
Database/RLS, RPC execution grants, financial integrity, initiative deletion, organization isolation, CRM/analytics exposure, storage, authentication posture, CSRF, CI/build readiness, payment architecture, migrations and performance.

## Completed hardening
- All public tables retain RLS; no public table was found without RLS during the audit.
- Removed client-side mutation paths for subscription state, payment records, financial ledger events and email queue.
- Financial events remain immutable and survive initiative deletion.
- Initiative deletion foreign-key paths now preserve financial history and null non-financial profile references.
- Hardened profile security fields against self-service privilege/ownership changes.
- Hardened organization security fields against organization-staff modification of verification, owner and platform financial counters.
- Admin/super_admin status permission triggers are aligned.
- `super_admin` now inherits `admin` permission checks through the central `has_role()` helper.
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
- Added explicit TanStack Start CSRF middleware for server functions. Server-function requests are now protected against cross-site invocation.
- Added a production guard so the mock payment provider throws instead of creating fake active subscriptions/payments in production.
- Added an additional production guard to the membership server function so unverified subscription state cannot be created from client-supplied data.

## CI finding fixed
The production-validation workflow previously failed at lint before build/E2E. The root route formatting issue was fixed in commit `6f81572c1d1cc4a836f085cb6bf734f48a9c6603` so a fresh CI run can validate lint/build/E2E. The Security Audit workflow also passes on the current CSRF-hardening commit.

## Critical production blocker: payment provider
The repository payment layer remains development-mock-backed until the real Peach Payments integration is connected. The mock provider is explicitly blocked in production, and production membership activation is fail-closed. The previous webhook handler contained placeholder signature verification and therefore cannot be used for real money.

The required real-money flow is defined as:
1. Server-side Peach credentials only.
2. Peach Hosted Checkout V2 for the initial customer-present payment.
3. Customer consent/tokenisation for recurring billing, using Peach's documented credential-on-file/standing-instruction flow.
4. HMAC webhook verification using Peach's webhook signing headers, raw request body, configured webhook URL and server-side secret.
5. Idempotency keyed by provider webhook ID and transaction/checkout identifiers.
6. Verify provider amount, currency, merchant transaction reference and final result before any membership activation or allocation.
7. Only after verified success: activate the subscription, allocate funds, write immutable financial events and issue the CommonGround receipt.
8. Handle duplicate, delayed, out-of-order, failed and uncertain webhook states safely.
9. Recurring charges must be executed server-side against the stored Peach registration token and reconciled before marking the monthly payment successful.
10. Sandbox end-to-end tests must cover success, failure, duplicate webhook, wrong amount, timeout, uncertain status, delayed webhook and recurring renewal.

Peach's current documentation recommends Hosted Checkout V2 for new integrations and documents HMAC-signed webhooks and recurring credential-on-file flows.

## Remaining external configuration required before real-money launch
These items require access to the CommonGround/Peach production account and cannot be safely fabricated in source control:
- Peach merchant/client credentials and entity/merchant IDs.
- Peach sandbox and production webhook configuration and webhook signing secret.
- Peach allowlisted CommonGround merchant domain/redirect URLs.
- Confirmation of recurring/tokenisation capability enabled for the CommonGround merchant account.
- Supabase Auth leaked-password protection setting enabled in the project dashboard.
- Production email/SMTP configuration and domain authentication.
- Final production secrets/environment bindings in the Cloudflare deployment.

## Non-blocking technical debt
- Supabase Performance Advisor has reported RLS init-plan and multiple-permissive-policy findings during the audit. Policy consolidation has been started, but remaining findings should be reduced only when the resulting access semantics are proven equivalent.
- Supabase reports unused indexes; they should not be removed solely from advisor output while the product is still evolving.
- Public-facing organization/profile reads should eventually use deliberately safe public views or explicit column exposure so private ownership/contact fields cannot be selected accidentally.

## Migration state
Production migration history was re-read during the audit. The latest observed production migration before the final hardening pass was `20260913110622 consolidate_reports_and_initiative_read_policies`. No migration repair was performed.

## Final readiness decision
**Database/application security work is substantially hardened and fail-closed for payments. Real-money launch remains intentionally blocked until the external Peach merchant configuration and verified provider integration are completed and sandbox-tested.**