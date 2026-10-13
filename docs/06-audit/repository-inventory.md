# Repository Inventory

**Audit date:** 2026-10-13. **Source:** GitHub recursive tree of `main`; no code was executed and no live database was queried.

## Snapshot

- Route modules: 48
- SQL migration files: 274
- Test files under `tests/`: 13
- Most recent migration path in lexical order: `supabase/migrations/20261008202215_remove_duplicate_signup_trigger_and_store_phone.sql`

These counts are source-tree metadata, not test coverage or live schema state. Migration names include older 8-digit/mixed timestamp formats as well as newer 14-digit names. Never rename/delete already-applied migrations just to normalize naming; compare migration history read-only first.

## Route modules

- `src/routes/__root.tsx`
- `src/routes/_authenticated.tsx`
- `src/routes/_authenticated/admin-dashboard.analytics.tsx`
- `src/routes/_authenticated/admin-dashboard.announcements.tsx`
- `src/routes/_authenticated/admin-dashboard.community-posts.tsx`
- `src/routes/_authenticated/admin-dashboard.finances.tsx`
- `src/routes/_authenticated/admin-dashboard.homepage-layout.tsx`
- `src/routes/_authenticated/admin-dashboard.index.tsx`
- `src/routes/_authenticated/admin-dashboard.initiatives.$id.manage.tsx`
- `src/routes/_authenticated/admin-dashboard.initiatives.index.tsx`
- `src/routes/_authenticated/admin-dashboard.initiatives.new.tsx`
- `src/routes/_authenticated/admin-dashboard.leads.tsx`
- `src/routes/_authenticated/admin-dashboard.members.$id.tsx`
- `src/routes/_authenticated/admin-dashboard.members.tsx`
- `src/routes/_authenticated/admin-dashboard.organizations.tsx`
- `src/routes/_authenticated/admin-dashboard.partner-applications.tsx`
- `src/routes/_authenticated/admin-dashboard.profile.tsx`
- `src/routes/_authenticated/admin-dashboard.reports.tsx`
- `src/routes/_authenticated/admin-dashboard.settings.tsx`
- `src/routes/_authenticated/admin-dashboard.tsx`
- `src/routes/_authenticated/admin-dashboard.verify-payments.tsx`
- `src/routes/_authenticated/community-hub.$postId.tsx`
- `src/routes/_authenticated/community-hub.index.tsx`
- `src/routes/_authenticated/dashboard.tsx`
- `src/routes/_authenticated/member.profile.tsx`
- `src/routes/_authenticated/member.settings.tsx`
- `src/routes/_authenticated/member.tsx`
- `src/routes/_authenticated/organization.tsx`
- `src/routes/about.tsx`
- `src/routes/cookies-policy.tsx`
- `src/routes/entities/$id.tsx`
- `src/routes/entities/index.tsx`
- `src/routes/faq.tsx`
- `src/routes/for-orgs.tsx`
- `src/routes/forgot-password.tsx`
- `src/routes/index.tsx`
- `src/routes/initiatives/$slug.tsx`
- `src/routes/initiatives/index.tsx`
- `src/routes/legal.tsx`
- `src/routes/login.tsx`
- `src/routes/notifications.tsx`
- `src/routes/organizations/index.tsx`
- `src/routes/partner.tsx`
- `src/routes/privacy-policy.tsx`
- `src/routes/refund-policy.tsx`
- `src/routes/reset-password.tsx`
- `src/routes/signup.tsx`
- `src/routes/terms-and-conditions.tsx`

## Test files

- `tests/admin.spec.ts`
- `tests/auth.spec.ts`
- `tests/compliance-cookie-consent.spec.ts`
- `tests/e2e-signup-journey.spec.ts`
- `tests/financial-trace.spec.ts`
- `tests/growth/analytics.spec.ts`
- `tests/growth/growth-foundation.spec.ts`
- `tests/growth/notifications.spec.ts`
- `tests/member-checkpoint.spec.ts`
- `tests/member.spec.ts`
- `tests/partner-security.spec.ts`
- `tests/smoke.spec.ts`
- `tests/system.spec.ts`

## Recent migration files

- `supabase/migrations/20261001230414_restore_rls_helper_execute_permissions.sql`
- `supabase/migrations/20261001230426_harden_crm_tag_org_helper.sql`
- `supabase/migrations/20261001230518_harden_community_storage_paths.sql`
- `supabase/migrations/20261001231037_harden_analytics_event_boundaries.sql`
- `supabase/migrations/20261002143908_harden_public_lead_attribution.sql`
- `supabase/migrations/20261002143931_harden_public_campaign_link_visibility.sql`
- `supabase/migrations/20261002144058_harden_lead_status_trigger.sql`
- `supabase/migrations/20261002144303_harden_daily_stats_aggregator.sql`
- `supabase/migrations/20261002220014_harden_profile_lead_triggers.sql`
- `supabase/migrations/20261006070110_harden_profile_creation_attribution.sql`
- `supabase/migrations/20261006070551_align_initiative_event_metric_names.sql`
- `supabase/migrations/20261006070928_normalize_legacy_initiative_view_events.sql`
- `supabase/migrations/20261006125332_tighten_public_organization_and_initiative_visibility.sql`
- `supabase/migrations/20261007060316_public_homepage_impact_stats.sql`
- `supabase/migrations/20261007061208_clean_published_homepage_cms_configuration.sql`
- `supabase/migrations/20261007062343_add_public_homepage_payload.sql`
- `supabase/migrations/20261008094000_harden_security_audit_findings.sql`
- `supabase/migrations/20261008200000_fix_user_signup_activity_trigger.sql`
- `supabase/migrations/20261008200025_diagnose_signup_payment_metadata.sql`
- `supabase/migrations/20261008202215_remove_duplicate_signup_trigger_and_store_phone.sql`

## Next verification

1. Derive browser URLs from TanStack route metadata, not filenames alone.
2. Inspect each route's loader, queries, guards and mutations.
3. Inventory RPCs, server handlers, provider boundaries, RLS policies and CI test coverage.
4. Check migration timestamp format, duplicates and local/remote parity using read-only inspection.