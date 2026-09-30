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



### CRM / lead lifecycle traceability

The lead lifecycle has two distinct boundaries:

```
Visitor/signup details
  -> createLead()
  -> leads.status = started
  -> authenticated profile creation
  -> tr_handle_lead_conversion
  -> leads.status = converted
  -> subscription lifecycle
  -> cancelled/past_due
  -> tr_handle_lead_inactivation
  -> leads.status = inactive
```

A previous implementation attempted to call `secure_convert_lead` from `convertLead()` before authentication. The application expected parameters `p_email`, `p_status`, and `p_initiative_id`, while the historical migration defined a different `p_lead_id` signature. The live database did not contain that function. This was a real broken traceability boundary.

**Fix:** lead conversion is now tied to the durable profile lifecycle. `handle_lead_conversion()` runs after profile insert or source-initiative assignment and converts the matching started lead. The obsolete pre-auth `convertLead()` server function was removed from `src/lib/auth-actions.ts`.

The repository migration for this fix is `20260930000000_fix_lead_conversion_profile_trigger.sql`. The live database was also updated and verified with the corresponding trigger definition.

**Important:** lead conversion should not be treated as proof of payment by itself. Payment/subscription state remains authoritative for supporter access.

### CRM supporter-stage warning

`src/lib/crm/supporter-service.ts` exposes `transitionStage(profileId, stage)` as a direct profile update. It is a service abstraction but should not be used as an authorization boundary or as the authoritative payment lifecycle. In particular, a manually assigned lifecycle stage must not grant supporter access; active subscription/database authorization remains authoritative.

### CRM task authorization

`crmService.getTasks()` and `updateTaskStatus()` authenticate the caller, while database RLS is expected to enforce organization scope. `updateTaskStatus()` itself does not verify that the task belongs to the caller's organization before updating it, so the database policy is the critical control. This path should have an explicit cross-organization negative test.

### Allocation / priority / Impact Pool traceability

The authoritative allocation function is the live SECURITY DEFINER RPC `allocate_payment_funds(payment_id, user_id, total_amount)`.

Its current order is:

```
gross payment
  -> transaction fee
  -> 20% CommonGround platform share of net
  -> 80% organization pool
      -> member priorities ordered by priority_level
      -> each initiative's current monthly funding-cycle space
      -> remaining amount
      -> CommonGround Impact Pool
```

Allocation is idempotency-protected by checking whether the payment already has `financial_events` of type `platform_share` or `allocation`.

The live Impact Pool is a single system-owned initiative and is unlimited. It is therefore the deterministic fallback when member-selected initiatives cannot absorb the remaining organization-pool amount.

**Important audit finding:** allocation currently uses `member_preferences` and monthly funding-cycle targets as the capacity mechanism. The initiative-level `cap_amount_mur` field is not referenced by `allocate_payment_funds()`. Therefore the product's documented "initiative reaches cap -> overflow to next priority" rule is implemented through monthly funding-cycle targets, not the generic `cap_amount_mur` column. These must not be treated as interchangeable concepts.

Another important finding: the allocation function increments `supporter_count` for every initiative receiving an allocation from a payment. If one member allocates to multiple priorities, this can count the same payment/member across multiple initiatives. That metric is a funding-cycle engagement counter, not necessarily a unique supporter count.

Deleting an initiative with allocation history is especially sensitive because `allocations`/financial references can be cascaded or removed while the financial event history follows different retention rules. Financially used initiatives should therefore be archived rather than destructively deleted.

#

## Member priority availability traceability

Member preferences are user-owned through RLS and are constrained to one row per `(user_id, initiative_id)` and one row per `(user_id, priority_level)`, with priority levels 1–4. The database currently contains no duplicate priority slots.

A saved preference can outlive an initiative's public availability because `member_preferences.initiative_id` uses `ON DELETE CASCADE`; unpublishing/deactivating an initiative does not delete the preference. The allocation engine therefore treats preference validity separately from preference existence.

**Hardening applied:** `allocate_payment_funds()` now only allocates to preferences whose initiative is `status = 'active'`, `is_approved = true`, and `is_published = true`, and explicitly excludes the system Impact Pool from numbered member priorities. Funds skipped because a saved priority is unavailable continue to the next valid priority and ultimately to the Impact Pool. This prevents a stale preference from receiving money after an initiative has been unpublished/deactivated.

