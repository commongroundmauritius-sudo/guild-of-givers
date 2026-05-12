# Open Decisions

I need answers to these before Phase 1 starts. Each has a default I'll assume if you don't override.

| # | Decision | Options | My default |
|---|---|---|---|
| 1 | Role source of truth | (a) `users.role` only; (b) `users.role` + `admin_user_roles` for admin sub-perms | **(b)** — matches existing schema |
| 2 | Currency / locale | MUR only / MUR+USD display / MUR+EUR | **MUR only**, `en-MU` |
| 3 | Peach Payments env | Sandbox now, live later | **Sandbox first**, you provide credentials when Phase 2 starts |
| 4 | Peach webhook host | (a) Supabase Edge Function on existing project; (b) Cloudflare Worker `/api/public/peach-webhook` in this app | **(b)** — keeps server logic in TanStack Start |
| 5 | Supabase project | (a) Keep `vzsifigcowusabfmnudk`; (b) Migrate to Lovable Cloud-managed project | **(a)** — already has the schema |
| 6 | Member signup mode | (a) Open self-signup + email verify; (b) Invite-only via `account_setup_tokens`; (c) Both (open for members, invite for NGO/staff) | **(c)** |
| 7 | Allocation model | (a) Member-driven %s only; (b) Pool + admin-driven monthly run only; (c) Both — member %s drive a monthly run | **(c)** — schema already supports it |
| 8 | NGO onboarding | (a) Self-serve apply → admin verify; (b) Admin-invite only | **(b)** for v1, switch to (a) post-launch |
| 9 | Governance v1 | Admin-only, no member voting | **Admin-only** |
| 10 | Email provider | Resend / Postmark / SES | **Resend** (best Lovable Cloud DX) |
| 11 | Receipt numbering | Sequential global / per-year reset | **Per-year reset** (`R-2025-000123`) |
| 12 | Fee handling | Always absorbed by platform / member can opt to cover | **Member opt-in to cover** (`payments.processor_fee_covered`) |
| 13 | Allocation min/max % | Any whole number 0–100, sum=100 / minimum 5% per initiative | **Whole numbers, sum=100, no minimum** |
| 14 | Public transparency depth | Aggregate only / aggregate + per-initiative monthly / full ledger | **Aggregate + per-initiative monthly** |
| 15 | Existing DB data | Empty / has test rows / has real data | **Need confirmation** — I won't run destructive migrations until you tell me |

Reply with overrides as `1=a, 4=a, 5=b, ...` or just say "all defaults".

Once these are locked, I rewrite `.lovable/plan.md` for Phase 1 and start building.
