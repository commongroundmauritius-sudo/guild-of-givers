# CommonGround Codebase Dictionary

**Repository:** `commongroundmauritius-sudo/guild-of-givers`  
**Reference branch:** `production-readiness-finalization`  
**Generated:** 2026-09-27  

## Purpose

This is the working dictionary for the whole repository. It is intended to answer, for any file or subsystem: **what is it, why does it exist, who uses it, what does it affect, and what should be checked before changing it?**

This is deliberately both documentation and an audit map. Entries marked **AUDIT** are places where documentation or code review should continue; they are not automatically confirmed bugs.

## System at a glance

CommonGround is a TanStack Start/React application backed by Supabase/Postgres. The browser-facing application is organised into routes and reusable components; business logic is concentrated under `src/lib`; Supabase migrations define the database/security layer; GitHub Actions validates builds/security/E2E; Cloudflare Worker packaging is handled by `scripts/build-worker.js`.

### Core business flow

```
Visitor
  -> public route
  -> initiative / campaign attribution
  -> signup
  -> mock payment confirmation (current provider)
  -> account/member creation
  -> subscription state
  -> successful payment event
  -> allocation RPC
  -> initiative / Impact Pool allocation
  -> supporter/member events
  -> reports / community / CRM / automation
```

### Major boundaries

| Boundary | Primary location | Responsibility |
|---|---|---|
| UI/routes | `src/routes` | Pages, forms, route-level user workflows |
| Reusable UI | `src/components` | Shared presentation and interaction |
| Client state/auth | `src/hooks` | Auth/session and reusable React state |
| Business services | `src/lib` | Domain rules and orchestration |
| Payments | `src/lib/payments` | Provider abstraction, subscription events, allocation |
| Database | `supabase/migrations` | Tables, RLS, RPCs, triggers, indexes |
| External integrations | `src/integrations` | Supabase and other external boundaries |
| Build/runtime | `vite.config.ts`, `src/server.ts`, `src/start.ts`, `scripts/build-worker.js` | Web build and Cloudflare runtime |
| CI/security | `.github/workflows`, `scripts/security-audit.mjs` | Automated validation |
| E2E | `tests/` | Browser/system regression coverage |

## Critical files to know first

| File | What it does | Change risk |
|---|---|---|
| `src/routes/signup.tsx` | Main member signup/payment journey; coordinates attribution, payment confirmation and account setup | **High** |
| `src/lib/payments/service.ts` | Public payment service facade over the configured provider | **High** |
| `src/lib/payments/subscription-engine.ts` | Converts payment events into DB state, allocation and supporter events | **Critical** |
| `src/lib/payments/webhook-handler.ts` | Receives/logs/parses payment webhooks and invokes subscription engine | **Critical** |
| `src/lib/payments/providers/mock-provider.ts` | Current mock payment provider used for present workflow testing | **High** |
| `src/lib/auth-actions.ts` | Server-side authentication/membership actions | **Critical** |
| `src/integrations/supabase/client.ts` | Browser Supabase client boundary | **Critical** |
| `src/integrations/supabase/types.ts` | Generated/maintained DB type model used by application code | **High** |
| `supabase/migrations/*` | Authoritative database evolution, RLS, functions and triggers | **Critical** |
| `.github/workflows/production-validation.yml` | Production build/runtime/browser validation | **High** |
| `.github/workflows/security-audit.yml` | Automated security/RLS checks | **High** |
| `scripts/build-worker.js` | Builds/normalises the Cloudflare Worker artifact | **High** |

## Business-domain dictionary

### Authentication and identity

- **Profile**: application-level user/member identity stored in the database and linked to Supabase Auth.
- **Role**: application authorization category such as member, organization, admin or super_admin.
- **Member**: a user whose subscription/payment flow has successfully established membership.
- **Organization**: partner cause/NGO account and tenant boundary.
- **Partner application**: pre-account application submitted by a prospective organization.

### Subscription and money

- **Payment**: a financial transaction record representing an attempted/successful/failed payment.
- **Payment event**: provider event recorded for audit and processed into application state.
- **Subscription**: recurring membership billing state.
- **Provider**: implementation of the payment-provider interface. The current provider is mock; Peach is a future replacement at this boundary.
- **Allocation**: business calculation/RPC that distributes the eligible payment amount to CommonGround and cause priorities.
- **Priority**: ordered initiative preference selected by a member.
- **Overflow**: amount that cannot be assigned to a capped priority and therefore moves to the next eligible priority, ultimately the Impact Pool.
- **Impact Pool**: CommonGround-controlled allocation destination for the platform's future community-hub purpose.

### Growth and attribution

- **Lead**: pre-member prospect tracked for acquisition/conversion.
- **Campaign**: named acquisition initiative.
- **Campaign link**: shareable/trackable link associated with a campaign/initiative.
- **Attribution**: persistence of the initiative/campaign source across the visitor-to-signup journey.
- **Activity**: recorded user/system event used by CRM, analytics and automation.

### Community and reporting

- **Community**: authenticated member discussion/social layer.
- **Report**: impact/update information presented according to membership/organization permissions.
- **Moderation**: admin/moderator control over community content.

## Payment architecture dictionary

### Current path

1. `signup.tsx` gathers the member's intended amount and priorities.
2. `paymentService.startPayment()` calls the provider abstraction.
3. The current provider is `mock-provider.ts`.
4. After successful mock confirmation, signup proceeds with the membership/account workflow.
5. Payment/subscription events are handled by `subscription-engine.ts`.
6. Successful payment calls the database allocation RPC.
7. Payment records and subscription state are updated.
8. Supporter/member acquisition events are recorded and may trigger automation.

### Future Peach boundary

Peach should replace the provider-specific implementation, not the allocation/subscription domain rules. Provider-specific concerns belong behind the payment interface: checkout/session creation, recurring subscription identifiers, webhook signature verification, event mapping, retries and provider metadata.

## Database dictionary

The `supabase/migrations` directory is a chronological change log. **Do not edit an old migration to change live behaviour.** Add a new migration that moves the schema/security state forward.

Typical migration responsibilities found in this repository include:

- user/profile/signup triggers
- roles and role security
- organizations and organization team members
- initiatives and slugs
- member priorities
- payments and subscriptions
- payment events and allocation RPCs
- reports and report visibility
- initiative attribution and analytics
- CRM/leads/campaigns/activities
- automation and lifecycle triggers
- partner applications
- homepage management/versioning
- community posts/comments/moderation
- RLS/security hardening

## CI/runtime dictionary

- `production-validation.yml`: the final confidence gate. It should build the production artifact, validate the Worker/runtime and run browser checks.
- `security-audit.yml`: checks database/security invariants such as RLS coverage, unsafe grants and SECURITY DEFINER configuration.
- `ci-format.yml`: formatting validation.
- `infrastructure-guard.yml`: protects infrastructure assumptions.
- `refresh-lockfile.yml`: dependency-lock maintenance.
- `scripts/build-worker.js`: converts the application build into the expected Worker artifact and handles build/runtime compatibility issues.
- `wrangler.json`: Cloudflare Worker deployment configuration.
- `vite.config.ts`: Vite/TanStack build configuration.
- `playwright.config.ts`: E2E test configuration.

## Test dictionary

