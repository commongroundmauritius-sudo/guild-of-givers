# Architecture Reference

**Status:** Preliminary; source-derived, not a complete call-graph audit.

## Verified components

- **UI:** React 19 with TypeScript and TanStack file-based routes.
- **Application framework:** TanStack Start/Router.
- **Client cache:** TanStack React Query provider in root route.
- **Backend client:** Supabase JS client.
- **Identity/data:** Supabase Auth/PostgreSQL/Storage configured or documented.
- **Build/deployment tooling:** Vite, Cloudflare Vite plugin and custom worker build script.
- **Tests:** Playwright.

## Trust boundaries

1. Browser input and local state are untrusted.
2. Supabase Auth identifies a session; authorization must still be enforced by route/server logic and RLS.
3. Payment redirects are not proof of payment.
4. Provider webhooks must be authenticated and processed idempotently before changing subscription state.
5. Financial history requires explicit access and mutation controls.

## Current unknowns

Exact TanStack server functions, Supabase Edge Functions, API route handlers, trigger/function inventory, deployed Cloudflare bindings, queue/scheduler implementation, live migration parity and actual payment provider code.

## Proposed architecture practices

- Keep financial/subscription state changes in trusted backend/database paths.
- Make webhook event processing idempotent using a provider event/reference unique constraint.
- Log correlation IDs without secrets or full payment credentials.
- Document each server operation with caller role, input validation, DB effects and failure semantics.
- Maintain migration compatibility and avoid destructive production operations without an approved migration/rollback plan.