The current database had 1 member preference and 0 stale/unavailable preferences at audit time. The migration is `supabase/migrations/20260930160000_harden_member_priority_allocation_state.sql`.

## Initiative deletion traceability

Initiative deletion is intentionally governed by database RLS, not by a frontend-only admin check. The live `initiatives` table has an `ALL` policy for authenticated admins/super_admins and a separate tenant-scoped `ALL` policy for organization staff.

The initiative has dependent records across allocations, campaign links, analytics/events, funding cycles, health scores, updates, versions, member preferences, and reports. Current foreign-key behavior is mixed:
- financial/allocation and operational history tables use `CASCADE`
- activity/community references use `SET NULL`

This means deletion is a destructive operation with deliberate downstream effects. In particular, deleting an initiative can delete allocation records, campaign links, reports, funding-cycle history and analytics history.

**Audit rule:** admin deletion should therefore be treated as a high-impact destructive action, with an explicit confirmation and ideally an archive/hide path for initiatives that have financial history. RLS currently permits the delete; the database does not distinguish an empty initiative from one with historical allocations.

### Reports / financial visibility traceability

The intended visibility boundary is:

```
public visitor -> no member reports
active member -> reports
organization staff -> own organization's reports
admin/super_admin -> all reports
member -> own payments/receipts/financial events
organization -> allocations to its initiatives
admin/super_admin -> all financial events
```

The live RLS policies confirm that `reports` are not publicly readable and active-member access is enforced by database subscription state. Organization report access is tenant-scoped through `profiles.organization_id`. Financial events are separately scoped to the member, the organization's initiatives, or admin roles. Payments and receipts are member/admin scoped.

The organization dashboard currently calculates engagement counts from initiative counters (`view_count`, `conversion_count`, `active_supporter_count`) rather than deriving them directly from the payment ledger. Those counters therefore represent product analytics, not accounting truth.

**Important:** member-visible reports should remain view-only from the member side; report mutation is limited by RLS to organization staff/admins.

### Subscription status / access traceability

Member access is currently derived in `src/hooks/use-auth.tsx` from the database query:

`subscriptions.status = 'active'`

The live database currently contains `active` and `pending` subscription statuses; there is no observed durable `paused`, `cancelled`, or `past_due` subscription state in the current data.

The payment provider abstraction exposes cancel/resume/status operations, but the current Mock provider does not persist those transitions. Therefore mock-provider cancellation/resumption must not be described as a completed durable member lifecycle.

**Required future lifecycle:** cancellation/pause/resume must update the authoritative `subscriptions` row, and member-access queries must intentionally define which statuses grant access. The UI and provider response must not become independent sources of truth.

This is documented as an architecture gap, not changed automatically, because introducing new subscription statuses requires aligning SQL constraints, RLS, billing retry behavior, member access, CRM stage transitions, receipts, and notifications.

### Payment settlement traceability

### Recurring billing settlement traceability

### Payment-success event idempotency

Payment success has database triggers for activity logging and confirmation communication. Both are edge-triggered on transition into `success`, not merely on every update.

`on_payment_success_engagement()` already guarded against repeat success. `log_payment_activity()` previously emitted `payment_completed` on every UPDATE where status remained `success`; this has been corrected so only `non-success -> success` emits the activity and subscriber-stage update.

This matters because webhook retries or reconciliation updates may update an already-successful payment row without representing a new payment.



Recurring billing must use the same fail-closed ordering as webhook settlement:

```
eligible active subscription
  -> payment = pending
  -> allocate_payment_funds()
  -> payment = success
  -> receipt
  -> advance next_billing_date
```

The previous SQL inserted a renewal payment as `success` before allocation and caught allocation failures without changing that success state. The live function and repository migration `20260930010000_fix_recurring_billing_settlement_order.sql` now create the payment as pending, allocate first, then mark success and create the receipt. Allocation failure marks the pending payment failed and records an audit event.

This prevents false successful renewals and false receipts when allocation cannot complete.



