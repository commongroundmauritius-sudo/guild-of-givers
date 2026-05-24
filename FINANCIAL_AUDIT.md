# Financial Audit: CommonGround Platform

## 1. Overview
Audit of the ledger integrity, allocation engine, and payment flows.

## 2. Financial Architecture
* **Single Source of Truth:** `financial_events` ledger.
* **Allocation Logic:** Triggered via `allocate_payment_funds` RPC.

## 3. Ledger Integrity Audit
* **Immutability Check:** [PENDING]
* **Duplicate Protection:** [PENDING]

## 4. Findings

### [FIN-001] Missing Indexes on Financial Events
* **Severity:** P2
* **Description:** Unindexed foreign keys on account_id, billing_cycle_id, etc.
* **Impact:** Performance degradation on dashboard queries.

### [FIN-002] Concurrency/Idempotency in Allocations
* **Severity:** P1
* **Status:** Open
* **Description:** Lack of explicit check for existing payment_id in ledger.
* **Fix:** Add guarding SELECT at start of allocate_payment_funds.

### [FIN-003] Share Rounding
* **Severity:** P2
* **Status:** Open
* **Description:** Potential for penny-off errors in 20/80 split.
* **Fix:** Use subtraction for the final component (org_pool = net - platform_share).
