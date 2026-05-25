# Initiative Landing + Attribution System Summary

## Work Summary

### Files Changed / Created
- **Created** `src/lib/slugify.ts`: Centralized slugification and collision handling logic.
- **Created** `src/routes/initiatives/$slug.tsx`: New dedicated landing page for initiatives with session-aware tracking and attribution persistence.
- **Updated** `src/routes/initiatives/$id.tsx`: Redirects legacy ID-based URLs to new slug-based URLs.
- **Updated** `src/routes/signup.tsx`: Implemented payment-driven attribution funnel and lead lifecycle management.
- **Updated** `src/lib/auth-actions.ts`: Updated lead actions to support new statuses ('started', 'converted').
- **Updated** `src/lib/payments/subscription-engine.ts`: Added supporter status tracking (activated/deactivated) attributed to initiatives.
- **Updated** `src/routes/_authenticated/organization.tsx`: Added Initiative Performance analytics to the Organization Dashboard.
- **Updated** `src/routes/_authenticated/admin-dashboard.leads.tsx`: Updated CRM visibility for admins with new lead statuses.
- **Updated** `src/routes/index.tsx`, `src/routes/initiatives/index.tsx`, `src/routes/entities.$id.tsx`: Updated links to use slug-based routes.
- **Updated** `src/routeTree.gen.ts`: Manually patched for the new slug route.
- **Migration** `20260525000012_initiative_attribution_system.sql`: Base schema for slug and attribution.
- **Migration** `20260525000014_expand_initiative_analytics.sql`: Expanded analytics for supporter tracking and leads lifecycle.

### Attribution & Lead Flow
1. **Visitor Landing**: Visitor hits `/initiatives/:slug`. `page_view` event recorded (session-deduplicated). `source_initiative_id` stored in `localStorage`.
2. **Lead Creation**: Visitor clicks "Support" and enters details. Lead created with status `started`.
3. **Payment Completion**: Visitor completes mock/real payment. Lead updated to `converted`.
4. **Member Acquisition**: Visitor sets password/completes onboarding.
   - `member_acquired` event recorded.
   - Profile updated with `source_initiative_id` and `primary_initiative_id`.
   - Initiative added to `member_preferences`.
   - Attribution cleared from `localStorage`.

### Analytics Definitions
- **view_count**: Total initiative page views.
- **conversion_count**: Total historical members acquired through this initiative.
- **active_supporter_count**: Current members with active subscriptions.
- **inactive_supporter_count**: Former members (cancelled, past due).
- **Conversion Rate**: Members Acquired ÷ Views × 100.

### Dashboard Visibility Rules
- **Organizations**: Can see aggregate Performance metrics (Views, Acquired, Active, Conversion Rate). Cannot see individual lead data.
- **Admins**: Full CRM visibility. Can manage all leads, track their lifecycle (started, converted, abandoned, inactive), and run follow-up campaigns.

## Dictionary

- **source_initiative_id**: The UUID of the initiative through which a user first arrived at the platform.
- **primary_initiative_id**: The user's main initiative, used for financial fallback and status attribution.
- **member_acquired**: Event triggered when a user successfully completes the payment and onboarding flow.
- **supporter_activated/deactivated**: Events triggered by subscription status changes (resumes/cancellations).
- **slug**: URL-friendly version of the initiative title.
