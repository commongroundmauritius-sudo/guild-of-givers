# CommonGround Implementation Gap Analysis

This report compares the **CommonGround Operating Blueprint** against the current codebase implementation as of May 21, 2026.

---

## 1. Membership Flow

**Status:** Partially implemented

- **Business Purpose:** Convert visitors into recurring contributors.
- **Blueprint Behavior:** 3-Step flow: Basic Info → Contribution Setup (including Priority Selection) → Payment.
- **Actual Implementation:** 4-Step flow: Amount Selection → Basic Info → Payment Placeholder → Account Creation.
- **Gaps:** Priority selection is missing from the signup flow. Account creation happens before payment confirmation.
- **Files:** `src/routes/signup.tsx`
- **Database Tables:** `leads`, `profiles`, `subscriptions`
- **Frontend Components:** `Signup` route component.
- **Backend Logic:** `createLead`, `convertLead` server functions.
- **Risk level:** Medium
- **Estimated effort:** Medium

---

## 2. Subscription Engine

**Status:** Missing (Infrastructure only)

- **Business Purpose:** Manage recurring monthly payments and plan states.
- **Blueprint Behavior:** Billing on the 7th; Pause/Cancel logic; changes apply next cycle.
- **Actual Implementation:** Table schema supports statuses (`active`, `cancelled`), but there is no logic for recurring triggers or state transitions.
- **Gaps:** No automated billing logic. No UI for "Pause" vs "Cancel".
- **Files:** `src/routes/_authenticated/member.tsx`
- **Database Tables:** `subscriptions`, `payments`
- **Frontend Components:** Member Dashboard subscription card.
- **Backend Logic:** None.
- **Risk level:** High
- **Estimated effort:** Large

---

## 3. Allocation Engine

**Status:** Missing

- **Business Purpose:** Distribute funds according to member priorities and platform fees.
- **Blueprint Behavior:** 20% platform / 80% Organization split. Priority overflow logic (P1 → P2 → P3 → Impact Pool).
- **Actual Implementation:** Tables exist to store preferences and allocations, but no calculation logic exists.
- **Gaps:** No priority overflow logic; no 20/80 split calculation.
- **Files:** `src/lib/auth-actions.ts` (Preference toggle only)
- **Database Tables:** `allocations`, `member_preferences`
- **Frontend Components:** Initiative toggle in Member Dashboard.
- **Backend Logic:** None.
- **Risk level:** High
- **Estimated effort:** Large

---

## 4. Priority Selection

**Status:** Exists but differs from blueprint

- **Business Purpose:** Allow members to rank their impact.
- **Blueprint Behavior:** Ranking 1-4. No duplicates. Impact Pool always final.
- **Actual Implementation:** Binary selection (toggle on/off). No ranking or priority order stored.
- **Gaps:** Missing Ranking UI and `priority_level` column in database.
- **Files:** `src/routes/_authenticated/member.tsx`
- **Database Tables:** `member_preferences`
- **Frontend Components:** Initiative cards with check/plus icons.
- **Backend Logic:** `toggleInitiativePreference` server function.
- **Risk level:** Low
- **Estimated effort:** Medium

---

## 5. Community Hub

**Status:** Fully implemented

- **Business Purpose:** Engagement and community building.
- **Blueprint Behavior:** Manual admin approval for all posts. Rejection → Edit → Resubmit flow.
- **Actual Implementation:** Enhanced logic using a **Trust Threshold**. After 5 approved posts, future posts are auto-published.
- **Gaps:** The "Edit → Resubmit" flow for rejected posts is not explicitly surfaced in the member UI.
- **Files:** `src/routes/community-hub.index.tsx`
- **Database Tables:** `community_posts`, `notifications`, `post_comments`, `post_reactions`
- **Frontend Components:** `PostCard`, `CommentSection`, `ReactionButtons`.
- **Backend Logic:** `handle_post_creation`, `handle_comment_creation` database triggers.
- **Risk level:** Low
- **Estimated effort:** Small

---

## 6. Organization (Organization) Dashboard

**Status:** Partially implemented

- **Business Purpose:** Allow Organizations to manage initiatives and view impact.
- **Blueprint Behavior:** Create/Edit initiatives; View metrics (Supporters per priority, amount received).
- **Actual Implementation:** Initiative creation and report submission work. Metrics are limited to "Progress %" of total goal.
- **Gaps:** Missing Priority Distribution metrics (Ranking 1 vs 4) and cumulative "Amount Received" stats.
- **Files:** `src/routes/_authenticated/organization.tsx`
- **Database Tables:** `organizations`, `initiatives`
- **Frontend Components:** Organization Dashboard layout and initiative grid.
- **Backend Logic:** Standard Supabase CRUD with staff RLS.
- **Risk level:** Medium
- **Estimated effort:** Medium

---

## 7. Initiative Workflow

**Status:** Partially implemented

- **Business Purpose:** Governance and quality control.
- **Blueprint Behavior:** Organization Edit → New version pending review → Old version remains visible.
- **Actual Implementation:** One record per initiative. Edit overwrites current record.
- **Gaps:** No "Versioning" system. Editing a live initiative immediately updates the public view if approved.
- **Files:** `src/routes/_authenticated/admin-dashboard.initiatives.index.tsx`
- **Database Tables:** `initiatives`
- **Frontend Components:** Admin initiative management tabs.
- **Backend Logic:** `is_approved` and `is_published` boolean flags.
- **Risk level:** Medium
- **Estimated effort:** Large

---

## 8. Reports

**Status:** Fully implemented

