# Initiative Landing + Attribution System Summary

## Work Summary

### Files Changed / Created
- **Created** `src/lib/slugify.ts`: Centralized slugification and collision handling logic.
- **Created** `src/routes/initiatives/$slug.tsx`: New dedicated landing page for initiatives with session-aware tracking (30-min deduplication) and 30-day attribution persistence.
- **Created** `src/routes/_authenticated/admin-dashboard.analytics.tsx`: Admin audit tool for events and counter reconciliation.
- **Updated** `src/routes/initiatives/$id.tsx`: Redirects legacy ID-based URLs to new slug-based URLs.
- **Updated** `src/routes/signup.tsx`: Implemented payment-driven attribution funnel and lead lifecycle management (started -> converted).
- **Updated** `src/lib/auth-actions.ts`: Updated lead actions to support new lifecycle statuses.
- **Updated** `src/lib/payments/subscription-engine.ts`: Hardened with idempotency checks and supporter status tracking (activated/deactivated).
- **Updated** `src/routes/_authenticated/organization.tsx`: Added Initiative Performance analytics to the Organization Dashboard (isolation from lead data).
- **Updated** `src/routes/_authenticated/admin-dashboard.leads.tsx`: Updated CRM visibility for admins with lifecycle tracking.
- **Updated** `src/routeTree.gen.ts`: Manually patched for new routes.
- **Migrations**:
  - `20260525000012`: Base attribution schema.
  - `20260525000014`: Supporter tracking and leads lifecycle.
  - `20260525000016`: Operational hardening (reconciliation function, unique constraints, and conversion timestamps).

### Attribution & Lead Flow
1. **Visitor Landing**: Visitor hits `/initiatives/:slug`. `page_view` event recorded (session-deduplicated). `source_initiative_id` stored in `localStorage` (30-day window).
2. **Lead Creation**: Visitor clicks "Support" and enters details. Lead created with status `started` and `first_seen_at`.
3. **Payment Completion**: Visitor completes payment. Lead updated to `converted` and `converted_at` set.
4. **Member Acquisition**: Visitor completes onboarding.
   - `member_acquired` event recorded (Unique per User+Initiative).
   - Profile updated with attribution.
   - Database trigger increments `conversion_count` and `active_supporter_count`.
   - Attribution cleared.

### Analytics & Retention
- **view_count**: Deduplicated page views.
- **conversion_count**: Total historical members acquired (Never decreases).
- **active_supporter_count**: Members with current active subscriptions.
- **inactive_supporter_count**: Former members (cancelled, past due).
- **Reconciliation**: Admins can trigger ground-truth reconciliation via RPC if counters drift.

### Idempotency & Scaling
- **Webhook Safety**: `SubscriptionEngine` checks transaction IDs and event history window to prevent duplicate counts.
- **Unique Constraints**: Database enforces one member acquisition event per user per initiative.
- **Materialized Counters**: Counters are stored on initiatives to avoid real-time aggregation costs, maintained by triggers.

## Dictionary

- **source_initiative_id**: Visitor's entry point UUID.
- **primary_initiative_id**: Authoritative initiative for user money-flow and attribution.
- **member_acquired**: High-quality conversion event triggered after successful payment.
- **started / converted / abandoned / inactive**: Lead lifecycle stages for CRM tracking.
- **reconcile_initiative_analytics**: Function to rebuild counters from the event ledger.