| Test area | Main files | What it protects |
|---|---|---|
| Smoke/system | `tests/smoke.spec.ts`, `tests/system.spec.ts` | Basic application availability |
| Auth | `tests/auth.spec.ts` | Login/signup/auth behaviour |
| Member | `tests/member.spec.ts`, `tests/member-checkpoint.spec.ts` | Member access/workflows |
| Signup | `tests/e2e-signup-journey.spec.ts` | Signup/payment/account sequence |
| Financial | `tests/financial-trace.spec.ts` | Financial path assumptions |
| Partner security | `tests/partner-security.spec.ts` | Organization/partner isolation |
| Compliance | `tests/compliance-cookie-consent.spec.ts` | Consent/privacy behaviour |
| Admin | `tests/admin.spec.ts` | Administrative flows |
| Growth | `tests/growth/*` | Analytics, notifications and growth foundation |

## File inventory

The following appendix is generated from the repository tree so that new files can be found quickly. The description is a first-pass classification; the **source code remains authoritative**.

| Path | Purpose |
|---|---|
| `.github/CODEOWNERS` | Project configuration or supporting source |
| `.github/workflows/ci-format.yml` | CI/CD automation |
| `.github/workflows/infrastructure-guard.yml` | CI/CD automation |
| `.github/workflows/production-validation.yml` | CI/CD automation |
| `.github/workflows/refresh-lockfile.yml` | CI/CD automation |
| `.github/workflows/security-audit.yml` | CI/CD automation |
| `.gitignore` | Project configuration or supporting source |
| `.Jules/palette.md` | Project documentation/report |
| `.lovable/plan.md` | Project documentation/report |
| `.lovable/project.json` | Project configuration or supporting source |
| `.prettierignore` | Project configuration or supporting source |
| `.prettierrc` | Project configuration or supporting source |
| `admin_initiative_report.md` | Project documentation/report |
| `AGENTS.md` | Project documentation/report |
| `bun.lock` | Dependency lockfile — review package-manager ownership |
| `CLEANUP_SUMMARY.md` | Project documentation/report |
| `components.json` | Project configuration or supporting source |
| `DEPLOYMENT_READINESS_REPORT.md` | Project documentation/report |
| `docs/AUDITS.md` | Project documentation |
| `docs/KNOWN_ISSUES.md` | Project documentation |
| `docs/MIGRATIONS.md` | Project documentation |
| `docs/PHASE_9_INTELLIGENCE.md` | Project documentation |
| `docs/PRODUCTION_READINESS_STATUS_2026-09-11.md` | Project documentation |
| `e2e-verification-summary.md` | Project documentation/report |
| `eslint.config.js` | Project configuration or supporting source |
| `faq_component.txt` | Project configuration or supporting source |
| `FINANCIAL_ARCHITECTURE_AUDIT.md` | Project documentation/report |
| `FINANCIAL_AUDIT.md` | Project documentation/report |
| `GAP_ANALYSIS.md` | Project documentation/report |
| `GROWTH_FOUNDATION.md` | Project documentation/report |
| `header_fix.txt` | Project configuration or supporting source |
| `INFRASTRUCTURE_AUDIT.md` | Project documentation/report |
| `INITIATIVE_ATTRIBUTION_SUMMARY.md` | Project documentation/report |
| `jules_session_1606758737968957230/src/routes/_authenticated/admin-dashboard.index.tsx` | Historical/session artifact — review for removal |
| `jules_session_1606758737968957230/supabase/migrations/20260904000000_admin_super_admin_community_moderation.sql` | Historical/session artifact — review for removal |
| `lovable.toml` | Project configuration or supporting source |
| `MASTER_AUDIT_REPORT.md` | Project documentation/report |
| `OWNERSHIP_MIGRATION_REPORT.md` | Project documentation/report |
| `OWNERSHIP_MODEL.md` | Project documentation/report |
| `package-lock.json` | Dependency lockfile — review package-manager ownership |
| `package.json` | Project configuration or supporting source |
| `PARTNER_SYSTEM_DOCUMENTATION.md` | Project documentation/report |
| `PHASE_10_DOCUMENTATION.md` | Project documentation/report |
| `playwright.config.ts` | Project configuration or supporting source |
| `pnpm-lock.yaml` | Dependency lockfile — review package-manager ownership |
| `POST_REFACTOR_VALIDATION.md` | Project documentation/report |
| `PR_DESCRIPTION.md` | Project documentation/report |
| `PRODUCTION_READINESS_REPORT.md` | Project documentation/report |
| `PRODUCTION_READINESS_STATUS.md` | Project documentation/report |
| `PRODUCTION_VALIDATION_FINAL.md` | Project documentation/report |
| `production-validation.md` | Project documentation/report |
| `public/_headers` | Project configuration or supporting source |
| `README.md` | Project documentation/report |
| `SCHEMA_RECONCILIATION_REPORT.md` | Project documentation/report |
| `scripts/build-worker.js` | Build, deployment, or security automation |
| `scripts/security-audit.mjs` | Build, deployment, or security automation |
| `SECURITY_AUDIT_REPORT.md` | Project documentation/report |
| `SECURITY_AUDIT.md` | Project documentation/report |
| `src/assets/hero-room.jpg` | Bundled application asset |
| `src/assets/logo.png` | Bundled application asset |
| `src/assets/orgs-boardroom.jpg` | Bundled application asset |
| `src/components/community/AnnouncementCard.tsx` | Reusable UI component |
| `src/components/community/CommentSection.tsx` | Reusable UI component |
| `src/components/community/CommunitySidebar.tsx` | Reusable UI component |
| `src/components/community/CreatePostForm.tsx` | Reusable UI component |
| `src/components/community/PostActions.tsx` | Reusable UI component |
| `src/components/community/PostCard.tsx` | Reusable UI component |
| `src/components/community/ReactionButtons.tsx` | Reusable UI component |
| `src/components/dashboard/campaigns/CampaignLinkManager.tsx` | Reusable UI component |
| `src/components/dashboard/modules/acquisition/components/AcquisitionModule.tsx` | Reusable UI component |
| `src/components/dashboard/modules/acquisition/components/SupporterJourney.tsx` | Reusable UI component |
| `src/components/dashboard/modules/acquisition/hooks/use-acquisition-metrics.ts` | Reusable UI component |
| `src/components/dashboard/modules/crm/components/CrmModule.tsx` | Reusable UI component |
| `src/components/dashboard/modules/crm/components/EngagementBadge.tsx` | Reusable UI component |
| `src/components/dashboard/modules/crm/components/SegmentationView.tsx` | Reusable UI component |
| `src/components/dashboard/modules/crm/components/SupporterIntelligence.tsx` | Reusable UI component |
| `src/components/dashboard/modules/crm/components/SupporterProfile.tsx` | Reusable UI component |
| `src/components/dashboard/modules/crm/components/SupporterTimeline.tsx` | Reusable UI component |
| `src/components/dashboard/modules/crm/components/TaskModule.tsx` | Reusable UI component |
| `src/components/dashboard/modules/crm/hooks/use-crm-summary.ts` | Reusable UI component |
| `src/components/dashboard/modules/engagement/components/EngagementModule.tsx` | Reusable UI component |
| `src/components/dashboard/modules/engagement/hooks/use-engagement-metrics.ts` | Reusable UI component |
| `src/components/dashboard/modules/financial/components/FinancialModule.tsx` | Reusable UI component |
| `src/components/dashboard/modules/financial/components/FinancialTraceTable.tsx` | Reusable UI component |
| `src/components/dashboard/modules/financial/hooks/use-financial-metrics.ts` | Reusable UI component |
| `src/components/dashboard/modules/financial/hooks/use-financial-trace.ts` | Reusable UI component |
| `src/components/dashboard/modules/homepage/components/FAQPanel.tsx` | Reusable UI component |
| `src/components/dashboard/modules/homepage/components/FeaturedInitiativesPanel.tsx` | Reusable UI component |
| `src/components/dashboard/modules/homepage/components/HeroPanel.tsx` | Reusable UI component |
| `src/components/dashboard/modules/homepage/components/ImpactMetricsPanel.tsx` | Reusable UI component |
| `src/components/dashboard/modules/homepage/components/SectionItem.tsx` | Reusable UI component |
| `src/components/dashboard/modules/homepage/components/SuccessStoriesManager.tsx` | Reusable UI component |
| `src/components/dashboard/modules/homepage/components/TrendingProgramsPanel.tsx` | Reusable UI component |
| `src/components/dashboard/modules/homepage/components/UrgentNeedsPanel.tsx` | Reusable UI component |
| `src/components/dashboard/modules/homepage/components/VolunteerOpportunitiesPanel.tsx` | Reusable UI component |
| `src/components/dashboard/modules/homepage/HomepagePreview.tsx` | Reusable UI component |
| `src/components/dashboard/modules/impact/components/ImpactModule.tsx` | Reusable UI component |
| `src/components/dashboard/modules/impact/components/InitiativeHealth.tsx` | Reusable UI component |
| `src/components/dashboard/modules/impact/hooks/use-impact-metrics.ts` | Reusable UI component |
| `src/components/dashboard/modules/moderation/components/ModerationModule.tsx` | Reusable UI component |
| `src/components/dashboard/modules/moderation/hooks/use-moderation-alerts.ts` | Reusable UI component |
| `src/components/dashboard/modules/moderation/hooks/use-moderation-analytics.ts` | Reusable UI component |
| `src/components/InitiativeCard.tsx` | Reusable UI component |
| `src/components/Kicker.tsx` | Reusable UI component |
| `src/components/member/AllocationPreview.tsx` | Reusable UI component |
| `src/components/notifications/NotificationBell.tsx` | Reusable UI component |
| `src/components/organization/TeamManager.tsx` | Reusable UI component |
| `src/components/site/CookieConsentBanner.tsx` | Reusable UI component |
| `src/components/site/Footer.tsx` | Reusable UI component |
| `src/components/site/Header.tsx` | Reusable UI component |
| `src/components/site/Logo.tsx` | Reusable UI component |
| `src/components/site/SiteLayout.tsx` | Reusable UI component |
| `src/components/ui/accordion.tsx` | Reusable UI component |
| `src/components/ui/alert-dialog.tsx` | Reusable UI component |
| `src/components/ui/avatar.tsx` | Reusable UI component |
| `src/components/ui/badge.tsx` | Reusable UI component |
| `src/components/ui/button.tsx` | Reusable UI component |
| `src/components/ui/calendar.tsx` | Reusable UI component |
| `src/components/ui/card.tsx` | Reusable UI component |
| `src/components/ui/carousel.tsx` | Reusable UI component |
| `src/components/ui/command.tsx` | Reusable UI component |
| `src/components/ui/dialog.tsx` | Reusable UI component |
| `src/components/ui/dropdown-menu.tsx` | Reusable UI component |
| `src/components/ui/form.tsx` | Reusable UI component |
| `src/components/ui/input.tsx` | Reusable UI component |
| `src/components/ui/label.tsx` | Reusable UI component |
| `src/components/ui/pagination.tsx` | Reusable UI component |
| `src/components/ui/progress.tsx` | Reusable UI component |
| `src/components/ui/select.tsx` | Reusable UI component |
| `src/components/ui/separator.tsx` | Reusable UI component |
| `src/components/ui/sheet.tsx` | Reusable UI component |
| `src/components/ui/sidebar.tsx` | Reusable UI component |
| `src/components/ui/skeleton.tsx` | Reusable UI component |
| `src/components/ui/sonner.tsx` | Reusable UI component |
| `src/components/ui/switch.tsx` | Reusable UI component |
| `src/components/ui/table.tsx` | Reusable UI component |
| `src/components/ui/tabs.tsx` | Reusable UI component |
| `src/components/ui/textarea.tsx` | Reusable UI component |
| `src/components/ui/toggle-group.tsx` | Reusable UI component |
| `src/components/ui/toggle.tsx` | Reusable UI component |
| `src/components/ui/tooltip.tsx` | Reusable UI component |
| `src/hooks/activities/use-activity-tracker.ts` | Reusable React hook / client state access |
| `src/hooks/crm/use-segments.ts` | Reusable React hook / client state access |
| `src/hooks/crm/use-supporter-profile.ts` | Reusable React hook / client state access |
| `src/hooks/initiatives/use-curated-initiatives.ts` | Reusable React hook / client state access |
| `src/hooks/intelligence/use-initiative-health.ts` | Reusable React hook / client state access |
| `src/hooks/intelligence/use-retention.ts` | Reusable React hook / client state access |
| `src/hooks/use-allocation-simulation.tsx` | Reusable React hook / client state access |
| `src/hooks/use-auth.tsx` | Reusable React hook / client state access |
| `src/hooks/use-community.tsx` | Reusable React hook / client state access |
| `src/hooks/use-cookie-consent.ts` | Reusable React hook / client state access |
| `src/hooks/use-homepage-analytics.ts` | Reusable React hook / client state access |
| `src/hooks/use-homepage.ts` | Reusable React hook / client state access |
| `src/hooks/use-member-check.ts` | Reusable React hook / client state access |
| `src/hooks/use-mobile.tsx` | Reusable React hook / client state access |
| `src/hooks/use-realtime-sync.tsx` | Reusable React hook / client state access |
| `src/integrations/supabase/auth-attacher.ts` | External/service integration boundary |
| `src/integrations/supabase/client.ts` | External/service integration boundary |
| `src/integrations/supabase/types.ts` | External/service integration boundary |
| `src/lib/activities/activity-service.ts` | Activity/event tracking logic |
| `src/lib/aggregation-service.ts` | Shared business/domain/service utility |
| `src/lib/allocations/engine.ts` | Fund allocation logic |
| `src/lib/attribution-service.ts` | Shared business/domain/service utility |
| `src/lib/attribution.ts` | Shared business/domain/service utility |
| `src/lib/auth-actions.ts` | Shared business/domain/service utility |
| `src/lib/automation/action-executor.ts` | Lifecycle automation / trigger logic |
| `src/lib/automation/automation-service.ts` | Lifecycle automation / trigger logic |
| `src/lib/automation/trigger-handler.ts` | Lifecycle automation / trigger logic |
| `src/lib/automation/workflow-service.ts` | Lifecycle automation / trigger logic |
| `src/lib/campaign-service.ts` | Shared business/domain/service utility |
| `src/lib/communication/dispatcher.ts` | Email/notification communication logic |
| `src/lib/community.ts` | Shared business/domain/service utility |
| `src/lib/cookie-consent.ts` | Shared business/domain/service utility |
| `src/lib/crm/crm-service.ts` | CRM, lead, campaign, segment, or relationship logic |
| `src/lib/crm/intelligence-service.ts` | CRM, lead, campaign, segment, or relationship logic |
| `src/lib/crm/segmentation-service.ts` | CRM, lead, campaign, segment, or relationship logic |
| `src/lib/crm/supporter-service.ts` | CRM, lead, campaign, segment, or relationship logic |
| `src/lib/engagement-service.ts` | Shared business/domain/service utility |
| `src/lib/error-capture.ts` | Shared business/domain/service utility |
| `src/lib/error-page.ts` | Shared business/domain/service utility |
| `src/lib/homepage-service.ts` | Shared business/domain/service utility |
| `src/lib/identifiers.ts` | Shared business/domain/service utility |
| `src/lib/impact-metrics-service.ts` | Shared business/domain/service utility |
| `src/lib/initiatives/initiative-service.ts` | Shared business/domain/service utility |
| `src/lib/partner/actions.ts` | Shared business/domain/service utility |
| `src/lib/partner/service.ts` | Shared business/domain/service utility |
| `src/lib/payments/allocation-simulator.ts` | Payment, subscription, webhook, receipt, or allocation logic |
| `src/lib/payments/mock-provider.ts` | Payment, subscription, webhook, receipt, or allocation logic |
| `src/lib/payments/service.ts` | Payment, subscription, webhook, receipt, or allocation logic |
| `src/lib/payments/simulation-actions.ts` | Payment, subscription, webhook, receipt, or allocation logic |
| `src/lib/payments/subscription-engine.ts` | Payment, subscription, webhook, receipt, or allocation logic |
| `src/lib/payments/types.ts` | Payment, subscription, webhook, receipt, or allocation logic |
| `src/lib/payments/webhook-handler.ts` | Payment, subscription, webhook, receipt, or allocation logic |
| `src/lib/security/auth-actions.ts` | Shared business/domain/service utility |
| `src/lib/security/auth.ts` | Shared business/domain/service utility |
| `src/lib/security/fileValidation.ts` | Shared business/domain/service utility |
| `src/lib/security/rateLimit.ts` | Shared business/domain/service utility |
| `src/lib/security/safeQuery.ts` | Shared business/domain/service utility |
| `src/lib/security/sanitizeHtml.ts` | Shared business/domain/service utility |
| `src/lib/security/urlValidation.ts` | Shared business/domain/service utility |
| `src/lib/security/validators.ts` | Shared business/domain/service utility |
| `src/lib/slugify.ts` | Shared business/domain/service utility |
| `src/lib/success-story-service.ts` | Shared business/domain/service utility |
| `src/lib/utils.ts` | Shared business/domain/service utility |
| `src/router.tsx` | Project configuration or supporting source |
| `src/routes/__root.tsx` | Route/page UI or route-level workflow |
| `src/routes/_authenticated.tsx` | Route/page UI or route-level workflow |
| `src/routes/_authenticated/admin-dashboard.analytics.tsx` | Route/page UI or route-level workflow |
| `src/routes/_authenticated/admin-dashboard.announcements.tsx` | Route/page UI or route-level workflow |
| `src/routes/_authenticated/admin-dashboard.community-posts.tsx` | Route/page UI or route-level workflow |
| `src/routes/_authenticated/admin-dashboard.finances.tsx` | Route/page UI or route-level workflow |
| `src/routes/_authenticated/admin-dashboard.homepage-layout.tsx` | Route/page UI or route-level workflow |
| `src/routes/_authenticated/admin-dashboard.index.tsx` | Route/page UI or route-level workflow |
| `src/routes/_authenticated/admin-dashboard.initiatives.$id.manage.tsx` | Route/page UI or route-level workflow |
| `src/routes/_authenticated/admin-dashboard.initiatives.index.tsx` | Route/page UI or route-level workflow |
| `src/routes/_authenticated/admin-dashboard.initiatives.new.tsx` | Route/page UI or route-level workflow |
| `src/routes/_authenticated/admin-dashboard.leads.tsx` | Route/page UI or route-level workflow |
| `src/routes/_authenticated/admin-dashboard.members.$id.tsx` | Route/page UI or route-level workflow |
| `src/routes/_authenticated/admin-dashboard.members.tsx` | Route/page UI or route-level workflow |
| `src/routes/_authenticated/admin-dashboard.organizations.tsx` | Route/page UI or route-level workflow |
| `src/routes/_authenticated/admin-dashboard.partner-applications.tsx` | Route/page UI or route-level workflow |
| `src/routes/_authenticated/admin-dashboard.profile.tsx` | Route/page UI or route-level workflow |
| `src/routes/_authenticated/admin-dashboard.reports.tsx` | Route/page UI or route-level workflow |
| `src/routes/_authenticated/admin-dashboard.settings.tsx` | Route/page UI or route-level workflow |
| `src/routes/_authenticated/admin-dashboard.tsx` | Route/page UI or route-level workflow |
| `src/routes/_authenticated/admin-dashboard.verify-payments.tsx` | Route/page UI or route-level workflow |
| `src/routes/_authenticated/community-hub.$postId.tsx` | Route/page UI or route-level workflow |
| `src/routes/_authenticated/community-hub.index.tsx` | Route/page UI or route-level workflow |
| `src/routes/_authenticated/dashboard.tsx` | Route/page UI or route-level workflow |
| `src/routes/_authenticated/member.profile.tsx` | Route/page UI or route-level workflow |
| `src/routes/_authenticated/member.settings.tsx` | Route/page UI or route-level workflow |
| `src/routes/_authenticated/member.tsx` | Route/page UI or route-level workflow |
| `src/routes/_authenticated/organization.tsx` | Route/page UI or route-level workflow |
| `src/routes/about.tsx` | Route/page UI or route-level workflow |
| `src/routes/cookies-policy.tsx` | Route/page UI or route-level workflow |
| `src/routes/entities/$id.tsx` | Route/page UI or route-level workflow |
| `src/routes/entities/index.tsx` | Route/page UI or route-level workflow |
| `src/routes/faq.tsx` | Route/page UI or route-level workflow |
| `src/routes/for-orgs.tsx` | Route/page UI or route-level workflow |
| `src/routes/forgot-password.tsx` | Route/page UI or route-level workflow |
| `src/routes/index.tsx` | Route/page UI or route-level workflow |
| `src/routes/initiatives/$slug.tsx` | Route/page UI or route-level workflow |
| `src/routes/initiatives/index.tsx` | Route/page UI or route-level workflow |
| `src/routes/legal.tsx` | Route/page UI or route-level workflow |
| `src/routes/login.tsx` | Route/page UI or route-level workflow |
| `src/routes/notifications.tsx` | Route/page UI or route-level workflow |
| `src/routes/organizations/index.tsx` | Route/page UI or route-level workflow |
| `src/routes/partner.tsx` | Route/page UI or route-level workflow |
| `src/routes/privacy-policy.tsx` | Route/page UI or route-level workflow |
| `src/routes/refund-policy.tsx` | Route/page UI or route-level workflow |
| `src/routes/reset-password.tsx` | Route/page UI or route-level workflow |
| `src/routes/signup.tsx` | Route/page UI or route-level workflow |
| `src/routes/terms-and-conditions.tsx` | Route/page UI or route-level workflow |
| `src/routeTree.gen.ts` | Project configuration or supporting source |
| `src/server.ts` | Project configuration or supporting source |
| `src/start.ts` | Project configuration or supporting source |
| `src/styles.css` | Project configuration or supporting source |
| `SUMMARY_REPORT.md` | Project documentation/report |
| `supabase/config.toml` | Project configuration or supporting source |
| `supabase/migrations/20240320_initial_schema.sql` | Database schema/security/function migration; authoritative historical change |
| `supabase/migrations/20240321000000.sql` | Database schema/security/function migration; authoritative historical change |
| `supabase/migrations/20240321000001.sql` | Database schema/security/function migration; authoritative historical change |
| `supabase/migrations/20240322000000.sql` | Database schema/security/function migration; authoritative historical change |
| `supabase/migrations/20240324000000.sql` | Database schema/security/function migration; authoritative historical change |
| `supabase/migrations/20240325000000.sql` | Database schema/security/function migration; authoritative historical change |
| `supabase/migrations/20240326000000.sql` | Database schema/security/function migration; authoritative historical change |
| `supabase/migrations/20240327000000.sql` | Database schema/security/function migration; authoritative historical change |
| `supabase/migrations/20240328000000.sql` | Database schema/security/function migration; authoritative historical change |
| `supabase/migrations/20240329000000.sql` | Database schema/security/function migration; authoritative historical change |
| `supabase/migrations/20240330000000.sql` | Database schema/security/function migration; authoritative historical change |
| `supabase/migrations/20260513202826_robust_signup_trigger.sql` | Database schema/security/function migration; authoritative historical change |
| `supabase/migrations/20260513214933_create_leads_table.sql` | Database schema/security/function migration; authoritative historical change |
| `supabase/migrations/20260513221602_trigger_save_phone.sql` | Database schema/security/function migration; authoritative historical change |
| `supabase/migrations/20260514103446_add_initiative_publishing_fields.sql` | Database schema/security/function migration; authoritative historical change |
| `supabase/migrations/20260514103612_refine_initiative_fields.sql` | Database schema/security/function migration; authoritative historical change |
| `supabase/migrations/20260514103920_update_initiative_visibility_policy.sql` | Database schema/security/function migration; authoritative historical change |
| `supabase/migrations/20260514204625_admin_action_logging.sql` | Database schema/security/function migration; authoritative historical change |
| `supabase/migrations/20260514212454_consolidate_rls.sql` | Database schema/security/function migration; authoritative historical change |
| `supabase/migrations/20260515080524_add_bio_and_address_to_profiles.sql` | Database schema/security/function migration; authoritative historical change |
| `supabase/migrations/20260515090302_add_age_to_profiles.sql` | Database schema/security/function migration; authoritative historical change |
| `supabase/migrations/20260515125722_optimize_rls_policies.sql` | Database schema/security/function migration; authoritative historical change |
| `supabase/migrations/20260515125804_create_missing_indices.sql` | Database schema/security/function migration; authoritative historical change |
| `supabase/migrations/20260515125844_secure_leads_table.sql` | Database schema/security/function migration; authoritative historical change |
| `supabase/migrations/20260516171935_security_hardening_and_integrity.sql` | Database schema/security/function migration; authoritative historical change |
| `supabase/migrations/20260517140024_fix_initiatives_rls.sql` | Database schema/security/function migration; authoritative historical change |
| `supabase/migrations/20260517194455_admin_initiative_creation.sql` | Database schema/security/function migration; authoritative historical change |
| `supabase/migrations/20260517211853_community_hub_schema.sql` | Database schema/security/function migration; authoritative historical change |
| `supabase/migrations/20260517211956_community_hub_security.sql` | Database schema/security/function migration; authoritative historical change |
| `supabase/migrations/20260517221446_community_trust_fix.sql` | Database schema/security/function migration; authoritative historical change |
| `supabase/migrations/20260517221556_community_notifications_bundling.sql` | Database schema/security/function migration; authoritative historical change |
| `supabase/migrations/20260518072142_fix_profile_update_persistence.sql` | Database schema/security/function migration; authoritative historical change |
| `supabase/migrations/20260518075811_refactor_ngo_to_organizations_and_extend_profiles.sql` | Database schema/security/function migration; authoritative historical change |
| `supabase/migrations/20260518075830_update_organizations_rls_and_triggers.sql` | Database schema/security/function migration; authoritative historical change |
| `supabase/migrations/20260520124348_initiative_metadata.sql` | Database schema/security/function migration; authoritative historical change |
| `supabase/migrations/20260521000000_ci_alignment.sql` | Database schema/security/function migration; authoritative historical change |
| `supabase/migrations/20260521123449_fix_worker_bundling_and_h3_v2_imports.sql` | Database schema/security/function migration; authoritative historical change |
| `supabase/migrations/20260521182626_security_hardening.sql` | Database schema/security/function migration; authoritative historical change |
| `supabase/migrations/20260521182721_performance_optimization.sql` | Database schema/security/function migration; authoritative historical change |
| `supabase/migrations/20260521182848_role_normalization_v2.sql` | Database schema/security/function migration; authoritative historical change |
| `supabase/migrations/20260522000000_schema_bootstrap_reconciliation.sql` | Database schema/security/function migration; authoritative historical change |
| `supabase/migrations/20260522191232_apply_missing_logic.sql` | Database schema/security/function migration; authoritative historical change |
| `supabase/migrations/20260522191405_harden_payment_idempotency.sql` | Database schema/security/function migration; authoritative historical change |
| `supabase/migrations/20260522192409_fix_versioning_and_schema_mismatch.sql` | Database schema/security/function migration; authoritative historical change |
| `supabase/migrations/20260524104105_allocation_functions.sql` | Database schema/security/function migration; authoritative historical change |
| `supabase/migrations/20260524104110_add_priority_level.sql` | Database schema/security/function migration; authoritative historical change |
| `supabase/migrations/20260524104117_financial_metrics_rpc.sql` | Database schema/security/function migration; authoritative historical change |
| `supabase/migrations/20260524104122_allocation_rls_fix.sql` | Database schema/security/function migration; authoritative historical change |
| `supabase/migrations/20260524133800_create_financial_event_type.sql` | Database schema/security/function migration; authoritative historical change |
| `supabase/migrations/20260524133909_financial_tracking_architecture_v1.sql` | Database schema/security/function migration; authoritative historical change |
| `supabase/migrations/20260524134005_financial_tracking_architecture_v2_logic_fixed.sql` | Database schema/security/function migration; authoritative historical change |
| `supabase/migrations/20260524134027_financial_tracking_architecture_v3_backfill.sql` | Database schema/security/function migration; authoritative historical change |
| `supabase/migrations/20260524134416_refine_financial_rls.sql` | Database schema/security/function migration; authoritative historical change |
| `supabase/migrations/20260525000000_security_stabilization.sql` | Database schema/security/function migration; authoritative historical change |
| `supabase/migrations/20260525000001_schema_cleanup.sql` | Database schema/security/function migration; authoritative historical change |
| `supabase/migrations/20260525000002_fix_anon_has_role_permission.sql` | Database schema/security/function migration; authoritative historical change |
| `supabase/migrations/20260525000004_ownership_migration_final.sql` | Database schema/security/function migration; authoritative historical change |
| `supabase/migrations/20260525000005_rls_performance_optimization.sql` | Database schema/security/function migration; authoritative historical change |
| `supabase/migrations/20260525000006_financial_gap_remediation.sql` | Database schema/security/function migration; authoritative historical change |
| `supabase/migrations/20260525000007_initiative_history_table.sql` | Database schema/security/function migration; authoritative historical change |
| `supabase/migrations/20260525000008_lifetime_metrics.sql` | Database schema/security/function migration; authoritative historical change |
| `supabase/migrations/20260525000009_priority_schema_hardening.sql` | Database schema/security/function migration; authoritative historical change |
| `supabase/migrations/20260525000010_terminology_normalization_v2.sql` | Database schema/security/function migration; authoritative historical change |
| `supabase/migrations/20260525000011_dynamic_preference_engine.sql` | Database schema/security/function migration; authoritative historical change |
| `supabase/migrations/20260525000012_initiative_attribution_system.sql` | Database schema/security/function migration; authoritative historical change |
| `supabase/migrations/20260525000013_update_signup_trigger_for_attribution.sql` | Database schema/security/function migration; authoritative historical change |
| `supabase/migrations/20260525000014_expand_initiative_analytics.sql` | Database schema/security/function migration; authoritative historical change |
| `supabase/migrations/20260525000015_schema_stabilization_final.sql` | Database schema/security/function migration; authoritative historical change |
| `supabase/migrations/20260525000016_operational_hardening.sql` | Database schema/security/function migration; authoritative historical change |
| `supabase/migrations/20260525000017_finalize_terminology.sql` | Database schema/security/function migration; authoritative historical change |
| `supabase/migrations/20260525204619_fix_reports_and_index_scoping.sql` | Database schema/security/function migration; authoritative historical change |
| `supabase/migrations/20260525204635_initiative_slug_enforcement.sql` | Database schema/security/function migration; authoritative historical change |
| `supabase/migrations/20260525204654_analytics_reconciliation_v2.sql` | Database schema/security/function migration; authoritative historical change |
| `supabase/migrations/20260525204711_lead_crm_hardening.sql` | Database schema/security/function migration; authoritative historical change |
| `supabase/migrations/20260525204730_lead_lifecycle_automation.sql` | Database schema/security/function migration; authoritative historical change |
| `supabase/migrations/20260526000001_public_visibility_layer.sql` | Database schema/security/function migration; authoritative historical change |
| `supabase/migrations/20260526010002_initiative_slug_automation.sql` | Database schema/security/function migration; authoritative historical change |
| `supabase/migrations/20260527000000_campaign_links_system.sql` | Database schema/security/function migration; authoritative historical change |
| `supabase/migrations/20260527000001_growth_engagement_foundation.sql` | Database schema/security/function migration; authoritative historical change |
| `supabase/migrations/20260527000002_engagement_triggers.sql` | Database schema/security/function migration; authoritative historical change |
| `supabase/migrations/20260527000003_relationship_intelligence.sql` | Database schema/security/function migration; authoritative historical change |
| `supabase/migrations/20260528000000_analytics_rls_hardening.sql` | Database schema/security/function migration; authoritative historical change |
| `supabase/migrations/20260529000000_phase_10_foundation.sql` | Database schema/security/function migration; authoritative historical change |
| `supabase/migrations/20260530000000_partner_application_system.sql` | Database schema/security/function migration; authoritative historical change |
| `supabase/migrations/20260530000001_partner_application_soft_delete.sql` | Database schema/security/function migration; authoritative historical change |
| `supabase/migrations/20260530000002_partner_applications.sql` | Database schema/security/function migration; authoritative historical change |
| `supabase/migrations/20260601000000_security_audit_pass_2.sql` | Database schema/security/function migration; authoritative historical change |
| `supabase/migrations/20260602000000_rls_security_cleanup.sql` | Database schema/security/function migration; authoritative historical change |
| `supabase/migrations/20260603000000_strict_role_management.sql` | Database schema/security/function migration; authoritative historical change |
| `supabase/migrations/20260604000000_lead_conversion_rpc.sql` | Database schema/security/function migration; authoritative historical change |
| `supabase/migrations/20260605000000_homepage_management_schema.sql` | Database schema/security/function migration; authoritative historical change |
| `supabase/migrations/20260606000000_schema_reconciliation.sql` | Database schema/security/function migration; authoritative historical change |
| `supabase/migrations/20260607000000_secure_partner_submission.sql` | Database schema/security/function migration; authoritative historical change |
| `supabase/migrations/20260608000000_restore_partner_admin_access.sql` | Database schema/security/function migration; authoritative historical change |
| `supabase/migrations/20260608000001_homepage_versions_init.sql` | Database schema/security/function migration; authoritative historical change |
| `supabase/migrations/20260609000002_fix_terminology.sql` | Database schema/security/function migration; authoritative historical change |
| `supabase/migrations/20260610200000_restore_admin_permissions.sql` | Database schema/security/function migration; authoritative historical change |
| `supabase/migrations/20260611000000_enforce_initiative_slug_not_null.sql` | Database schema/security/function migration; authoritative historical change |
| `supabase/migrations/20260612000000_add_signup_code_to_partner_applications.sql` | Database schema/security/function migration; authoritative historical change |
| `supabase/migrations/20260612000001_enhance_signup_trigger_for_organizations.sql` | Database schema/security/function migration; authoritative historical change |
| `supabase/migrations/20260613000000_standardize_report_management.sql` | Database schema/security/function migration; authoritative historical change |
| `supabase/migrations/20260902173900_community_post_comment_moderation.sql` | Database schema/security/function migration; authoritative historical change |
| `supabase/migrations/20260903_organization_role_based_security.sql` | Database schema/security/function migration; authoritative historical change |
| `supabase/migrations/20260904000000_create_organization_team_members.sql` | Database schema/security/function migration; authoritative historical change |
| `supabase/migrations/20260911000000_final_security_hardening.sql` | Database schema/security/function migration; authoritative historical change |
| `supabase/migrations/20260911000100_production_readiness_hardening.sql` | Database schema/security/function migration; authoritative historical change |
| `supabase/seed.sql` | Development/test seed data |
| `test_webhook.ts` | Project configuration or supporting source |
| `tests/admin.spec.ts` | Automated verification |
| `tests/auth.spec.ts` | Automated verification |
| `tests/compliance-cookie-consent.spec.ts` | Automated verification |
| `tests/e2e-signup-journey.spec.ts` | Automated verification |
| `tests/financial-trace.spec.ts` | Automated verification |
| `tests/growth/analytics.spec.ts` | Automated verification |
| `tests/growth/growth-foundation.spec.ts` | Automated verification |
| `tests/growth/notifications.spec.ts` | Automated verification |
| `tests/member-checkpoint.spec.ts` | Automated verification |
| `tests/member.spec.ts` | Automated verification |
| `tests/partner-security.spec.ts` | Automated verification |
| `tests/smoke.spec.ts` | Automated verification |
| `tests/system.spec.ts` | Automated verification |
| `tsconfig.json` | Project configuration or supporting source |
| `ui-ux-pro-max-skill-main.zip` | Binary/archive artifact — review whether it belongs in source control |
| `verify_partner.spec.ts` | Project configuration or supporting source |
| `vite.config.ts` | Project configuration or supporting source |
| `wrangler.json` | Project configuration or supporting source |

