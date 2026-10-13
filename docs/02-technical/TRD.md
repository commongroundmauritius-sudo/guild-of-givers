# Technical Requirements Document (TRD)

**Status:** Initial; stack is verified from selected repository artifacts, architecture detail remains incomplete.

## Current system overview

- React 19 and TypeScript application using TanStack Start/Router and file-based route modules.
- Vite build, Cloudflare Vite plugin, and custom worker build step.
- Supabase JavaScript client for backend communication; Supabase configuration declares Auth, PostgreSQL schemas and Storage.
- React Query provider is installed at the root route.
- Playwright is used for E2E tests.

## Architecture diagram

See [system architecture source](../diagrams/system-architecture.mmd). It is preliminary and explicitly marks live payment integration as unverified.

## Frontend

Verified root shell imports TanStack Router primitives, React Query, AuthProvider, Supabase client, toast and tooltip UI. A dynamic initiative slug route exists. Full route groups, loaders, server functions, shared design tokens, error boundaries and protected-route patterns require inventory.

## Backend and data

Supabase is the documented identity/data platform. README and project guidance describe PostgreSQL, RLS, triggers and database functions as enforcement mechanisms. Current RLS completeness, grants, function security modes and live schema are not yet verified.

## Authentication and authorization

The local Supabase config disables email confirmations for local/CI testing. Do not extrapolate this setting to production. Inspect AuthProvider, signup/login/recovery routes, database role initialization, route guards, and RLS policy definitions before describing full behavior.

## External services

- Cloudflare worker tooling is declared; deployed bindings, domains, observability and production configuration have not been inspected.
- Peach Payments is named in docs, but an existing production audit says real integration was deferred. Treat provider readiness as unverified.
- Inventory email, media, analytics and other integrations from actual call sites in the next audit pass.

## Security and privacy requirements

- Treat all client inputs and browser redirects as untrusted.
- Enforce authorization in server/database layers.
- Verify payment signatures, amount, currency, merchant reference, idempotency and replay handling before real-money launch.
- Keep secrets in deployment secret stores and document names only.
- Review PII collection, retention, deletion, logging, storage access and consent enforcement.
- Test denied access, not only successful user journeys.

## Build, test and deploy

`package.json` declares dev/build/preview/lint/format/test:e2e scripts. The build command removes `dist` and `.output`, runs `vite build`, then `scripts/build-worker.js`. Playwright uses Chromium and a configurable base URL. Build/CI reproducibility and the current workflow result must be verified by executing the project; this audit did not run tests.

## Reliability, performance and recovery

Unknown until inspected: request tracing, structured server logs, alerting, database backup policy, tested restoration, rate limiting persistence, queue/job retry policy, and deployment rollback. Existing `docs/AUDITS.md` mentions several operational concerns; treat them as historical until revalidated.

## Proposed changes (not current functionality)

1. Add an explicit release gate for payment readiness and migration parity.
2. Add a route/action/RLS authorization matrix with negative tests.
3. Standardize structured error handling for signup and payment flows.
4. Add operational runbooks for migration drift, webhook replay, billing reconciliation and rollback.
5. Establish an automated documentation validation checklist.
