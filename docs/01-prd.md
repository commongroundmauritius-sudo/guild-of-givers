# Product Requirements

## 1. Vision
A trusted civic-finance and transparency platform where individuals fund vetted initiatives through a single recurring membership, with full visibility into allocation and impact.

## 2. Objectives
1. Trusted contribution ecosystem.
2. Frictionless member onboarding.
3. Automated subscriptions, retries, receipts.
4. Transparent allocation tracking (per member and aggregate).
5. NGO funding and reporting workspace.
6. Admin governance + auditability.
7. Scalable foundation (modular, API-first).

## 3. Personas & permissions

### Guest
- Browse landing, About, Initiatives, Transparency.
- Sign up.

### Member (`user_role = 'member'`)
- Maintain subscription (`subscriptions`).
- Set per-initiative allocation %s (`initiative_allocations`).
- View `payments`, `payment_breakdowns`, `receipts`, `notifications`.
- Update profile.

### NGO / Initiative Manager (`user_role = 'ngo'`, linked via `organization_users`)
- Create / edit `initiatives` for their `organizations`.
- Upload `reports`.
- See `allocation_results` for their initiatives.
- Submit verification docs (`organization_verifications`).

### Admin (`user_role = 'admin'`, sub-permissions via `admin_user_roles` + `permissions`)
- Vet NGOs and initiatives.
- Monitor `payments`, `payment_events`, treasury (`ledger_entries`).
- Trigger / review `allocation_runs`.
- Manage `disputes`, read `audit_logs`, broadcast `notifications`.

## 4. Feature inventory

### 4.1 Auth
- Email/password, Google OAuth (Lovable Cloud / Supabase Auth).
- Email verification.
- Password reset (`/reset-password` route required).
- Optional invite via `account_setup_tokens` (admin-issued for NGOs / staff).
- Role-based routing (`/member`, `/ngo`, `/admin`).

### 4.2 Membership
- Choose monthly amount (MUR), optional cover-fees toggle.
- Create `subscriptions` row (`lifecycle_status = pending_payment`).
- Peach checkout → first `payments` row → on success activate subscription, create `member_profiles` row.
- Manage: change amount, pause, cancel, view next charge.
- Failed-payment retry + grace period (`retry_count`, `next_retry_at`, `grace_period_ends_at`).

### 4.3 Contributions & allocation
- Members set allocation %s per initiative (sum = 100%).
- Each successful `payments` row: `payment_breakdowns` is computed (MCB/VAT/Peach fees, reserve, platform margin, impact pool, distributable, net profit).
- Monthly `allocation_runs` consume the impact pool, write `allocation_results` per initiative + `allocation_snapshots` per member.
- `initiatives.current_received_amount` updated; double-entry posted to `ledger_entries` via a `transaction_groups` row.

### 4.4 Receipts
- One `receipts` row per `payments` row (PDF stored in `receipts` bucket, emailed via Resend).

### 4.5 NGO portal
- Apply → admin reviews `organization_verifications` → on approval, `organizations.verification_status = verified`.
- Create draft initiatives → submit for review → admin approves → status `active`.
- Upload `reports`, mark `published`.
- View funding dashboard (sum of `allocation_results` over time).

### 4.6 Admin / governance
- Vetting queue (orgs + initiatives).
- Treasury view (ledger balances, daily flows).
- Payments monitor + ability to reprocess `payment_events`.
- Disputes workflow.
- Audit log viewer.
- Manual notification broadcast.

### 4.7 Transparency (public)
- Aggregate stats: total raised, count of members, count of initiatives, distributable to date.
- Per-initiative page: amount received, published reports, latest update.

## 5. Functional requirements (selected)

| ID | Requirement |
|---|---|
| AUTH-001 | Email/password signup creates `auth.users` + `users` + `member_profiles` rows transactionally. |
| AUTH-002 | Email verified before subscription checkout. |
| AUTH-003 | `/reset-password` route consumes Supabase recovery token. |
| AUTH-004 | Roles read from `users.role`; admin sub-perms from `admin_user_roles`. |
| SUB-001 | One active `subscriptions` row per member. |
| SUB-002 | Peach webhook idempotent on `payment_events.provider_event_id`. |
| SUB-003 | Failed payment increments `retry_count`, schedules `next_retry_at`. |
| PAY-001 | Every successful `payments` row produces a `payment_breakdowns` and a `receipts` row. |
| ALLOC-001 | Sum of a member's active `initiative_allocations.allocation_percentage` = 100. |
| ALLOC-002 | `allocation_runs` are immutable once `executed`. |
| GOV-001 | Every admin write produces an `audit_logs` row. |

## 6. Non-functional
- HTTPS only, RLS on every table, signed webhooks, no service-role key in browser.
- Dashboard < 3s on mid-tier mobile; lazy-load charts.
- WCAG AA on public pages and member dashboard.
- Daily DB backup (Supabase managed).
- Observability: edge function logs + Sentry-class error capture (later phase).

## 7. Success metrics
- Activation: % of signups that complete first payment.
- Retention: month-3 active members / month-1 active members.
- Recurring MUR/month.
- NGO satisfaction (qualitative + payout SLA hit rate).
- Time-to-vet new NGO.