Successful payment settlement is a financial boundary and must be fail-closed:

```
payment.success / subscription.renewal
  -> allocate_payment_funds()
  -> payment.status = success
  -> subscription.status = active
  -> supporter event
```

The allocation step must succeed before the payment is marked successful or the subscription is activated. A previous implementation logged allocation errors and continued, allowing a possible paid-but-unallocated state. `SubscriptionEngine.processSuccessfulPayment()` now throws on allocation failure, preventing the later success-state writes.

Webhook event IDs are database-unique, providing an idempotency boundary for raw payment-event logging. The payment/allocation path still requires integration tests proving duplicate delivery does not double-allocate.

### Communication / notification traceability

The communication boundary is:

```
business event
  -> communicationDispatcher
      -> email: engagementService.enqueueEmail() -> email_queue
      -> in_app: engagementService.createNotification() -> notifications
```

Current implementation is an abstraction layer, not a complete delivery system. `email_queue` is RLS-protected so only admin-role authenticated users can directly manage it, while `engagementService.enqueueEmail()` uses the normal Supabase client. Therefore ordinary member/payment workflows cannot safely use this client method to enqueue transactional email unless the call is moved behind a privileged server-side/RPC/Edge Function boundary.

**Do not weaken email_queue RLS to make the client method work.** The correct future boundary is a server-side transactional-email enqueue operation that validates the event and writes the queue after the business transaction.

`notifications` currently allows a user to manage their own rows. This permits a user to create or modify notifications addressed to themselves. That is not a cross-user data leak, but it means notification creation is not authoritative. System-generated notifications should continue to be produced by trusted triggers/server-side operations; client notification APIs should be limited to read/read-state operations.

The reaction trigger already creates bundled notifications through a SECURITY DEFINER trigger, so notification creation does not require a client INSERT policy for that workflow.

Email delivery channels SMS/WhatsApp are explicitly deferred abstractions and must not be treated as implemented providers.

### Attribution traceability

Attribution is captured in browser `localStorage` under `cg_attribution` for 30 days. `createLead()` resolves `tracking_code` to a `campaign_links.id` and stores UTM/attribution data on the lead. This means attribution exists at lead capture time, but the authoritative supporter attribution must ultimately be tied to the authenticated member/payment lifecycle rather than relying solely on client storage.

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


## Allocation preview traceability

The member allocation preview is a client-side estimate and is not a financial authority. It now mirrors the settlement rules for fee calculation, 20/80 split, priority capacity, and initiative eligibility. Previously it used a different allocation model: it treated `goal_amount_mur/current_amount_mur` as capacity in `src/lib/allocations/engine.ts`, while settlement uses `monthly_target_mur` and `initiative_funding_cycles`; the preview also hard-coded a 3.5% + Rs10 fee and could display unavailable initiatives. The preview now skips initiatives that are inactive, unapproved, unpublished, or the system Impact Pool. Database settlement remains authoritative.

The member simulation is intentionally labeled **Estimated** in the UI. Changes to fee configuration or funding-cycle state can still make a preview differ from a later settlement, so the preview must never be used to create ledger entries.


## Allocation engine source-of-truth decision

`src/lib/allocations/engine.ts` was an obsolete second financial allocation implementation. It used the older `goal_amount_mur/current_amount_mur` model, calculated the 20/80 split independently, directly inserted into `allocations`, and did not match the authoritative `allocate_payment_funds()` settlement path. Repository search found no active callers for `allocationEngine`, `AllocationEngine`, `calculateAllocations`, or `processPayment`.

Because CommonGround has not begun real revenue and this implementation was not part of the authoritative settlement path, it has been removed. The remaining allocation simulation in `src/lib/payments/allocation-simulator.ts` is explicitly a non-financial preview/test helper; the database `allocate_payment_funds()` function remains the single authoritative financial allocation engine.

This prevents future developers from accidentally importing the legacy engine and creating a second ledger/allocation path.


## Authentication and role traceability

Authentication has three distinct authorities: Supabase Auth establishes identity/session; `user_roles` establishes application role; `subscriptions.status = 'active'` establishes supporter membership. `useAuth()` combines these for UI state, but the server-side `ensureAuthenticated()`, `ensureAdmin()`, and `ensureSuperAdmin()` checks are the security boundaries for server operations.

