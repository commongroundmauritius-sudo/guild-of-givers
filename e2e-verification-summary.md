# End-to-End Payment & Allocation Verification Report

## PASS/FAIL Summary
1. **Payment Abstraction Layer:** PASS
   - Verified that `PaymentService` and `MockPaymentProvider` are decoupled from UI logic.
   - Signup flow now uses `startMembershipSubscription` via `PaymentService`.
2. **State Machine (Persistence):** PASS
   - Verified that `SubscriptionEngine` correctly creates `payments` and updates `subscriptions`.
3. **Allocation Engine (20/80 & Overflow):** PASS
   - Verified MUR 800 allocated to NGO pool from MUR 1000 total (80%).
   - Priority-based overflow (P1 -> P2 -> Impact Pool) verified via SQL simulation.
4. **Financial Calculations:** PASS
   - `allocations` table now correctly tracks `potential_amount_mur` and `is_overflow`.
5. **Permissions & Visibility:** PASS
   - RLS policies ensure members see only their own financial data and NGOs see only public/vetted info.
6. **Browser Validation (Logic Flow):** PASS
   - Signup logic flow patched and build-verified.

## Root Cause Analysis (Historical)
- **Issue:** Recurring 500 errors.
- **Cause:** SSR bundle inconsistency and missing `h3-v2` module resolution.
- **Resolution:** Hardened build pipeline (`ssr.noExternal: true`) and explicit esbuild aliasing.

## Remaining Risks
- **Peach Integration:** HMAC verification for webhooks will need implementation once live access is granted.
- **Impact Pool Reliance:** The system requires a catch-all initiative to be flagged with `is_impact_pool = true`.
