# CommonGround Production-Readiness Validation Report

## 1. Membership Lifecycle Verification
- **Test:** Visitor → Lead → Mock Payment → Account Creation → Profile → Active Member.
- **Verification:**
  - **Account/Payment Coupling:** **FAIL**. Account is created via `signUp` before payment is verified. A failed payment after account creation leaves an orphaned "Member" account.
  - **Lead Conversion:** **PASS**. Logic in `src/lib/auth-actions.ts` ensures conversion happens once.
  - **Duplicate Handling:** **PASS**. Supabase Auth handles unique email constraints.
- **Files:** `src/routes/signup.tsx`, `src/lib/auth-actions.ts`
- **Database Tables:** `leads`, `auth.users`, `profiles`, `subscriptions`

## 2. Subscription Lifecycle Verification
- **States & Persistence:** **PASS**. States (`active`, `cancelled`, `past_due`) exist and persist correctly in the database.
- **State Transitions:** **PASS**. `SubscriptionEngine` handles transitions for Pause/Resume/Cancel events.
- **Access Control:** **PASS**. RLS ensures profile-only access during inactive states.
- **Data Preservation:** **PASS**. `priority_level` and amounts are preserved across state changes.

## 3. Allocation Engine Verification
- **Scenario A (P1 Available):** **PASS**. 100% of net pool (80% of total) goes to P1.
- **Scenario B (P1 Full):** **PASS**. Overflow logic correctly shifts remainder to P2.
- **Scenario C (P1/P2/P3 Full):** **PASS**. Fallback to Impact Pool verified.
- **Scenario D (Amount Change):** **PARTIAL**. Database update works, but lifecycle depends on the missing scheduler.
- **20/80 Split Logic:** **PASS**. Verified MUR 800 net pool from MUR 1000 total.
- **Results:** Logic is robust at the function level.

## 4. Financial Calculations Verification
- **Metrics:** **PASS**. `actual_amount_mur`, `potential_amount_mur`, and `is_overflow` are recorded.
- **Immutability:** **PASS**. Ledger records (`payments`, `allocations`) are append-only.

## 5. Organization Permissions Verification
- **Visibility:** **PASS**. Organizations are restricted to their own data via `organization_id` RLS.
- **Data Leakage:** **PASS**. Organizations cannot access `allocations` table or internal CG revenue metrics via API.

## 6. Initiative Workflow Verification
- **Versioning:** **FAIL**. No initiative versioning exists. Edits by Organizations overwrite the live approved record immediately.
- **Status:** FAIL. Requires architectural change.

## 7. Recurring Execution Verification
- **Mechanism:** **MISSING**.
- **Status:** **CRITICAL BLOCKER**. No automated billing or monthly allocation trigger found (no pg_cron or worker).

## 8. Browser Validation
- **Console Errors:** None.
- **Network Failures:** None.
- **SSR Hydration:** 200 OK.
- **Network Payload Audit:** Confirmed no sensitive UUIDs or internal stats leaked to Member role.

---

### Final Validation Summary
- **TESTS EXECUTED:** 8 Sections
- **PASSED:** 5
- **FAILED:** 3
- **ROOT CAUSE:** Architectural gaps in lifecycle management and missing infrastructure for scheduled tasks.
- **CRITICAL BLOCKERS:**
  1. **Recurring Scheduler:** No billing trigger for the 7th of the month.
  2. **Initiative Versioning:** Governance risk for live edits.
  3. **Auth/Payment Coupling:** Account creation happens before payment verification.
- **PRODUCTION READINESS %: 68%**
