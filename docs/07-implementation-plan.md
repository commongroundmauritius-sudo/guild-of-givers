# Implementation Plan

8 phases. Each lists scope, tables touched, screens delivered, exit criteria, risks. Phases are sequential — don't start N+1 until N's exit criteria are met.

---

## Phase 0 — Foundation (DONE)
- TanStack Start scaffolding, public marketing site, design tokens, basic Supabase client + `useAuth`, role-routed placeholder dashboards.
- **Carry-over fix for Phase 1**: rewrite `useAuth` to read role from `users.role` (joined via `auth_user_id`), not the non-existent `user_roles` table.

---

## Phase 1 — Schema lock & RLS
**Scope**
- Add missing helpers: `handle_new_auth_user` trigger (creates `users` + `member_profiles`), `has_role`, `has_admin_permission`, `is_org_member`, `enforce_allocation_sum_100`, `set_updated_at`, `log_admin_write`.
- Apply the RLS policy matrix from `05-backend-schema.md`.
- Generate TypeScript types from the live schema.
- Seed `admin_roles` + `permissions` baseline.
- Centralize enums in `src/lib/enums.ts`.

**Tables**: every table.
**Screens**: none new.
**Exit**: a fresh signup creates `users` + `member_profiles`; RLS denies cross-tenant reads in pgTAP-style tests; types compile.
**Risks**: existing data in the project may need backfill — confirm before applying triggers.

---

## Phase 2 — Member core
**Scope**
- Multi-step `/signup` (amount → account → checkout redirect).
- `/login`, `/reset-password`.
- `/member` overview, `/member/profile`.
- Edge fn `peach-create-checkout`.
- Edge fn `peach-webhook` (idempotent on `payment_events.provider_event_id`) writing `payments`, `payment_breakdowns`, `receipts`, activating `subscriptions`, posting `ledger_entries`.

**Tables**: `users`, `member_profiles`, `subscriptions`, `payments`, `payment_breakdowns`, `payment_events`, `receipts`, `checkout_sessions`, `ledger_*`.
**Exit**: end-to-end sandbox signup → first charge → receipt downloadable → dashboard shows live numbers.
**Risks**: Peach sandbox availability; webhook signature scheme.

---

## Phase 3 — Allocation
**Scope**
- `/member/allocations` (read/upsert `initiative_allocations`, sum=100 enforcement).
- `/member/contributions` + `/member/receipts`.
- Edge fn `allocation-run` (manually triggerable in Phase 3, scheduled in Phase 8).
- Read-only public initiative pages wired to live data.

**Tables**: `initiative_allocations`, `allocation_runs`, `allocation_results`, `allocation_snapshots`, `initiatives`, `reports`.
**Exit**: a manual allocation run distributes a test pool across initiatives correctly; member sees updated impact.
**Risks**: rounding errors in MUR (no minor units? confirm).

---

## Phase 4 — NGO portal
**Scope**
- NGO signup via `account_setup_tokens` invite (admin issues link).
- `/ngo`, `/ngo/initiatives` (CRUD), `/ngo/reports` (upload), `/ngo/funding`.
- Initiative submission → admin review workflow.

**Tables**: `organizations`, `organization_users`, `organization_verifications`, `initiatives`, `reports`.
**Exit**: NGO can be invited, verified, publish an active initiative, upload a report — all visible publicly.

---

## Phase 5 — Admin & governance
**Scope**
- `/admin` treasury (ledger-driven KPIs).
- `/admin/vetting`, `/admin/payments`, `/admin/users`, `/admin/disputes`, `/admin/audit`.
- Audit logging on every admin write (server-side via security-definer fn).
- Reprocess failed `payment_events`.

**Tables**: all admin tables, `audit_logs`, `disputes`.
**Exit**: a non-engineer admin can vet an NGO, refund a payment, and read the audit trail without dev help.

---

## Phase 6 — Receipts, notifications, transparency
**Scope**
- Receipt PDF generator edge fn (HTML→PDF), email via Resend.
- Notification dispatch edge fn (in-app + optional email).
- Public `/transparency` page wired to aggregated views.

**Tables**: `receipts`, `notifications`.
**Exit**: every successful payment auto-emails a PDF receipt; transparency page matches ledger totals.

---

## Phase 7 — Production hardening
**Scope**
- Performance pass (indexes, query review, lazy charts).
- Error monitoring wired into root error boundary.
- Rate limiting on edge fns (esp. webhook + checkout).
- Backup verification, restore drill.
- pgTAP / vitest / Playwright smoke suite.
- WCAG audit on public + member dashboard.

**Exit**: launch checklist green.

---

## Phase 8 — Schedulers & launch
**Scope**
- pg_cron: monthly billing, monthly allocation, retry sweeps, receipt-email retries.
- Switch Peach to live credentials.
- Final security scan + leaked-password check enabled.
- Public launch.

**Exit**: live payment processed, allocation run executed on schedule, monitoring dashboards green for 7 days.

---

## Roadmap (post-launch)
Recurring initiative contributions, multi-currency, member voting / DAO governance, grant management for NGOs, public transparency API, mobile app.
