
## Goal

You don't want to build yet — you want a shared blueprint we both work from. This plan reconciles your pasted PRD/architecture with the actual Supabase schema you shared, calls out the gaps, and locks the spec before any code is written.

No app code, no migrations, no UI changes this turn. Output is documentation only.

## Deliverables (markdown files in `docs/`)

```text
docs/
  00-overview.md
  01-prd.md                  # full PRD (your text, structured + de-duplicated)
  02-tech-requirements.md    # stack, security, perf, infra
  03-web-flows.md            # mermaid flows: auth, subscription, contribution, NGO, admin
  04-ux-design-brief.md      # brand, IA, screen list, components, states
  05-backend-schema.md       # ACTUAL schema (your DB) annotated + ERD + RLS matrix
  06-frontend-data-contract.md  # how each screen maps to tables/queries
  07-implementation-plan.md  # 8 phases from your doc, with exit criteria
  08-open-decisions.md       # things I need from you before Phase 1 build
```

## Schema reconciliation (key point)

Your live DB does NOT match the simple PRD schema. The frontend must target the real one. Highlights I'll document and then design against:

- **Identity**: `public.users` mirrors `auth.users` via `auth_user_id`. Frontend reads `users` joined on `auth.uid() = users.auth_user_id`. The scaffolded `useAuth` currently looks up `user_roles` — that table doesn't exist; role lives on `users.role` (enum `user_role`) with `admin_user_roles` for fine-grained admin permissions.
- **Members**: `member_profiles` holds `monthly_subscription_amount`, `total_contributed`. Signup must create both `users` and `member_profiles` rows.
- **Subscriptions vs payments**: `subscriptions` is the recurring plan (Peach), `payments` is each charge, `payment_events` is the raw webhook log, `payment_breakdowns` splits each payment into MCB/VAT/Peach fee, reserve, platform margin, impact pool, distributable, net profit. `receipts` is generated per payment.
- **Allocations**: members set `initiative_allocations` (% per initiative). Monthly `allocation_runs` produce `allocation_results` (amount per initiative) and `allocation_snapshots` (member-level percentages at run time).
- **Accounting**: double-entry via `ledger_accounts` + `ledger_entries` + `transaction_groups`. Currency default `MUR`.
- **NGO side**: `organizations` (verification_status enum), `organization_users`, `organization_verifications`, `initiatives` (status enum), `reports`.
- **Governance/ops**: `admin_roles`, `admin_user_roles`, `permissions`, `role_permissions`, `audit_logs`, `disputes`, `notifications`, `account_setup_tokens`, `checkout_sessions`.
- **Enums in use**: `user_role`, `account_status`, `organization_status`, `initiative_status`, `subscription_status`, `payment_status`, `webhook_processing_status`. Frontend types must mirror these exactly.

## Frontend data contract (doc 06) will spell out, per screen

- **Member dashboard**: `users` + `member_profiles` + latest `subscriptions` + recent `payments` + `initiative_allocations` + `notifications`.
- **Contributions page**: `payments` join `subscriptions` join `payment_breakdowns`.
- **Receipts**: `receipts` join `payments`.
- **Allocations editor**: read/write `initiative_allocations` (sum to 100%).
- **Initiatives list/detail**: `initiatives` + `organizations` + `reports` + aggregated `allocation_results`.
- **NGO dashboard**: `organizations` (own) + `initiatives` + `reports` + funding from `allocation_results`.
- **Admin**: vetting queue (`organization_verifications`), payments monitor, `audit_logs`, `disputes`, `payment_events` reprocessing.
- **Transparency (public)**: aggregated reads from `allocation_results`, `initiatives.current_received_amount`, published `reports`.

## Web flows (doc 03)

Mermaid diagrams for: signup → `account_setup_tokens` → first subscription → Peach checkout → webhook → `payment_events` → `payments` + `payment_breakdowns` + `receipts` → activate membership; monthly billing cycle; allocation run; NGO onboarding & verification; dispute lifecycle; admin governance.

## UX brief (doc 04)

- Keep current visual direction (cream `#F7F3EC`, forest `#0F3D2E`, Fraunces + Inter, layered hero) for public site — it matches your reference.
- Dashboards switch to a denser, fintech-style layout (Stripe/Linear inspired per your brief): left sidebar, top bar, data cards, tables.
- Document IA, navigation per role, component inventory mapped to shadcn, empty/loading/error states, MUR currency formatting, responsive rules.

## Implementation plan (doc 07)

Use your 8 phases verbatim, but each one gets: scope, data tables touched, screens delivered, exit criteria, risks. Phase 1 already partially done (auth scaffolding, public site) — will note the `useAuth` rewrite needed to match real schema as the first Phase 1 fix when we resume building.

## Open decisions (doc 08) — I need answers before any Phase 1+ build

1. **Role source of truth**: use `users.role` enum directly, OR keep `users.role` for coarse role + `admin_user_roles` for admin sub-permissions? (I'll assume the latter unless you say otherwise.)
2. **Currency & locale**: MUR only, or MUR + USD/EUR display? Number/date locale?
3. **Peach Payments**: sandbox credentials owner, webhook URL target (Lovable Cloud edge function vs current Supabase project edge function), redirect URLs.
4. **Existing Supabase project**: do we keep using `vzsifigcowusabfmnudk` as-is, or migrate to a Lovable-Cloud-managed project? (Affects how we add edge functions and secrets.)
5. **`account_setup_tokens` flow**: is signup invite-only via emailed token, or open self-signup with email verification? Current frontend assumes open signup.
6. **Allocation model**: members allocate % to initiatives directly, or contribute into a pool that admin allocates monthly via `allocation_runs`? Schema supports both — which is the product?
7. **NGO onboarding**: self-serve apply → admin verify, or admin-invited only?
8. **Governance**: any member-voting in v1, or admin-only governance for now?

## Out of scope this turn

- No code changes, no migrations, no edge functions.
- No Peach integration work.
- No design comps as images (written brief only — happy to generate comps next turn if you want).

## After approval

A pixel-feel-close marketing site with working auth, Google login, role-aware redirects, and three placeholder dashboards — ready to layer real data onto next.
