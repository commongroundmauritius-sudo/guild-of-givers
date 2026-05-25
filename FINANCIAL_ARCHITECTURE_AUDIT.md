# CommonGround Financial Architecture Audit (2026-05-24)

## 1. Component Audit Status

| Component                   | Status  | Evidence                                                                                         |
| :-------------------------- | :------ | :----------------------------------------------------------------------------------------------- |
| **Gross Payment Recording** | EXISTS  | `payments` table tracks success/failed.                                                          |
| **Transaction Fee Logic**   | EXISTS  | `fee_configurations` + `allocate_payment_funds` logic.                                           |
| **Net Contribution Calc**   | EXISTS  | Net amount derived in RPC after fee deduction.                                                   |
| **Platform Share (20%)**    | EXISTS  | Calculated in RPC; recorded as `platform_share`.                                                 |
| **Organization Pool (80%)** | EXISTS  | Calculated in RPC; recorded as `organization_pool`.                                              |
| **Priority Allocation**     | EXISTS  | Loop in RPC iterates over `member_preferences` by `priority_level`.                              |
| **Monthly Cycle Update**    | PARTIAL | `initiative_funding_cycles` exists but metrics like `monthly_gap_mur` are calculated on the fly. |
| **Immutable Ledger**        | EXISTS  | `financial_events` with immutable triggers.                                                      |
| **Lifetime Metrics**        | MISSING | `initiatives` table has `current_amount_mur` but no explicit lifetime fields.                    |
| **Historical Records**      | MISSING | No `initiative_monthly_records` table for snapshotting closed cycles.                            |

## 2. Terminology Audit

- **Organization -> Organization:** The database still uses `organization_pool_account_id` and `v_organization_pool_account_id` in some internal variables within `allocate_payment_funds`.
- **Finding [P3-003]:** Inconsistent internal naming in SQL functions.

## 3. Architecture Gaps

- [P1-011] Missing Initiative Monthly Snapshots: No mechanism to "close" a cycle and archive it into a historical record table.
- [P2-007] Lack of Explicit Lifetime Counters: Lifetime supporters and total allocations are currently derived via aggregation rather than stored for performance.

## 4. Monthly Cycle Verification (Phase 2)

- **Initiative Metrics Audit:**
  - `monthly_target_mur`: Verified in `initiatives` table.
  - `received_amount_mur`: Verified in `initiative_funding_cycles`.
  - `remaining_amount_mur`: Verified in `initiative_funding_cycles`.
  - `overflow_amount_mur`: Verified in `initiative_funding_cycles`.
  - `supporter_count`: Verified in `initiative_funding_cycles`.
- **Rollover Logic:**
  - **Behavior:** The `allocate_payment_funds` RPC ensures a `billing_cycles` and `initiative_funding_cycles` record exists for the _current_ month.
  - **Rule Check:** It correctly initializes May received to Rs 0 if May just began.
  - **Gap [P2-008]:** No explicit field for `monthly_gap_mur` (derived from `remaining_amount_mur`).
- **Authoritative Source:** The engine correctly evaluates the _current_ cycle record in `initiative_funding_cycles` rather than lifetime totals.

## 5. Transaction Fee Audit (Phase 3)

- **Fee Logic Verification:**
  - Gross - Fee = Net: **VERIFIED**. RPC subtracts fee amount from total.
  - Net = Platform + Org: **VERIFIED**. RPC splits net contribution 20/80.
- **Ledger Event Types:**
  - `payment_received`: [MISSING as explicit ledger event type, though implied by payments table entry]
  - `transaction_fee`: **VERIFIED**.
  - `platform_share`: **VERIFIED**.
  - `organization_pool`: **VERIFIED**.
  - `allocation`: **VERIFIED** (Named `allocation`, requirements ask for `initiative_allocation`).
  - `impact_pool`: **VERIFIED**.
  - `overflow`: **VERIFIED** (Named `overflow`, requirements ask for `overflow_transfer`).
- **Gap [P1-012]:** Missing explicit 'payment_received' ledger event.

## 6. Priority Allocation Audit (Phase 4)

- **Model Check:**
  - P1-P4 Ranking: **VERIFIED**. Logic iterates via `priority_level ASC`.
  - Overflow Logic: **VERIFIED**. If an initiative's `v_cycle_space` is 0, the engine continues to the next preference.
  - Universal Fallback: **VERIFIED**. Any remaining amount after the preference loop is sent to the Impact Pool.
- **Findings:**
  - **Verified:** Logic correctly handles P1 -> P2 -> P3 -> P4 sequence.
  - **Gap [P2-009]:** Duplicate ranking prevention is not enforced at the database schema level (though logic handles it sequentially).

## 7. Money Flow Traceability (Phase 5)

- **Ledger Audit Trail:**
  - All movements (Fee, Share, Allocation, Impact) are linked via `payment_id`.
  - Final Initiative Balance sync: **VERIFIED**. Both `initiatives.current_amount_mur` and `initiative_funding_cycles.received_amount_mur` are updated.
- **Dashboard Sourcing:**
  - Admin: Uses `get_ledger_summary_metrics` which sources from `financial_events` and `payments`. **VERIFIED**.
  - Organization: Sources from `initiatives` and `initiative_funding_cycles`. **VERIFIED**.
  - Member: Sources from `payments` and `allocations`. **VERIFIED**.

## 8. Gap Remediation Verification (Phase 7)

- **Idempotency Test [VERIFIED]:** Migration `20260525000006` adds an explicit existence check for `payment_received` event in the ledger.
- **Rounding Protection [VERIFIED]:** Logic refactored to use `v_org_pool_amount := v_net_amount - v_cg_share`, ensuring ledger balance.
- **Ledger Immutability [VERIFIED]:** BEFORE UPDATE/DELETE triggers are active on the `financial_events` table.
- **Metrics Audit:**
  - Gross - Fees = Net: **PASS**.
  - Net = Platform + Org Pool: **PASS** (Guaranteed by subtraction model).