## Traceability map — non-payment domains
### Initiative discovery and attribution
    /initiatives/$slug
      -> initiative loader resolves canonical slug (UUID fallback retained for legacy URLs)
      -> initiatives + organizations query
      -> attributionService.captureFromUrl()
      -> source_initiative_id stored in localStorage
      -> logInitiativeEvent(page_view / cta_click / share)
      -> signup reads source_initiative_id
      -> createLead / convertLead carries source initiative

**Audit note:** UUID fallback is intentional legacy compatibility. If canonical slugs are now guaranteed, this fallback should eventually be reviewed and covered by a redirect/legacy URL test rather than silently retained forever.

### Organization dashboard
    authenticated organization
      -> profiles.organization_id
      -> initiatives filtered by organization_id
      -> reports filtered by organization_id
      -> uploadReport(server action)
      -> TeamManager

**Security rule:** the UI filter is not the security boundary. RLS/server-side authorization must independently enforce organization tenancy.

### Community
    community-hub route
      -> use-community
      -> community.ts
      -> community_posts / post_comments / post_reactions / announcements
      -> realtime postgres_changes invalidation

Community mutations are currently issued from the client through Supabase. The database RLS policies therefore remain the authoritative permission boundary for creating/editing/deleting posts, comments and reactions.

**Audit note:** `useCommunityRealtime()` constructs a channel with a random suffix and receives a `queryKey` array from the caller. The hook's memoization does not guarantee stable identity if callers create a new array on every render; callers should use stable query keys or the hook may repeatedly unsubscribe/resubscribe.