`admin` and `super_admin` are intentionally treated as administrative roles for current routing/access. `super_admin` is retained as the future higher-privilege role for later admin-role expansion. The dashboard router now sends both roles to `/admin-dashboard`; the admin layout accepts both.

The legacy `ngo` role was still present in the client-side role resolver even though the application role model uses `organization`. It has been removed from `useAuth()` role resolution so stale legacy role data cannot be promoted to an application role. Organization access remains based on the `organization` role.

The authenticated route gate verifies only authentication, not membership. Member-specific financial/supporter state is checked separately from the session, which keeps authentication and subscription state from becoming the same concept.


## Organization onboarding traceability

Partner onboarding is: public `/partner` form → `submit_partner_application()` RPC → admin review → `convertApplicationToOrganization()` → organization row + converted application + one-time signup code → organization signup → `handle_new_user()` creates profile/role and links `organization_id` → organization dashboard reads the profile's organization scope.

Current security boundary: partner status conversion is server-admin gated by `ensureAdmin()`. Organization/profile linkage is stored in `profiles.organization_id`; organization and initiative RLS then use that tenant relationship. `is_verified` is protected from non-admin changes by a database trigger.

`admin` and `super_admin` are both administrative roles for this current lifecycle; `super_admin` is reserved for future privilege separation. The partner flow uses `organization`, not the retired `ngo` application role.

**Hardening applied:** partner conversion was using `window.location.origin` inside `PartnerService`, which is invoked by a server function. The welcome-email action URL is now a relative `/signup?code=...` path, removing a server-side browser-global dependency.

Important architectural note: the partner conversion currently creates the organization before the organization's user account exists, then links the account during signup using the one-time code. This is intentional and keeps partner onboarding separate from paid member signup.


## Initiative lifecycle and public visibility traceability

Initiatives have two different visibility layers that must remain distinct: `status` describes lifecycle state, while `is_approved` and `is_published` control public eligibility. Public discovery should require all three conditions: active + approved + published. Organization ownership is represented by `initiatives.organization_id` and protected by organization-scoped RLS; administrative creation/approval is handled through secured server actions.

The public initiative index already required approval and publication. The shared `initiativeService` had a weaker `status = active` filter in its featured/urgent/new/trending methods, which could make an active-but-unapproved or unpublished initiative appear in consumers using that service. Those methods now require `is_approved = true` and `is_published = true` as well.

The detail route resolves a slug/legacy UUID first and then fetches the initiative. Its public visibility therefore ultimately depends on the database RLS/public visibility policy; the UI should not be treated as the security boundary. Attribution events use the secured `logInitiativeEvent()` action rather than direct client writes.

Administrative initiative creation supports draft/publish actions, while approval/publication remain administrative controls. This keeps organization ownership separate from CommonGround's publication decision.


## Homepage initiative-curation retirement

The homepage initiative-curation categories **Featured, Urgent, Newest, and Trending** have been retired from the application presentation layer. They were discovery/presentation conveniences, not part of the initiative lifecycle, approval, attribution, membership, or financial allocation model.

Removed from active code:
- `src/components/dashboard/modules/homepage/components/FeaturedInitiativesPanel.tsx`
- `src/components/dashboard/modules/homepage/components/UrgentNeedsPanel.tsx`
- `src/components/dashboard/modules/homepage/components/TrendingProgramsPanel.tsx`
- `src/hooks/initiatives/use-curated-initiatives.ts`
- the corresponding curation methods in `src/lib/initiatives/initiative-service.ts`

The public homepage no longer renders those four sections. The public `/initiatives` directory remains the canonical discovery surface and requires approved + published initiatives. Volunteer opportunities remain because they represent a distinct initiative attribute rather than a popularity/priority ranking.

Existing `homepage_versions.configuration_json` records may still contain the retired section IDs. `homepage-service.ts` now normalizes draft/published configuration on read and removes those retired IDs from the active CMS representation, preventing old drafts from reintroducing dead sections.

The underlying initiative lifecycle fields should not be interpreted as financial or membership state. Approval/publication controls visibility; subscription allocation is governed by the database settlement path documented above.


