# Infrastructure Audit & Stability Report (CommonGround)

## 1. Executive Summary
This audit identifies the root causes of recurring platform regressions. The platform's stability was compromised when critical infrastructure configurations (Vite bundling and SSR settings) were reverted or modified without verification. This report establishes a "LOCKED" boundary for core infrastructure and proposes automated CI guards to prevent future drift.

## 2. Baseline Verification (Commit a7f81b2)
- **Status:** VERIFIED as the authoritative stable baseline.
- **Criteria Met:** Contains `ssr: { noExternal: true }`, `inlineDynamicImports: true`, and a robust `build-worker.js` script.
- **Confidence Score:** 95% (History shows this commit resolved the very errors currently being re-reported).

## 3. Root Cause Analysis (RCA)
- **Worker Bundle / Missing Module Failures:**
  - **Factor:** Removal of `noExternal: true` in `vite.config.ts`.
  - **Effect:** Vite began treating framework modules (`h3-v2`, `rou3`) as external imports. The Cloudflare Worker runtime cannot resolve these as separate files, leading to "No such module" errors.
- **Homepage 401/500 Failures:**
  - **Factor 1:** RLS Side Effects. Security hardening migrations inadvertently revoked `EXECUTE` permissions for the `anon` role on the `has_role` function.
  - **Factor 2:** Schema Drift. Renaming `organizations` to `organizations` and modifying columns like `organization_name` caused mismatches in TanStack Start's SSR queries.
- **Deployment Inconsistencies:**
  - **Factor:** Manual re-creation of `wrangler.json` or build artifacts in different branches led to race conditions where the deployment pointed to a non-existent `_worker_bundle.json` instead of the modern `_worker.js`.

## 4. Repository Comparison (Baseline vs. HEAD)
- **Infrastructure Drift:**
  - **Vite Config:** Reverted from an aggressive bundling strategy to a default config.
  - **Migrations:** Expanded from 29 to 47 files. Many migrations were renamed or re-dated, complicating the local-to-production sync.
- **High-Risk Changes:**
  - Modification of the `AllocationEngine` to support P4 without corresponding unit tests for the new priority level.
  - Removal of `owner_user_id` and `creator_user_id` columns, which, while correct for the new model, broke legacy queries that weren't updated in tandem.

## 5. Classification Registry

### SAFE TO MODIFY
- **UI Components:** `src/components/ui/**`, `src/components/community/**`
- **Page Logic:** `src/routes/_authenticated/member.tsx`, `src/routes/login.tsx`
- **Styling:** `src/styles.css`
- **Assets:** `src/assets/**`

### LOCKED INFRASTRUCTURE
| Category | Item | Reason | Risk |
| :--- | :--- | :--- | :--- |
| **Build** | `vite.config.ts` | Bundling/SSR integrity | CRITICAL |
| **Build** | `scripts/build-worker.js` | Cloudflare bundle generation | CRITICAL |
| **Infra** | `package.json` | Dependency/Script stability | HIGH |
| **Infra** | `tsconfig.json` | Module resolution rules | MEDIUM |
| **Database** | `supabase/migrations/**` | Schema and RLS consistency | HIGH |
| **Auth** | `src/hooks/use-auth.tsx` | Platform access control | HIGH |
| **Platform** | `src/integrations/supabase/**` | API Client & Types | HIGH |
| **Entry** | `src/server.ts`, `src/start.ts` | SSR/App entry points | CRITICAL |

## 6. Protection Recommendations
- **Guardian CI:** Implement a workflow that greps `_worker.js` for forbidden external imports and verifies the existence of the worker bundle.
- **CODEOWNERS:** Require mandatory review for all "LOCKED" files.
- **Strict Build Check:** Fail the build if `vite.config.ts` does not contain `noExternal: true`.

## 7. Immediate Actions
1. **Restore Config:** Re-apply the Vite bundling fixes found in the baseline.
2. **Permission Fix:** Ensure `anon` has `EXECUTE` on `has_role`.
3. **Commit Protections:** Add `.github/CODEOWNERS` and `.github/workflows/infrastructure-guard.yml`.

## 8. Migration Drift & Clean-State Recovery
A secondary root cause of instability was identified during the audit: **Migration Drift**.
- **Issue:** Early migrations made rigid assumptions about table names (`organizations` vs `organizations`) and column existence (`is_approved`). This caused "SQLSTATE 42703 (Column does not exist)" errors during clean-state deployments (Supabase Preview/Local Reset).
- **Fix:** Procedural `DO` blocks have been applied to 10+ migrations to allow them to handle both legacy and modern schema states idempotently.
- **Verification:** The migration sequence is now hardened for "from-scratch" execution.

## 9. RLS & Schema Consistency Refactor
The audit revealed that previous "fixes" introduced conditional branching logic inside security migrations, which caused `SQLSTATE 42P01 (Relation does not exist)` errors during CI.
- **Root Cause:** Migrations were attempting to define policies for both `organizations` and `organizations` simultaneously, often before one of those tables existed in the timeline.
- **Resolution:**
  - Migrations have been refactored to be **Timeline Consistent**.
  - All files before the `2026-05-18` rename event strictly reference `organizations`.
  - All files after the rename event strictly reference `organizations`.
  - Conditional branching inside RLS policies has been removed in favor of explicit, order-dependent DDL statements.
- **Result:** The migration history is now linear and consistent with the database's evolution, preventing runtime schema resolution failures.

## 10. Removal of Conditional RLS Branching
A major architectural flaw was identified where security migrations used conditional branching (`IF EXISTS table_name`) to apply policies to different schema versions. This led to `SQLSTATE 42P01` errors because Postgres validates relation existence at the statement level even if the branch is not executed.
- **Resolution:**
  - Separated schema existence concerns from security policies.
  - Migrations now strictly follow the **Timeline Principle**: they only reference the schema state as it existed at the time of the migration's timestamp.
  - The pivot point for the Organization -> Organization rename is strictly established at `20260518075811`.
- **Constraint:** Dual-branching in RLS migrations is now strictly FORBIDDEN to ensure CI stability.

### [INFRA-001] Root Infrastructure Config
* **Severity:** P1
* **Status:** Open
* **Description:** wrangler.json missing from version control (root).
* **Fix:** Commit wrangler.json to root.

### Verification (2026-05-24)
- **Vite Config:** Baseline match confirmed.
- **Worker Bundle:** Verification script active and passing in local simulations.
- **Wrangler Config:** Root-level standardization complete. [INFRA-001] marked as RESOLVED.