### CRM / leads
    signup details
      -> createLead()
      -> leads.status = started
      -> payment confirmation
      -> convertLead()
      -> leads.status = converted
      -> admin-dashboard/leads reads CRM pipeline

**Business rule:** failed/abandoned payment attempts should not be counted as converted supporters. The lead record may still exist for acquisition analysis.

### Cookie consent
    CookieConsentBanner
      -> useCookieConsent()
      -> cookie-consent state
      -> Necessary always available
      -> Analytics controlled by explicit preference

Analytics/event tracking must check consent before optional analytics storage or dispatch. Authentication/session operation must not depend on optional analytics consent.

### Authentication / role-assignment security finding

The live `handle_new_user()` trigger was audited against the signup route and found to be receiving `role` and `organization_id` through Supabase `raw_user_meta_data`. The hardened version now accepts only `member`, or `organization` when a converted `partner_applications` record matches both the organization and signup email. Other requested roles are rejected. This is enforced in the database trigger, not only in the browser.

**Important:** the member subscription created by the trigger is still initially `pending`. This remains a separate payment-state reconciliation issue documented in the payment traceability section; role hardening does not make a payment active by itself.

### Payment lifecycle — unresolved architecture gap

The live schema requires `payments.user_id` and `subscriptions.user_id` to reference an existing `auth.users` row. The current public signup intentionally creates the account only after the mock provider reports success, while `handle_new_user()` creates the DB subscription as `pending`. Therefore the current sequence cannot atomically establish pre-account payment, durable payment ledger, Auth user, and active subscription.

