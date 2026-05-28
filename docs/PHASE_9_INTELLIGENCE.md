# CommonGround Phase 9: Supporter Intelligence & Organization Operations

This document outlines the architecture and features introduced in Phase 9 to transform collected data into actionable intelligence.

## 1. Unified Supporter Identity & Lifecycle
We transitioned from isolated lead tracking to a unified supporter lifecycle:
**Visitor → Lead → Registered User → Supporter → Recurring Contributor → Ambassador**

- **Profiles & Leads Consistency**: Both tables now support lifecycle stages and last engagement tracking.
- **Unified Timeline**: The `activityService` now provides a merged, chronological view of events from both `activities` and `initiative_events`.

## 2. Initiative Health Scoring
A lightweight, weighted heuristic model to assess initiative health:
- **Heuristics**: Growth, Conversion Efficiency, Engagement Density, Retention, and Revenue Consistency.
- **Snapshotting**: Daily historical snapshots in `initiative_health_scores` enable trend analysis.

## 3. Retention & Engagement
- **Retention Status**: Supporters are categorized as Active, Dormant (>30d), or Inactive (>90d).
- **Engagement Decay**: Automatically tracked via `last_engagement_at` updates triggered by any platform activity.

## 4. Operational Visibility
- **Supporter Profile**: Detailed admin view of a supporter's journey, contribution history, and attribution.
- **Supporter Journey (Funnel)**: Aggregate visualization of movement from Visit to Contribution.
- **Failed Payment Visibility**: Enhanced financial metrics to track both conversion-stage and recurring billing failures.

## 5. Momentum Trending
- **Trending Logic**: Prioritizes recent momentum (views/conversions in last 48h) over raw lifetime totals.
- **Service Integration**: Exposed via `intelligenceService.getTrendingInitiatives` for platform-wide reuse.

## 6. Engineering Notes
- **Services**: `supporterService` (lifecycle/CRM), `intelligenceService` (health/retention).
- **Security**: Strict RLS isolation ensures organizations only see health and retention data for their own initiatives.
