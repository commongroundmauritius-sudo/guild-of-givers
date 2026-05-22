## Goal

Recreate the CommonGround frontend to match the reference site (https://commonground-mauritius.lovable.app) and wire it to your existing Supabase backend at `https://vzsifigcowusabfmnudk.supabase.co` using the anon key you provided. Add auth and role-based routing to placeholder dashboards.

## Design language (from reference)

- Warm off-white background (`#F7F3EC` style cream), deep forest green primary (`#0F3D2E`), soft ivory cards, subtle borders.
- Typography: large serif/semi-serif display headings, clean sans body. Generous spacing, rounded pill CTAs.
- Hero: stacked layered card frames around hero image (meeting room).
- Sections separated by gentle dividers and small uppercase kicker labels ("PROCESS", "FAQ", etc.).

These tokens go in `src/styles.css` as semantic CSS variables — no hardcoded colors in components.

## Routes (TanStack file-based)

```text
src/routes/
  __root.tsx              # shared header + footer + providers
  index.tsx               # Home: hero, How It Works, Why CG, Initiatives, For Orgs, FAQ, CTA
  about.tsx               # About / mission
  initiatives.tsx         # Long-term programs list (reads `initiatives` table if present)
  for-orgs.tsx            # Pitch for organizations
  partner.tsx             # Organization partner application form
  faq.tsx                 # Standalone FAQ page
  legal.tsx               # Legal / terms / privacy
  login.tsx               # Email/password + Google sign-in
  signup.tsx              # Multi-step Become a Member (Amount → Details → Payment → Done)
  _authenticated.tsx      # Auth gate (redirect to /login if no session)
  _authenticated/dashboard.tsx     # Router: sends user to member/organization/admin dashboard by role
  _authenticated/member.tsx        # Member dashboard placeholder
  _authenticated/organization.tsx           # Organization dashboard placeholder
  _authenticated/admin.tsx         # Admin dashboard placeholder
```

Each route gets its own `head()` with unique title + meta description + og tags (SEO).

## Components

- `components/site/Header.tsx` — logo, primary nav (About, Initiatives, For Orgs, Partner With Us, FAQ, Legal, Log in), "Become a Member" CTA, mobile drawer.
- `components/site/Footer.tsx` — links, brand, copyright.
- `components/site/HeroSection.tsx`, `HowItWorks.tsx`, `WhyCommonGround.tsx`, `InitiativesPreview.tsx`, `ForOrgs.tsx`, `FAQAccordion.tsx`, `FinalCTA.tsx`.
- Reuse shadcn primitives already in `src/components/ui/`.
- Hero image generated via `imagegen` (bright plant-filled meeting room) → `src/assets/hero-room.jpg`.
- "For Orgs" image generated → `src/assets/orgs-boardroom.jpg`.

## Backend wiring

- Use your existing Supabase project. I'll write `VITE_SUPABASE_URL=https://vzsifigcowusabfmnudk.supabase.co` and `VITE_SUPABASE_PUBLISHABLE_KEY=<your anon key>` into the generated `@/integrations/supabase/client`.
- **Note**: this connects via the public browser client only. Anything requiring service-role (admin queries, secrets) would need that project's service role key as a secret — out of scope for this turn.

## Auth + roles

- `useAuth` hook with `onAuthStateChange` listener (set up BEFORE `getSession`) exposing `{ user, session, role, loading, signIn, signUp, signInWithGoogle, signOut }`.
- Role detection assumes the standard pattern: a `user_roles` table with `app_role` enum (`admin | organization | member`) and a `has_role(_user_id, _role)` security-definer function. On login, query `user_roles` for `auth.uid()`; default to `member` if no row. (If your existing schema uses a different shape, tell me on plan review and I'll adjust — I won't create tables in your live DB.)
- `_authenticated.tsx` uses `beforeLoad` to redirect to `/login` when no session.
- `/dashboard` reads the role from context and `redirect()`s to `/member`, `/organization`, or `/admin`.

## Out of scope this turn

- Real member dashboard data (subscriptions, allocations, receipts) — placeholders only.
- Payment integration on signup (UI flow only, no Stripe yet).
- Creating/altering DB tables. If `user_roles` doesn't exist in your project, I'll surface that and we'll decide whether to add a migration next turn.

## Deliverable

A pixel-feel-close marketing site with working auth, Google login, role-aware redirects, and three placeholder dashboards — ready to layer real data onto next.