**Do not fix this by simply changing the trigger-created subscription to `active`.** That would make membership access precede a durable payment record and allocation.

**Required future shape:** create a durable payment/checkout intent before account creation, bind the successful payment to the newly created user, then atomically reconcile the pending subscription, payment ledger, and allocation. The mock provider should exercise that same lifecycle so Peach can replace it without changing business-state semantics.

### Allocation engine audit

`allocate_payment_funds()` is a privileged, service-role-only RPC and performs the 20/80 split, fee accounting, priority-order allocation, cap/overflow handling, and Impact Pool fallback.

Two points require follow-up testing:
1. Idempotency is currently based on existing `financial_events` with `platform_share` or `allocation`; partial failure after one ledger event can therefore affect retry behavior and needs transaction-level failure testing.
2. `v_org_pool_account_id` is resolved but not used for a ledger write. The actual 80% distribution is written directly to initiative/Impact Pool accounts; the unused account variable should be classified as legacy or removed after confirming no downstream reporting depends on it.

### Subscription lifecycle audit

`process_recurring_billing()` is the authoritative renewal path: it selects active subscriptions due for billing, creates a successful `payments` row, calls `allocate_payment_funds()`, creates a receipt, and advances `next_billing_date`. This is substantially more durable than the current initial signup mock flow.