## Initiative attribution -> signup -> lead conversion traceability

Attribution flow is now: public initiative detail -> `source_initiative_id` in localStorage (30-day expiry) -> signup details -> lead `source_initiative_id` -> signup metadata -> `handle_new_user()` -> profile `source_initiative_id` + `primary_initiative_id` and initial priority-1 member preference.

The initiative detail route also logs a secured `page_view` event. Registration conversion is not created by trusting a client event: the profile trigger `handle_lead_conversion()` converts the matching started lead after the authenticated profile exists. This makes account creation the durable lead-conversion boundary.

Audit finding fixed 2026-09-30: the hardened role-assignment version of `handle_new_user()` had unintentionally dropped initiative attribution and initial preference handling. The signup page also still imported a removed `convertLead` function. The trigger was restored with the role-validation hardening intact, the obsolete client call was removed, and the live database was verified. Current live counts were 0 profiles with source/primary attribution, 0 registration-conversion events, 1 member preference, and 22 initiative page-view events at the time of audit; no existing attribution records required backfill.

Audit finding fixed 2026-09-30: the retired Trending homepage feature left `get_trending_initiatives(integer)` as an exposed SECURITY DEFINER RPC. Its EXECUTE privileges were revoked from `PUBLIC`, `anon`, and `authenticated`, and the change is recorded in the migration history.

Important remaining boundary: the current mock checkout still needs a durable payment/transaction record before the membership lifecycle can be considered fully end-to-end authoritative. The attribution path is durable once the user account is created, but payment confirmation and subscription activation remain a separate audit item.

## Monthly initiative funding and financial-history traceability

Initiative funding is a monthly-cycle model, not a lifetime-goal model. For a normal initiative, `initiatives.monthly_target_mur` is the recurring monthly target. The authoritative received amount for a specific month is `initiative_funding_cycles.received_amount_mur`, keyed by `initiative_id + billing_cycle_id`. The legacy `goal_amount_mur` and `current_amount_mur` fields are compatibility/display mirrors and must not be used as the historical financial ledger.

Settlement path: `allocate_payment_funds()` resolves the current billing cycle, applies the active fee configuration and platform share, allocates through eligible member priorities, records each allocation in `financial_events`, updates the current `initiative_funding_cycles` row, and mirrors that row's received amount to `initiatives.current_amount_mur`. When the initiative reaches its monthly target, further eligible allocation moves to the next valid priority and ultimately the Impact Pool. A monthly shortfall does not roll into the next month.

The database function `ensure_monthly_initiative_funding_cycles()` creates the next month's funding-cycle rows for active + approved + published initiatives and initializes them at zero received. A protected Supabase Cron job named `monthly-funding-cycle-initialization` runs on the first day of each month. Supabase Cron stores scheduled jobs and execution history in `cron.job` and `cron.job_run_details`; the current project also has the existing recurring billing job. This separation means recurring billing and monthly reporting-cycle creation are independent processes.

The initiative detail page reads the current cycle by month/year and, as of commit `21ea1912ee2723d694f3b5cd40a31890e1175c75`, resolves the month/year using the `Indian/Mauritius` timezone instead of the visitor's browser timezone. Historical reporting must query `initiative_funding_cycles` by explicit month/billing cycle and must never reconstruct monthly history from `current_amount_mur`.

Development/test financial rows already present in the database, including the previously observed Rs462,000 and other test transactions, are not evidence of real CommonGround revenue or real organization funding. Production reporting must distinguish test fixtures from actual payment records before presenting financial performance externally.

Audit status: the monthly funding-cycle data model, authoritative settlement update, automatic monthly initialization, and Mauritius-timezone display path have been implemented/verified. Admin and organization reporting consumers still require direct file-level review where repository-wide search indexing is incomplete.

### Public initiative funding display

`src/routes/initiatives/index.tsx` is the public initiative directory. It filters to active + approved + published initiatives, fetches the current `initiative_funding_cycles` row for each initiative, and passes that row into `src/components/InitiativeCard.tsx`. The card calculates progress exclusively from the current cycle's `target_amount_mur` and `received_amount_mur`, with `monthly_target_mur` only as a target fallback when a current-cycle row is temporarily absent. It does not use historical cumulative funding to display progress.

