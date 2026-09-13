# CommonGround Production Audit — 2026-09-13

## Scope
Database/RLS, RPC execution grants, financial integrity, initiative deletion, organization isolation, CRM/analytics exposure, storage, authentication posture, CI/build readiness, payment architecture, migrations and performance.

## Completed hardening
- All public tables retain RLS; no public table was found without RLS during the audit.
- Removed client-side mutation paths for subscription state, payment records, financial ledger events and email queue.
- Financial events remain immutable and survive initiative deletion.
- Initiative deletion foreign-key paths now preserve financial history and null non-financial profile references.
- Hardened profile security fields against self-service privilege/ownership changes.
- Hardened organization security fields against organization-staff modification of verification, owner and platform financial counters.
- Admin/super_admin status permission triggers are aligned.
- Removed self-service role insertion policy.
- Removed public lead-update policy.
- Tightened initiative update visibility to authenticated members/organization staff/admins.
- Revoked client TRUNCATE privileges across public tables and removed direct client access to sensitive financial/audit tables.
- Added indexes for all remaining unindexed foreign keys; current FK coverage query returns zero missing supporting indexes.
- Limited `community-posts` storage bucket to JPEG/PNG/WebP images with a 5 MiB object limit.
- Tightened SECURITY DEFINER RPC execution grants; sensitive financial/admin RPCs are no longer callable by anon/authenticated roles.
- Added a production guard so the mock payment provider throws instead of creating fake active subscriptions/payments in production.

## CI finding fixed
The production-validation workflow previously failed at lint before build/E2E. The root route formatting issue was fixed in commit `6f81572c1d1cc4a836f085cb6bf734f48a9c6603` so a fresh CI run can validate lint/build/E2E.

## Critical production blocker: payment provider
The repository payment layer is still backed by a mock provider for development. The mock provider is now explicitly blocked in production, which prevents fake payment/subscription activation. The webhook handler also contains placeholder signature verification. Therefore CommonGround must NOT accept real money until the real Peach Payments integration is connected and verified.

Required before accepting real money:
1. Real Peach payment initiation/server-side credentials.
2. Provider signature verification using the provider's documented mechanism, with secrets kept server-side.
3. Idempotent webhook processing keyed by provider event/transaction ID.
4. Verify provider amount/currency/order/subscription identifiers before marking a payment successful.
5. Only after verified success: create/activate subscription, allocate funds, write immutable financial events and issue receipt.
6. Failed/duplicate/out-of-order webhook handling and reconciliation/retry jobs.
7. End-to-end sandbox tests covering success, failure, duplicate webhook, wrong amount, timeout, and delayed webhook.

## Remaining non-blocking technical debt
- Supabase Performance Advisor still reports 40 RLS init-plan warnings and 119 multiple-permissive-policy findings. These are primarily policy consolidation/performance work, not evidence that RLS is disabled. They should be consolidated in a controlled pass rather than deleting policies blindly.
- Supabase reports 84 unused indexes; they should not be removed solely from advisor output while the product is still evolving.
- Supabase Auth reports leaked-password protection disabled. Enable it in Authentication settings; Supabase documents this as an Auth dashboard setting.
- Public/anonymous SECURITY DEFINER RPC warnings remain for intentionally public RPCs such as trending initiatives and partner application submission; these should be reviewed and, where possible, moved behind invoker/private server routes.
- Organization/profile tables expose broad row-level SELECT policies; RLS controls rows, not columns. Public-facing organization/profile reads should eventually use a deliberately safe public view or explicit column-level exposure so private contact/ownership fields cannot be selected accidentally.

## Migration state
Production migration history was re-read on 2026-09-13. Latest observed migration is `20260913110622 consolidate_reports_and_initiative_read_policies`. The current production history contains the initiative deletion fixes, security hardening and performance index migrations. No migration repair was performed.

## Final readiness decision
**NOT READY FOR REAL PAYMENTS YET.** Database security and integrity have been materially hardened, and CI/security checks have been addressed, but the real Peach Payments/webhook implementation is still required before launch.