`SubscriptionEngine` handles webhook-driven success/failure/cancel/resume transitions, but `MockPaymentProvider.cancelSubscription()`, `resumeSubscription()`, and `getSubscriptionStatus()` only return simulated values and do not persist state. The member UI currently reads the database subscription directly, so provider state and DB state can diverge if these methods are used.

Current member dashboard exposes subscription status and initiative preference management, but no direct cancel/resume mutation was found in the inspected dashboard route. Cancellation/resume therefore remains an engine/API capability rather than a complete member-facing lifecycle.

Current RLS observations: members can view only their own subscription; member preferences are self-scoped for mutation; financial events are restricted to the member, organization allocation scope, or admins. No client-side preference write can directly change subscription status.

### Priority allocation and organization reporting

`allocate_payment_funds()` orders member preferences by `priority_level ASC`. Each initiative receives only up to the current billing cycle target; any remainder proceeds to the next priority, and any final remainder is recorded against the system-owned Impact Pool. The SQL therefore implements priority overflow rather than percentage splitting.

The live `member_preferences` table had no database uniqueness/check constraints enforcing one initiative per member, one preference per priority slot, or the documented 1–4 priority range. A hardening migration now adds unique indexes on `(user_id, initiative_id)` and `(user_id, priority_level)` plus a `priority_level BETWEEN 1 AND 4` check.