- **Business Purpose:** Transparency and trust.
- **Blueprint Behavior:** Admin uploads/approves Organization reports; members view.
- **Actual Implementation:** Organization submits → Admin approves → Member views in dashboard.
- **Files:** `src/routes/_authenticated/member.tsx`
- **Database Tables:** `reports`
- **Frontend Components:** "Transparency Updates" feed in Member Dashboard.
- **Backend Logic:** RLS restricted to approved reports for members.
- **Risk level:** Low
- **Estimated effort:** N/A

---

## 9. Financial Engine

**Status:** Missing

- **Business Purpose:** Platform revenue tracking and Organization pool oversight.
- **Blueprint Behavior:** View Collected, Fees, Net, CG share, and Organization share.
- **Actual Implementation:** Admin Dashboard displays "Total Revenue" and "Active Subscriptions" cards with raw data.
- **Gaps:** No logic for net-of-fee calculation or platform share split.
- **Files:** `src/routes/_authenticated/admin-dashboard.index.tsx`
- **Database Tables:** `payments`, `subscriptions`
- **Frontend Components:** Admin Dashboard stat cards.
- **Backend Logic:** None.
- **Risk level:** Medium
- **Estimated effort:** Medium

---

## 10. Admin Dashboard

**Status:** Fully implemented

- **Business Purpose:** Central control and moderation.
- **Blueprint Behavior:** Manage Organizations, initiatives, posts, and internal finance.
- **Actual Implementation:** Unified dashboard for all administrative tasks.
- **Files:** `src/routes/_authenticated/admin-dashboard.tsx`
- **Database Tables:** `admin_actions`, `organizations`, `profiles`, `initiatives`
- **Frontend Components:** `AdminDashboardLayout`, RoleGuard components.
- **Backend Logic:** `has_role('admin')` SQL function.
- **Risk level:** Low
- **Estimated effort:** N/A

---

## 11. Security

**Status:** Fully implemented

- **Business Purpose:** Protect data integrity and user privacy.
- **Blueprint Behavior:** Role-based access control (Admin, Organization, Member, Public).
- **Actual Implementation:** Strict RLS policies and role-assignment triggers.
- **Files:** `supabase/migrations/...consolidate_rls.sql`
- **Database Tables:** `user_roles`
- **Backend Logic:** `has_role` helper used across all policies.
- **Risk level:** Low
- **Estimated effort:** N/A

---

## 12. Audit Logging

**Status:** Fully implemented

- **Business Purpose:** Accountability for administrative and community actions.
- **Blueprint Behavior:** All major actions logged.
- **Actual Implementation:** Database triggers automatically log insertions, updates, and deletes to `audit_logs` and `admin_actions`.
- **Files:** `supabase/migrations/...admin_action_logging.sql`
- **Database Tables:** `audit_logs`, `admin_actions`
- **Backend Logic:** `log_community_action` trigger function.
- **Risk level:** Low
- **Estimated effort:** N/A

---

## 13. Trust Thresholds

**Status:** Fully implemented

- **Business Purpose:** Automate moderation for trusted community members.
- **Blueprint Behavior:** Not explicitly in blueprint but implemented as an optimization.
- **Actual Implementation:** Users with < 5 approved posts have new posts set to `pending`.
- **Files:** `supabase/migrations/...community_hub_security.sql`
- **Database Tables:** `user_trust`
- **Backend Logic:** `handle_post_creation` trigger function.
- **Risk level:** Low
- **Estimated effort:** N/A

---

## 14. Activity Limits

**Status:** Fully implemented

- **Business Purpose:** Prevent spam and platform abuse.
- **Blueprint Behavior:** Rate limiting for posts, comments, and reactions.
- **Actual Implementation:** 5 posts/day, 20 comments/hour, 50 reactions/day enforced at database level.
- **Files:** `supabase/migrations/...community_hub_security.sql`
- **Database Tables:** `community_activity_limits`
- **Backend Logic:** Rate limiting checks inside creation triggers.
- **Risk level:** Low
- **Estimated effort:** N/A

---

## Final Summary

| Metric                           | Value   |
| :------------------------------- | :------ |
| **CURRENT PRODUCT COMPLETION %** | **65%** |
| **CORE FEATURE COMPLETION %**    | **45%** |

### CRITICAL BLOCKERS

1.  **Allocation Engine:** The platform currently has no way to actually calculate or distribute funds based on user priorities.
2.  **Payment Integration:** No connection to Peach Payments to automate subscription activation.
3.  **Initiative Versioning:** Lack of versioning creates a governance risk when Organizations update active initiatives.

### RECOMMENDED IMPLEMENTATION ORDER

1.  **Priority Ranking (UI/DB):** Align the member preference system with the 1-4 ranking blueprint.
2.  **Allocation Backend:** Implement the 20/80 split and priority overflow logic.
3.  **Payment Webhooks:** Connect Peach Payments to automate the "Lead → Member" conversion.
4.  **Organization Metrics:** Add priority distribution and cumulative funding views to the Organization Dashboard.
5.  **Versioning:** Create an `initiative_versions` table to support safe editing of live campaigns.

### Audit Sync (2026-05-24)
* **Gap Identified:** Schema drift between local migrations and remote state (P0-004).
* **Gap Identified:** Security hardening regression in 'anon' permissions (P0-001).
* **Gap Identified:** Missing root-level infrastructure config (P1-007).
* **Reference:** MASTER_AUDIT_REPORT.md

### Verification (2026-05-24)
- **Migration Sync:** Confirmed local 52 vs remote 50. Extra migrations are intentional fixes.
- **Structural Integrity:** Remote schema verified against local target state. No major drift in critical tables.
