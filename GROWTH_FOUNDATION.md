# Growth, Attribution, CRM, and Analytics Foundation

This document outlines the architecture and implementation of the Growth and CRM foundation for CommonGround, focused on scalable acquisition, attribution tracking, and modular reporting.

## 1. Initiative Distribution Architecture

Initiatives are now campaign-ready landing pages with curated distribution channels:
- **Curated Homepage**: Sections for *Featured*, *Urgent*, *Trending*, and *Newest* initiatives, powered by the `initiativeService`.
- **Discovery Page**: A centralized `/initiatives` route with search, category filtering, and sorting (Newest, Trending, Goal Progress).
- **Campaign Landing Pages**: Each initiative route (`/initiatives/:slug`) generates dynamic Open Graph (OG) metadata for social sharing and includes integrated **Share Buttons** (Facebook, X, WhatsApp, Email).

## 2. Attribution & Campaign Links

A multi-layered attribution system ensures every supporter conversion is correctly sourced:
- **Campaign Links**: Admins can generate tracking links (e.g., `?ref=facebook_campaign`) via the Admin Dashboard.
- **Persistence**: The `attributionService` captures URL parameters (`ref`, `utm_*`) and persists them in `localStorage` (`cg_attribution`) with a 30-day expiry.
- **Persistence Through Flow**: Attribution survives navigation, signup, and checkout, finally linking the campaign to the created `Lead` and `Profile`.

## 3. Activity & Event Tracking

A hybrid tracking architecture combines frontend insights with backend reliability:
- **Frontend Events**: Lightweight tracking for `homepage_view`, `initiative_view`, and `share_click`.
- **Backend Triggers**: Critical business events (`user_signup`, `payment_completed`) are logged via PostgreSQL triggers on `auth.users` and `public.payments`.
- **Activities Table**: A unified `activities` ledger stores all events with structured JSONB metadata, enabling future timeline and automation features.

## 4. Lead Lifecycle Model

Leads now progress through distinct stages to track funnel health:
1. **Visitor**: Initial capture via signup form.
2. **Registered User**: Profile created but no subscription.
3. **Engaged Supporter**: Lead converted (payment started).
4. **Subscriber**: Successful payment confirmed by the backend.
5. **Ambassador**: Future stage for referral-active members.

**Critical Rule**: Official member/supporter metrics *only* count successful payments recorded via backend activity logs, separating marketing analytics from financial ground truth.

## 5. CRM Foundation

Foundational tables and services are ready for future CRM expansion:
- `crm_tags`: Categorize leads and members.
- `crm_notes`: Internal tracking for organization staff and admins.
- `crm_campaigns`: For future email and marketing automation (distinct from attribution `campaign_links`).
- **RLS**: Strict Row-Level Security ensures tenant isolation between different organizations.

## 6. Modular Dashboard Architecture

The Admin Analytics dashboard has been refactored into independent modules located in `src/components/dashboard/modules/`:
- **Acquisition**: Tracks visits, registrations, and top traffic sources.
- **Engagement**: Monitors shares, repeat visits, and interaction scores.
- **Financial**: Real-time revenue, active memberships, and conversion rates.
- **Impact**: Aggregated supporter growth and initiative participation.
- **CRM**: Lead stage distribution and recent activity timelines.

This modularity allows for independent scaling and extension of analytics widgets without refactoring the core dashboard layout.