Organization dashboards derive engagement metrics from their organization-scoped initiatives. Report uploads use the authenticated user's `profiles.organization_id` as a server-side ownership check before inserting the report. The organization dashboard's initiative/report queries are UI filters and must continue to be backed by RLS.

Current production data observed during this audit contains the system-owned CommonGround Impact Pool and an active partner initiative. The Impact Pool currently has a zero monthly target, which is consistent with its fallback role rather than a normal capped initiative.

### Initiative publishing and attribution

Public initiative visibility is enforced by the `Public can view published initiatives` RLS policy: anonymous/authenticated users can read only `is_approved = true AND is_published = true`, while admins and the owning organization retain access. Therefore the detail route's lack of an explicit `is_published` filter is not by itself a public data leak; RLS is the authoritative boundary.

`initiativeService` additionally filters public catalog queries to `status = active`. This is a presentation/business filter layered on top of RLS, not the security boundary.

Campaign links are publicly readable only while active. Organization campaign-link writes are checked against the initiative's organization in both the server action and RLS, while admins have broader management access.

`initiative_events` intentionally permits anonymous/authenticated inserts for page-view/CTA/share attribution. This is an analytics ingestion endpoint, so payload volume/rate-limiting and abuse monitoring should remain part of the production hardening checklist.

`generateUniqueInitiativeSlug()` performs application-level collision detection, while the database unique constraint remains the final protection. The error path currently returns the candidate slug after a lookup failure, so slug uniqueness should be tested under transient database failure.

### Community moderation security finding

The community feed's client query filtered is_deleted = false but not moderation status. The previous RLS SELECT policy likewise allowed active members to read non-deleted posts regardless of pending/rejected status. This conflicted with the documented moderation model.

A database migration now requires member/organization visibility of community posts to use status = 'published', while authors can still see their own posts and admins/super-admins retain moderation access. This makes RLS match the intended workflow: submit -> review -> published/rejected.

The same principle should be applied to any future moderated content: UI filters are convenience; RLS must enforce publication visibility.

### Community moderation and admin-role follow-up

The UI correctly hides community reaction controls from organization accounts, while RLS independently restricts reaction inserts to members/admins. Comment insertion is broader by design: active members and organization users may comment on their permitted posts, with RLS enforcing the ownership/tenant condition.

**Unimplemented requirement:** the product specification calls for rejected posts to be editable and resubmittable with a moderation/review note. The current schema has no review-note field, the post update helper only edits title/content, and the RLS edit rule does not provide a dedicated rejected-post resubmission path. This should be implemented as an explicit resubmission transition rather than weakening the normal one-hour edit rule.

