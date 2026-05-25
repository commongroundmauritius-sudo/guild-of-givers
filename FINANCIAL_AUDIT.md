# Financial Audit: CommonGround Platform

## 1. Overview

Audit of the ledger integrity, allocation engine, and payment flows.

## 2. Financial Architecture

- **Single Source of Truth:** `financial_events` ledger.
- **Allocation Logic:** Triggered via `allocate_payment_funds` RPC.

## 3. Ledger Integrity Audit

- **Immutability Check:** [PENDING]
- **Duplicate Protection:** [PENDING]

## 4. Findings

### [FIN-001] Missing Indexes on Financial Events

- **Severity:** P2
- **Description:** Unindexed foreign keys on account_id, billing_cycle_id, etc.
- **Impact:** Performance degradation on dashboard queries.

### [FIN-002] Concurrency/Idempotency in Allocations

- **Severity:** P1
- **Status:** Open
- **Description:** Lack of explicit check for existing payment_id in ledger.
- **Fix:** Add guarding SELECT at start of allocate_payment_funds.

### [FIN-003] Share Rounding

- **Severity:** P2
- **Status:** Open
- **Description:** Potential for penny-off errors in 20/80 split.
- **Fix:** Use subtraction for the final component (org_pool = net - platform_share).

### Verification (2026-05-24)

- **Allocation Idempotency:** Confirmed lack of guarding logic. Fixed in migration 20260525000003.
- **Rounding Logic:** Refactored to subtraction-based model to ensure ledger balance. [FIN-002] and [FIN-003] marked as RESOLVED.

### Verification (2026-05-24)

- **Idempotency [FIN-002]:** RPC now returns early if payment_id exists in financial_events. Verified by code review of migration 20260525000003.
- **Rounding [FIN-003]:** Logic now uses subtraction for the second component to ensure total consistency. Verified.

## Gap Remediation Summary (2026-05-24)

- **Resolved [FIN-002]:** Idempotency guard implemented in allocate_payment_funds.
- **Resolved [FIN-003]:** Rounding logic corrected to subtraction-based model.
- **New [FIN-004]:** Historical archiving implemented via initiative_monthly_records.
- **New [FIN-005]:** Explicit lifetime metrics added to initiatives table.

### Verification (2026-05-24)

- **Dynamic Priorities:** Confirmed unlimited ranking support in RPC.
- **Processing Order:** Verified multi-selection prioritization in billing loop.
- **Constraints:** Schema-level unique constraints enforced for preferences.

## Dynamic Allocation Summary (2026-05-24)

- **Resolved [FIN-006]:** Implementation of dynamic priority ranking.
- **Resolved [FIN-007]:** Multi-selection prioritization in billing cycle.
- **Feature:** Client-side allocation simulation for real-time impact preview.