Audit fix 2026-09-30: both the public initiative detail route and public initiative directory now resolve the funding month/year using `Indian/Mauritius`, preventing a visitor's browser timezone from selecting a different monthly record around a month boundary. Directory fix commit: `a471717bc1ebf9426ae49ac5d70eaa79e0e28818`; detail fix commit: `21ea1912ee2723d694f3b5cd40a31890e1175c75`.

Repository-wide GitHub code search is currently incomplete for these source references, so direct file inspection is the audit authority when search returns no result.

### Admin financial dashboard and test-data boundary

`src/routes/_authenticated/admin-dashboard.finances.tsx` is the administrative financial dashboard. Its financial metrics are supplied by the protected `get_admin_financial_metrics()` RPC; transaction history reads the `payments` table and the master ledger reads `financial_events`. Audit finding fixed 2026-09-30: the metrics RPC previously summed every successful payment, which would have exposed development/test transactions such as the previously observed Rs462,000-class test activity as apparent real revenue. A new `payments.is_test` flag now separates test records, and the metrics RPC excludes `is_test = true` from real revenue calculations.

The current financial dashboard accepts both `admin` and `super_admin`, matching the current application role model. Commit: `8e5840bade620a876f74b1d7a091865b6bccf5e5`.

Important limitation: the existing database contains historical development payments without a real Peach payment ID. These were marked as test data by the migration boundary. Future production payment ingestion must explicitly set `is_test = false` for verified provider payments; test/mock payment creation should explicitly set `is_test = true`. The financial ledger remains a separate accounting trail and should not be presented as verified external revenue merely because a row has status=`success`.

### Mock/test payment lifecycle

The development payment simulator now creates a durable `payments` row through the protected `create_test_payment(p_user_id, p_amount_mur)` RPC before sending the success event to `SubscriptionEngine`. The row is explicitly marked `is_test=true`, so it cannot be counted as real revenue by the admin financial metrics.

Previous simulator behavior generated a transaction ID without creating the corresponding payment row, which meant `allocate_payment_funds()` could not reliably settle the simulated transaction and the verification page could not truthfully test payment persistence. This was fixed in commit `9ba81bc3bd2a65c0cadb590b20c71282b5754a76`.

The protected test-payment RPC requires the caller to have the current `admin` or `super_admin` role. This keeps test financial creation out of normal member flows.

End-to-end test path is now: admin verification action → `create_test_payment()` → test `payments` row → `SubscriptionEngine.handlePaymentEvent()` → `allocate_payment_funds()` → `financial_events` + monthly `initiative_funding_cycles` → payment marked successful. Test rows remain explicitly labelled and excluded from real financial metrics.



## Payment / recurring billing traceability — 2026-09-30

- **Mock signup payment intent:** `src/lib/payments/mock-provider.ts` now creates a durable `payment_intents` row through `create_test_payment_intent()` instead of generating only an in-memory transaction ID. The intent is explicitly marked test data.
- **Signup finalization metadata:** `src/routes/signup.tsx` carries both `payment_transaction_id` and the mock provider subscription ID into Supabase Auth user metadata. `handle_new_user()` consumes these fields and calls `finalize_test_signup_payment()` for the atomic test-payment path.
- **Recurring billing:** `process_recurring_billing()` is scheduled daily at 00:00 database time. It directly creates payments, allocates funds, creates receipts, and advances subscription billing dates. This is a separate database settlement path from the provider webhook path and therefore must remain explicitly controlled while MockPaymentProvider is active.
- **Monthly funding initialization:** `ensure_monthly_initiative_funding_cycles()` runs at 00:05 on the first day of each month, creates the current calendar-month billing cycle when absent, creates initiative funding-cycle rows for active/approved/published initiatives, and mirrors current-cycle received amounts into `initiatives.current_amount_mur`.
- **Important remaining billing isolation issue:** the live recurring-billing function currently inserts payments without setting `is_test=true`. The current database has no non-test payments, but test subscriptions that become due could otherwise enter the non-test payment path. This must be isolated before recurring billing is exercised with development/test subscriptions.
- **Webhook settlement mismatch:** `src/lib/payments/subscription-engine.ts` passes the provider transaction ID directly to `allocate_payment_funds(p_payment_id uuid,...)` and the `payments` update. Provider transaction IDs are not necessarily payment UUIDs. The durable signup path correctly resolves the internal payment UUID before allocation; the generic webhook path still needs provider-ID → internal-payment resolution before it is safe for real provider events.
- **Webhook authenticity:** `src/lib/payments/webhook-handler.ts` still contains placeholder signature validation. A provider-specific cryptographic verification implementation is required before Peach/real webhooks are enabled.