**Admin hierarchy note:** `ensureAdmin()` intentionally accepts both `admin` and `super_admin` for the current phase. `super_admin` is a reserved role for a later transition to finer-grained admin types; this is intentional, not currently treated as a defect. Future roles should be introduced by an explicit privilege matrix rather than ad-hoc role checks.

### Organization and partner onboarding

Partner application submission is protected by a SECURITY DEFINER RPC with email normalization and a 24-hour duplicate cooldown. Administrative status changes and conversion are server functions guarded by `ensureAdmin()`. RLS independently limits partner-application management to admin/super-admin roles.

Organization/team-member RLS is tenant-scoped: organization owners or users whose profile belongs to the organization can manage team members; admins/super-admins can manage them globally. Public team-member SELECT is intentional for public organization profiles.

Organization security fields (`is_verified`, `status`, `owner_user_id`, financial counters and monthly target) are additionally protected by database triggers from organization-staff modification.

**Conversion transaction gap:** `convertToOrganization()` currently performs organization creation, partner-application update, email dispatch, and activity logging as separate operations. If the organization insert succeeds but the application update fails, an orphan organization can remain. If the database update succeeds but email/activity logging fails, the conversion can be partially completed. This should eventually move into a single transactional database function for state changes, with email dispatched after commit through the queue.

Some organization RLS policies list `anon` in their role scope but still require `has_role('admin')`; anonymous callers cannot satisfy that role check. This is functionally restrictive but should be normalized during a future RLS cleanup to reduce ambiguity.

### Critical traceability rule
For each domain, maintain a single authoritative transition for business state. UI state, provider-returned state and cached React Query state are representations, not the final source of truth. Database state and server-side authorization must win when they conflict.

## Audit checklist generated from the dictionary

### A. Architecture
- [ ] Every business-critical module has one clear owner/boundary.
- [ ] Route files orchestrate UI/workflow but do not duplicate database business rules unnecessarily.
- [ ] Provider-specific payment logic stays behind the payment interface.
- [ ] Server-only secrets never enter `VITE_*` variables or browser bundles.

### B. Payment
- [ ] Mock provider remains intentional until Peach integration begins.
- [ ] Successful payment cannot create a member without a confirmed payment state.
- [ ] Webhooks are authenticated with real provider signature verification before production provider launch.
- [ ] Webhook events are idempotent.
- [ ] Allocation is idempotent and auditable.
- [ ] Failed payments do not allocate funds.

### C. Database/security
- [ ] Every exposed table has appropriate RLS.
- [ ] Organization data is tenant-scoped.
- [ ] SECURITY DEFINER functions use controlled search paths.
- [ ] Anonymous writes are limited to deliberate RPC/API entry points.
- [ ] Service-role credentials never appear in frontend code.

### D. Repository hygiene
- [ ] Decide which package manager is canonical; remove or explicitly document unused lockfiles.
- [ ] Review `jules_session_1606758737968957230/` for accidental historical source duplication.
- [ ] Review `ui-ux-pro-max-skill-main.zip` for accidental repository artifact.
- [ ] Review root-level historical audit/report documents and mark which are archival versus current.
- [ ] Remove temporary test/debug files if they are no longer required.

## Traceability audit — verified findings

### Critical: signup payment/subscription state has two sources of truth

**Observed chain**

```
signup.tsx
  -> paymentService.startPayment()
  -> paymentService.subscribe()
       -> MockPaymentProvider.createSubscription()
            -> returns status: active + mock subscription ID
  -> signUp()
       -> Supabase auth.users INSERT
            -> handle_new_user()
                 -> subscriptions INSERT with status: pending
```

The frontend treats the mock provider's `active` result as proof that the subscription is active, but the database trigger deliberately creates the real `subscriptions` row as `pending`. The inspected signup path does not then update that database row to `active` or attach the returned mock subscription ID. Since `useAuth` determines `isSubscribed` from an active database subscription, this can produce a member account that has apparently completed payment but is not recognised as an active subscriber.

**Required fix direction:** establish one authoritative post-payment transition. The payment confirmation must create/identify a durable payment record, create/activate the database subscription, and then allow membership access. Do not solve this by trusting client-controlled user metadata.

**Related files:** `src/routes/signup.tsx`, `src/lib/payments/service.ts`, `src/lib/payments/mock-provider.ts`, `src/lib/auth-actions.ts`, `src/hooks/use-auth.tsx`, `supabase/migrations/20260513202826_robust_signup_trigger.sql`, `supabase/migrations/20260612000001_enhance_signup_trigger_for_organizations.sql`.

### High: mock payment is not yet a durable payment transaction

`MockPaymentProvider.initializePayment()` returns a transaction ID and checkout URL, but the inspected implementation does not persist a corresponding `payments` row. The durable payment/allocation path in `SubscriptionEngine.processSuccessfulPayment()` expects a transaction ID that corresponds to a database payment record and calls `allocate_payment_funds()` with that ID.

**Implication:** the current mock provider can demonstrate provider abstraction and subscription-result behaviour, but it does not by itself prove the complete database payment -> allocation ledger path. The simulation tools exercise the event engine separately. The signup flow should eventually use a mock payment flow that persists the same durable records a real provider webhook would produce.

### High: webhook authenticity is a placeholder

`webhook-handler.ts` accepts any non-empty signature in production mode after checking that a secret exists. It does not perform cryptographic verification against the payload. This must remain disabled from real provider use until provider-specific signature verification is implemented.

### Medium: terminology/storage boundary

The database still contains provider-specific column names such as `peach_subscription_id` and `peach_payment_id` while the active provider is MockPaymentProvider. These names can be retained as future compatibility fields, but the dictionary should make clear that they are provider-specific legacy/future fields, not proof that Peach is currently integrated.

## Confirmed audit observations requiring follow-up

1. **Webhook signature verification is not real provider verification yet.** The current handler contains a production note and placeholder validation. This is acceptable only while the mock provider is intentional; it must be replaced before a real provider/webhook is enabled.
2. **The payment service currently imports the mock provider directly.** The class accepts a provider in its constructor, but the exported singleton is instantiated with the mock provider. This is a useful boundary, but the future Peach switch must be deliberate and tested.
3. **The repository contains a large historical `jules_session_1606758737968957230/` tree.** It should be classified as archival or removed if it is not part of the application.
4. **The repository contains `ui-ux-pro-max-skill-main.zip`.** Binary archives normally do not belong in the production source tree unless intentionally versioned.
5. **Three dependency lockfiles are present:** `package-lock.json`, `pnpm-lock.yaml`, and `bun.lock`. The CI currently uses npm semantics, so the intended canonical package manager should be documented and the others reviewed.
6. **There are many historical audit/readiness documents at repository root and under `docs/`.** The new dictionary should become the navigation index, while older reports should be clearly labelled historical/current.

## How to use this tomorrow

When you find something you do not understand, search this document for the filename first. Then follow the **route -> service -> database migration/RPC -> test** chain. If the chain cannot be followed, that is itself an audit finding: either the code is undocumented, the responsibility is duplicated, or the feature is orphaned.

For a change, answer these five questions before editing:

1. What user/business process does this code belong to?
2. What calls this code?
3. What database tables/RPCs does it touch?
4. What security/role boundary does it cross?
5. Which test proves that this behaviour still works?

**Rule:** if we cannot answer all five for a critical feature, the feature is not fully understood yet.
