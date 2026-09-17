# CommonGround Production Audit — 2026-09-18

## Scope
Database/RLS, RPC execution grants, financial integrity, initiative deletion, organization isolation, CRM/analytics exposure, storage, authentication posture, CSRF, CI/build readiness, development mock payment flow, migrations and performance.

## Completed hardening
- All 59 public tables retain RLS; the latest live audit found no public table without RLS.
- Removed client-side mutation paths for subscription state, payment records, financial ledger events and email queue.
- Financial events remain immutable and survive initiative deletion.
- Initiative deletion foreign-key paths preserve financial history and null non-financial profile references.
- Hardened profile security fields against self-service privilege/ownership changes.
- Hardened organization security fields against organization-staff modification of verification, owner and platform financial counters.
- Admin/super_admin status permission triggers are aligned.
- `super_admin` inherits `admin` permission checks through the central `has_role()` helper.
- Removed self-service role insertion policy.
- Removed public lead-update policy.
- Revoked client TRUNCATE privileges across public tables and removed direct client access to sensitive financial/audit tables.
- Added indexes for all remaining unindexed foreign keys; current FK coverage checks show no missing supporting indexes.
- Limited the `community-posts` storage bucket to JPEG/PNG/WebP images with a 5 MiB object limit.
- Tightened SECURITY DEFINER RPC execution grants for sensitive financial/admin functions.
- Hardened legacy SECURITY DEFINER search paths and made the static security audit recognize explicitly retired functions.
- Added explicit TanStack Start CSRF middleware for server functions.
- Added a production guard so the mock payment provider throws instead of creating fake active subscriptions/payments in production.
- Added a production guard to the membership server function so unverified subscription state cannot be created from client-supplied data.
- Enforced one active subscription per user with a partial unique index.
- Implemented pause/resume/cancel/update subscription lifecycle controls with pending next-cycle changes.
- Hardened community RLS so paused/cancelled members lose community access while administrators retain access and organizations remain scoped to their own content.
- Added deterministic cookie-consent state handling with Necessary and Analytics preferences and a pre-hydration visibility guard.

## Development mock payment flow
The development mock is structured as an end-to-end test harness rather than directly trusting browser-supplied subscription state:
1. Signup validates a minimum monthly amount of Rs 167.
2. The mock provider creates a development transaction identifier.
3. The account is created only after the mock checkout step.
4. After successful development signup, the authenticated session calls `dev_complete_mock_membership()`.
5. The function validates the authenticated user, amount, billing date and mock transaction prefix.
6. It creates the active monthly subscription, member initiative priorities, successful payment, immutable allocation ledger entries and a CommonGround mock receipt atomically.
7. A unique payment-provider identifier prevents duplicate mock payment processing.
8. Anonymous and service-role execution are denied.

### Current mock isolation limitation
The live `dev_complete_mock_membership()` function currently has `EXECUTE` granted to `authenticated`. The database does not have a reliable environment discriminator available to the current frontend RPC path, so the function cannot safely determine whether it is being called from a development build or the production application.

This is a **production launch blocker**, even though it is acceptable for the current development/test project. Before real users can access the production project, the mock RPC must be removed from the production database or moved behind a server-side environment gate that is unavailable to browser clients. A separate Supabase test project is the cleanest CI architecture; alternatively, a server-only Edge Function can own the mock flow with a server-side environment secret and the direct public RPC can be revoked.

The frontend already gates mock execution with `import.meta.env.DEV || VITE_ENABLE_MOCK_PAYMENTS === "true"`, but that frontend gate is not a database security boundary and must not be treated as one.

## CI status
- The latest Security Audit run available on `main` is run #240 at commit `25b19fb10ab6672f0916d399ce14cacac367f7ee`; it completed successfully.
- The latest available Production Validation run is run #244 at commit `3dc76dfd884cf13fce4c476271792344a4170e73`; it completed with failure in the `E2E — compliance and cookies` step. Build, lint, worker-output verification, admin E2E and auth E2E all completed successfully before that failure.
- No Production Validation run for the later `25b19fb...` cookie implementation was available in the current GitHub Actions history at audit time, so the latest main branch must not be described as fully green until a fresh validation run completes.
- The failed validation runs are historical evidence only; they do not by themselves prove that the current cookie implementation fails.

## Cookie/privacy implementation
- Cookie consent is stored under `cg_cookie_consent_v1` with `necessary=true` and an explicit analytics boolean.
- The banner supports Accept All, Reject Optional and Customize/Save Preferences.
- A footer entry can reopen preferences.
- The root document pre-hydration script hides the consent banner when stored consent already exists, preventing a visible flash on returning visitors.
- Repository searches at audit time found no `gtag`, Google Analytics or equivalent analytics implementation. Therefore the Analytics consent category currently governs future optional analytics rather than an active analytics script.
- Google Fonts remain a third-party network dependency and should be included in the final privacy/third-party review.

## Real Peach Payments
Real Peach Payments is intentionally deferred and is **not treated as a current system-test blocker**. Before real-money launch, the provider layer must be replaced with verified Peach Hosted Checkout V2, server-side credentials, signed webhook verification, idempotency, amount/currency/reference verification, recurring tokenisation and reconciliation.

## External configuration required before real-money launch
These items require access to the CommonGround/Peach/Supabase/Cloudflare production accounts and cannot be fabricated safely in source control:
- Peach merchant/client credentials and entity/merchant IDs.
- Peach sandbox and production webhook configuration and webhook signing secret.
- Peach allowlisted CommonGround merchant domain/redirect URLs.
- Confirmation of recurring/tokenisation capability enabled for the CommonGround merchant account.
- Supabase Auth leaked-password protection enabled in the project dashboard.
- Production email/SMTP configuration and domain authentication.
- Final production secrets/environment bindings in the Cloudflare deployment.
- Removal or server-side isolation of the development mock membership RPC from the production database.

## Non-blocking technical debt
- Supabase Performance Advisor may still report multiple-permissive-policy findings. Remaining policies should be consolidated only when resulting access semantics are proven equivalent.
- Supabase may report unused indexes; they should not be removed solely from advisor output while the product is still evolving.
- Public-facing organization/profile reads should eventually use deliberately safe public views or explicit column exposure so private ownership/contact fields cannot be selected accidentally.

## Data-integrity checks
The latest live checks found:
- `active_duplicate_users = 0`.
- `successful_payment_orphans = 13`.
- `receipt_orphans = 0`.
- `allocation_orphans = 0`.
- `financial_event_payment_orphans = 0`.

The 13 successful payment orphans are known historical **test/legacy records**. CommonGround has not processed real money. They have no Peach payment ID, no linked subscription and remain `reconciliation_status = pending`; they must not be treated as real-money transactions.

## Migration state
Production migration history was re-read during the audit. No migration repair was performed during this documentation refresh.

## Readiness summary
### System testing
The database/security foundation, membership lifecycle, initiative deletion, community access controls, cookie-consent implementation and development mock membership lifecycle are substantially implemented for continued testing.

### Real-money launch
Real-money launch remains blocked until the Peach integration and external account configuration are completed **and** the development mock membership RPC is removed from production or isolated behind a server-only environment control.
