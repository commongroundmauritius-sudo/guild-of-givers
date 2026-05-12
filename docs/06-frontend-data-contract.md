# Frontend Data Contract

Per-screen mapping from UI to tables / queries. Every query is RLS-scoped — the frontend never asks for "all", it asks for what the policy allows.

Conventions:
- `me` = `users` row where `auth_user_id = auth.uid()`.
- All money is MUR unless noted.
- Query keys use `['domain', filter]` shape for TanStack Query invalidation.

## Public

### `/` (Home)
- No DB. Static + the `getPublicStats` server fn (cached 5 min).

### `/initiatives`
- `select * from initiatives where status = 'active'` join `organizations(name, verification_status)` where verified.

### `/initiatives/$id`
- `initiatives` row + org + latest published `reports` + aggregated `allocation_results` per month for last 12 months.

### `/transparency`
- Aggregated views: total raised, distributable to date, member count, by-initiative split. Implemented as SQL views read via anon role (read-only).

## Auth

### `/signup`
1. Local form state for amount.
2. `supabase.auth.signUp({ email, password, options: { data: { intended_amount } } })`.
3. Trigger creates `users` row (`role='member'`, `account_status='pending_setup'`).
4. After email verify, `POST` to edge fn `peach-create-checkout` → returns hosted URL → redirect.

### `/login`
- `supabase.auth.signInWithPassword`. After session, fetch `me` and route by `users.role`.

### `/reset-password`
- Reads `type=recovery` from URL hash, calls `supabase.auth.updateUser({ password })`.

## Member (`/member/*`)

### `/member` (overview)
| Card | Source |
|---|---|
| Active subscription | `subscriptions` where `member_id = me.id and lifecycle_status in ('active','past_due')` order by created_at desc limit 1 |
| Total contributed | `member_profiles.total_contributed` |
| Next charge | `subscriptions.next_retry_at` or computed from `last_payment_attempt + 1 month` |
| Last 5 payments | `payments where member_id = me.id order by paid_at desc limit 5` |
| Active allocations | `initiative_allocations where member_id = me.id and active` join `initiatives(title)` |
| Notifications (unread) | `notifications where user_id = me.id and read = false limit 5` |

### `/member/contributions`
- `payments where member_id = me.id` join `subscriptions(monthly_amount)` join `payment_breakdowns(*)`. Paginated.

### `/member/receipts`
- `receipts` join `payments` filtered to me. Download via signed URL.

### `/member/allocations`
- Read: `initiative_allocations where member_id = me.id and active` + all `initiatives where status='active'`.
- Write: upsert rows, deactivate removed, transactional sum-check.

### `/member/profile`
- `users` self update (first/last name, phone). `member_profiles` for amount changes (triggers Peach plan update via edge fn).

## NGO (`/ngo/*`)

### `/ngo` (overview)
| Card | Source |
|---|---|
| Org status | `organizations.verification_status` for orgs in `organization_users where user_id = me.id` |
| Active initiatives | count of `initiatives where organization_id in my_orgs and status='active'` |
| Last 12mo funding | sum `allocation_results` joined to `allocation_runs.allocation_month` |
| Pending reports | `initiatives` without published `reports` in last 90 days |

### `/ngo/initiatives`
- `initiatives where organization_id in my_orgs`. CRUD with status workflow.

### `/ngo/reports`
- `reports where initiative_id in my_initiatives`. Upload to `reports` bucket.

### `/ngo/funding`
- `allocation_results` × `allocation_runs` for my initiatives, time-series chart.

## Admin (`/admin/*`)

### `/admin` (treasury)
- Aggregates from `ledger_entries` grouped by `account_type`. Daily flow chart.
- KPI cards: MRR (sum of active `subscriptions.monthly_amount`), members, NGOs, distributable backlog.

### `/admin/vetting`
- Queue 1: `organizations where verification_status = 'pending_review'` join latest `organization_verifications`.
- Queue 2: `initiatives where status = 'pending_review'`.
- Approval writes status + appends `audit_logs` (server-side).

### `/admin/payments`
- `payments` with filters (date, status, member). Drill-down shows `payment_events` history and `payment_breakdowns`.
- Action: reprocess `payment_events where processing_status = 'failed'` (edge fn).

### `/admin/users`
- `users` table with role filter. Promote to admin = insert `admin_user_roles`.

### `/admin/disputes`
- `disputes` with status filters. Resolution writes `disputes` + maybe triggers refund + `audit_logs`.

### `/admin/audit`
- `audit_logs` paginated, filterable by `actor_user_id`, `entity_type`, date range.

## Cross-cutting

### Notifications drawer
- Subscribe to `notifications` realtime channel for `user_id = me.id`.

### Currency formatting
Single util `formatMUR(n)` — never inline `Intl.NumberFormat` calls.

### Enum → label mapping
Centralized in `src/lib/enums.ts`:
- `subscription_status`, `payment_status`, `webhook_processing_status`, `organization_status`, `initiative_status`, `account_status`, `user_role`.

### Generated types
Run `supabase gen types typescript --project-id vzsifigcowusabfmnudk > src/integrations/supabase/types.ts` (Phase 1) so the client is fully typed against the real schema.
