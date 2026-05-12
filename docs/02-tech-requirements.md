# Technical Requirements

## 1. Stack

| Layer | Choice |
|---|---|
| Frontend | React 19 + TanStack Start v1 (file-based routing, SSR-ready) + Vite 7 |
| Styling | Tailwind v4 (`src/styles.css` semantic tokens) + shadcn/ui |
| State / data | TanStack Query, Supabase JS client |
| Backend | Supabase (Postgres + Auth + Storage + Edge Functions) |
| Payments | Peach Payments (sandbox → live) |
| Email | Resend (transactional + receipts) |
| Hosting | Cloudflare Workers via current TanStack Start template |
| Auth | Supabase Auth: email/password + Google OAuth |

## 2. Frontend architecture
- File-based routes under `src/routes/`, no `pages/` folder.
- Pathless layout `_authenticated/` with `beforeLoad` redirect to `/login`.
- Three role-scoped layouts under `_authenticated/`: `_authenticated/member/`, `_authenticated/ngo/`, `_authenticated/admin/`. `/dashboard` redirects to the right one based on `users.role`.
- Each route declares `head()` with unique title/description/og — no metadata inheritance from index.
- Data fetching via TanStack Query keyed by table+filter; mutations invalidate keys.
- All currency rendered through a single formatter (`formatMUR`).

## 3. Backend / Supabase
- **Single Supabase project**: `https://vzsifigcowusabfmnudk.supabase.co` (existing). Frontend uses the published anon key only.
- Edge functions (later phases): `peach-webhook`, `peach-create-checkout`, `monthly-billing`, `allocation-run`, `generate-receipt`, `notify`.
- Storage buckets: `receipts` (private), `reports` (private to NGOs + admin, public on publish), `avatars` (public), `initiative-media` (public), `org-docs` (private).
- All tables RLS-enabled. No table is queryable from the browser without a policy.
- `has_role(uuid, user_role)` and `has_admin_permission(uuid, text)` security-definer functions to avoid recursive RLS.

## 4. Security baselines
- Service-role key only in edge functions, never in client.
- Peach webhook verifies HMAC signature before any DB write.
- All admin actions write to `audit_logs` (server-side, in the same transaction as the action).
- Input validation with Zod on every edge function and server fn.
- Leaked-password protection (HIBP) enabled in Supabase Auth.
- Row Level Security policy matrix documented in `05-backend-schema.md`.

## 5. Performance
- Public pages SSR'd, cached at the edge.
- Dashboard data fetched in parallel; show skeletons.
- Indexes on hot paths: `payments(member_id, paid_at)`, `initiative_allocations(member_id) where active`, `payment_events(provider_event_id)` (already unique), `allocation_results(initiative_id, allocation_run_id)`.

## 6. Observability
- Edge function logs (Supabase).
- Frontend error boundary already in `__root.tsx` — wire to a logger later.
- `audit_logs` is the source of truth for who did what.

## 7. Environments
- **Dev** — local Vite + shared Supabase project (sandbox Peach).
- **Staging** — preview deploy on Cloudflare, same Supabase project, sandbox Peach.
- **Prod** — production Cloudflare deploy, same Supabase project (separate prod project recommended once we go live), live Peach credentials.

## 8. i18n & a11y
- English first, FR strings extracted into a single locale file (deferred).
- Number/date format via `Intl.NumberFormat('en-MU', { currency: 'MUR' })`.
- Color contrast ≥ 4.5:1 against cream background.
- Keyboard nav, focus rings on every interactive element.

## 9. Testing (later phase)
- Vitest for utilities (allocation math, currency).
- Playwright smoke for signup → checkout sandbox → dashboard.