### Payment lifecycle audit — 2026-09-30 continuation
- Removed the signup UI's deferred-account option because it only advanced the screen without creating an account or sending an account-setup email. Signup now requires actual password setup before the success/dashboard state.
- Fixed the generic successful-webhook settlement path to resolve the provider transaction ID through `payments.peach_payment_id` before calling the UUID-based `allocate_payment_funds()` RPC. Already-successful internal payments are treated as idempotent.
- Cancel/resume methods in `PaymentService` still delegate to `MockPaymentProvider`, whose current cancel/resume methods are no-ops returning true. There is currently no member-facing cancellation/settings route found using these methods. Database/webhook status changes remain the authoritative path until provider-backed subscription management is implemented.
- Receipt creation is currently authoritative in the database `process_recurring_billing()` path. Signup finalization creates the payment and allocation but does not itself create a receipt; this should be checked against the intended signup receipt requirement before Peach integration.


### Webhook idempotency audit — 2026-09-30 continuation
- `payment_events.provider_event_id` is backed by a unique database index. Webhook handling now checks an existing processed event before settlement and treats a concurrent duplicate as already claimed when the uniqueness constraint rejects the insert.
- Failed-payment handling now resolves the provider transaction through `payments.peach_payment_id` before updating the internal payment UUID, matching the successful-payment path.
- Receipt hardening remains pending database application because the previous migration write was blocked by the execution safety layer. No claim of a live `receipts(payment_id)` unique constraint is made yet.
- The remaining major production gate in this area is provider-specific cryptographic webhook verification; the current validation still only checks that a production signature value exists.


### Subscription lifecycle audit — 2026-09-30 continuation
- The live database contains `manage_member_subscription(p_action, p_amount_mur, p_billing_day)`, a SECURITY DEFINER function executable by authenticated users only. It owns member pause/resume/cancel/update state transitions and validates the Rs167 minimum and billing-day range 1–28.
- Pause sets status `paused` and clears `next_billing_date`; cancel sets `cancelled` and clears pending amount/day; resume restores `active` and schedules the next billing date; update stores amount/day in pending fields for the next billing cycle.
- `process_recurring_billing()` consumes those pending fields on the next successful cycle, then clears them. This makes amount changes deferred rather than immediate.
- Current member settings UI only edits profile fields. It does not expose membership pause/resume/cancel/amount/billing-day controls and does not call `manage_member_subscription()`. Therefore the database lifecycle is ahead of the UI and is not currently reachable through the member settings page.
- `PaymentService.cancel/resume/getStatus` delegates to MockPaymentProvider and is not the authoritative member-management path. The database RPC is the authoritative state machine for the current application.


### Member subscription UI — 2026-09-30 continuation
- `src/routes/_authenticated/member.profile.tsx` now loads the member's latest subscription and calls the authoritative `manage_member_subscription()` RPC for amount/billing-day updates, pause, resume, and cancellation.
- Amount changes are presented as next-cycle changes, matching the database's pending-field design. The UI enforces the same visible minimum/range constraints (Rs167 and billing day 1–28), while the database remains authoritative.
- The UI intentionally does not call MockPaymentProvider for membership state changes.


### Membership state presentation — 2026-09-30 continuation
- `src/routes/_authenticated/member.profile.tsx` now treats `active`, `paused`, and `cancelled` as membership states rather than showing paused/cancelled members as `Guest User`.
- The profile subscription query includes those states and displays the corresponding membership status. `useAuth().isSubscribed` remains specifically an active-membership flag and is not used as the sole membership-state indicator on the profile page.
