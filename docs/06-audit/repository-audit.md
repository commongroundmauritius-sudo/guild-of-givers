# Repository Audit — Initial Stage

**Status:** Stage 1 initial audit  
**Audit date:** 2026-10-13  
**Branch:** `docs/repository-audit-and-technical-blueprint`  
**Scope:** Read-only review of repository files and indexed code search. No application code, database, production data, or deployment was changed. No tests were run as part of this audit.

## Evidence rules

- **Verified** means directly supported by a repository file or configuration inspected for this report.
- **Prior reported issue** means recorded in existing project documentation or recent project history; it is not proof that the issue still reproduces on the current head.
- **Assumption / unknown** means available repository evidence is insufficient to confirm the live behavior.
- **Proposed** means a recommendation, not current functionality.

## 1. Executive summary

The repository contains a CommonGround social-impact membership and organization-discovery application. The documented product direction includes recurring memberships, member allocation preferences, organization/initiative discovery, impact transparency, administrative moderation, and financial record keeping.

**Verified stack:** React 19, TypeScript, TanStack Start/Router, Vite, Tailwind CSS 4 tooling, Supabase JavaScript client, Supabase Auth/PostgreSQL/Storage configuration, and Playwright end-to-end tests. The package and Vite configuration also show Cloudflare Vite tooling and a custom worker build script.

**Important distinction:** README documentation describes Peach Payments checkout and webhook-confirmed subscription activation as the intended “golden flow.” Separate repository documentation says real Peach Payments integration was deferred and a mock payment provider remains in use. Therefore, real-money payment processing must not be represented as production-ready solely on the basis of README descriptions.

**High-priority risks to resolve:** current signup E2E reliability; source-of-truth differences between README, implementation and operational documentation; local/remote Supabase migration-history drift reported in recent project work; payment integration and webhook security before accepting real money; and a complete current-head review of route authorization, RLS, and API contracts.

## 2. Verified repository facts

| Area | Evidence | Finding |
|---|---|---|
| Repository | GitHub repository metadata | Private repository `commongroundmauritius-sudo/guild-of-givers`; default branch `main`. |
| Package | `package.json` | Package name is `tanstack_start_ts`; scripts include Vite dev/build/preview, ESLint, Prettier and Playwright. |
| UI/runtime | `package.json`, `vite.config.ts` | React 19, TanStack Start/Router, Vite, React Query and Tailwind Vite integration are declared. |
| Hosting build | `package.json`, `vite.config.ts` | Cloudflare Vite plugin is declared; build runs `vite build` followed by `scripts/build-worker.js`. Vite SSR is configured with `noExternal: true` and inline dynamic imports. |
| Backend | `supabase/config.toml`, README | Supabase project ID is configured as `vzsifigcowusabfmnudk`; Supabase Auth, PostgreSQL and Storage are part of the documented architecture. This does not verify live project health. |
| Route example | `src/routes/initiatives/$slug.tsx` | TanStack file-based route exists for initiative detail by slug and imports Supabase/React Query. |
| Root shell | `src/routes/__root.tsx` | Root route uses TanStack Router, React Query provider, AuthProvider, Supabase client, toast and tooltip UI components. |
| E2E | `playwright.config.ts` | Tests live under `tests/`; Chromium project; default base URL is localhost:8080; CI retries once and uses a 20-second test timeout. |
| Auth test config | `supabase/config.toml` | Local Supabase Auth email confirmations are disabled for local/CI signup testing. This does not establish production Auth settings. |
| Security principles | `AGENTS.md`, migration search results | Project guidance calls for backend-authoritative sensitive operations, role checks, RLS, verified webhook-only payment confirmation, and preservation of financial history. Guidance is not proof every code path complies. |
| Existing docs | `README.md`, `docs/MIGRATIONS.md`, `docs/AUDITS.md`, `GAP_ANALYSIS.md`, `docs/PRODUCTION_AUDIT_2026-09-13.md` | Several existing design/audit documents exist. They must be reconciled with current code instead of treated as automatically current. |

## 3. Product scope inferred from existing documentation

These are documented product capabilities or intended workflows; each still needs implementation-level verification during later stages.

- Membership signup and recurring subscription management.
- Organization discovery and initiative detail pages.
- Member preference/ranking for how platform allocations should be directed.
- Organization profiles, initiatives and transparency reporting.
- Admin approval/moderation and operational dashboards.
- Financial event/payment history and reporting.
- Notifications, community features and content moderation where implemented in routes/components.
- Impact attribution and campaign sharing where implemented in route and service code.

The product terminology and the exact financial model require a single approved source of truth. Existing documents use “contribution,” “donation,” “subscription,” and Peach-payment language in different contexts. Current product positioning and legal wording must be decided explicitly and reflected consistently.

## 4. Main workflows and known state

### 4.1 Signup and account creation

**Verified:** a Playwright test named `tests/e2e-signup-journey.spec.ts` is referenced by the production-validation workflow, and the test configuration runs Playwright against a local worker/base URL.

**Prior reported issue:** project history records recent failure of this journey during account creation, after earlier failures involving step transition. The current root cause has not been independently reproduced in this read-only audit. Investigate browser console/network output, Auth response, route transitions, form validation and worker logs before changing assertions.

### 4.2 Payment and subscription

**Verified:** README describes a Peach checkout/webhook flow; `docs/PRODUCTION_AUDIT_2026-09-13.md` says real Peach Payments was intentionally deferred and lists work required before real-money launch. `GAP_ANALYSIS.md` also lists payment webhooks and allocation backend work as gaps.

**Conclusion:** payment readiness is **not verified**. Determine the actual provider implementation, environment gating, subscription writes, idempotency, webhook signature verification, reconciliation and failure/retry behavior from current code before documenting an operational API contract.

### 4.3 Database migrations

**Verified:** Supabase configuration and a migrations directory are present; `docs/MIGRATIONS.md` documents the migration process.

**Prior reported issue:** project history records remote Supabase migration versions missing from the local migrations directory and a local/remote migration mismatch. The exact current difference has not been measured in this audit. Do not apply, reset, or modify the production database as part of documentation work. Establish a read-only migration inventory and compare version lists before proposing a repair.

## 5. Detected technology stack

| Layer | Detected technology | Confidence / notes |
|---|---|---|
| Language | TypeScript / JavaScript | High; package and source files. |
| UI | React 19 | High; dependency declaration. |
| Routing/full-stack framework | TanStack Start and TanStack Router | High; dependencies and route files. |
| Build tooling | Vite, Cloudflare Vite plugin, custom worker build | High; package and Vite config. |
| Styling/UI | Tailwind CSS Vite integration, Radix UI, Lucide React, custom UI components | High for declared dependencies; exact design tokens remain to be inventoried. |
| Server/data client | Supabase JavaScript client | High; dependency and source imports. |
| Data/auth/storage service | Supabase/PostgreSQL/Auth/Storage | High as configured/documented; live state not checked. |
| Client data state | TanStack React Query | High; dependency and root provider. |
| Forms | React Hook Form and resolver package | High for dependencies; usage needs code inventory. |
| Testing | Playwright | High; configuration and workflow reference. |
| Code quality | ESLint and Prettier | High; package scripts. |
| Deployment target | Cloudflare worker/runtime appears intended | Medium-high; build tooling is present, but deployed production configuration was not checked. |
| Payments | Peach described, real integration deferred in existing audit | Current implementation must be inspected; do not assume Peach is active. |

## 6. Architecture summary

The repository indicates a file-routed React/TanStack application with a shared root shell and Supabase client access. Supabase is intended to provide authentication and PostgreSQL persistence, with RLS/database functions/triggers enforcing trusted business rules. Vite builds the application and invokes a custom worker build step.

```mermaid
flowchart TD
  Visitor[Public visitor / member / organization / admin] --> UI[React UI and TanStack file routes]
  UI --> Query[React Query and Supabase client]
  UI --> AppServer[TanStack Start server / Cloudflare worker build]
  Query --> SupabaseAuth[Supabase Auth]
  Query --> DB[(Supabase PostgreSQL)]
  AppServer --> DB
  DB --> RLS[RLS policies, triggers and database functions]
  Payment[Payment provider - actual live integration unverified] -. webhook / payment events .-> AppServer
  AppServer --> Ledger[Payment and financial history - schema/flow to verify]
```

The diagram intentionally marks the payment provider as unverified. Later TRD work must refine this diagram from concrete server functions, edge functions, migrations, and call sites.

## 7. User roles and permissions

Existing project guidance/documentation names members, organizations, admins and role-based access via `user_roles`. Current implementation details must be verified across route guards, database policies and server operations.

Audit requirements for later stages:
- Enumerate role values and their canonical source.
- Map each protected route and action to its authorization check.
- Confirm a user cannot grant their own role or write another user's organization/member data.
- Review public reads separately from authenticated reads and writes.
- Verify role initialization trigger behavior and account deletion/role cleanup.
- Compare application-level checks with database RLS; client-side hiding alone is insufficient.

## 8. Database entities and relationships — preliminary only

Existing README/search evidence names `auth.users`, `profiles`, `user_roles`, `subscriptions`, `payments`, `payment_events`, `financial_events`, `initiatives`, and `financial_accounts`. Other schema entities likely exist, but this list is not a complete schema inventory.

No production schema has been queried for this report. Table columns, constraints, indexes, foreign keys, triggers, RLS policies and live migration status remain **unverified**. The database documentation stage must reconstruct these from every relevant migration and generated Supabase types, then label any production comparison unavailable.

## 9. External integration points

- **Supabase:** Auth, database and storage are configured/documented. Production configuration and access policy state were not inspected.
- **Cloudflare:** build plugin and worker build script are declared. Live deployment, bindings and environment configuration were not inspected.
- **Peach Payments:** described in documentation, but real integration is explicitly described as deferred in an existing production audit. Treat as not launch-ready until code and provider configuration prove otherwise.
- **Email/notifications/analytics:** inventory actual call sites and environment variable names in later stages; no completeness claim is made here.

Secrets, access tokens and production credentials are intentionally excluded.

## 10. Major risks and recommended priorities

| Priority | Risk / gap | Why it matters | Next verification |
|---|---|---|---|
| P0 | Real payment readiness unclear / Peach integration previously deferred | Risk of incorrect subscription activation, duplicate charges, or false payment status | Trace provider abstraction, server endpoints/functions, webhook validation, idempotency and reconciliation. Keep real-money processing disabled until verified. |
| P0 | Signup E2E has recent reported failures | Core onboarding may be broken or test environment may not match the flow | Re-run the exact CI workflow and inspect trace, console, network, worker and Supabase Auth responses. |
| P0 | Remote/local migration drift previously reported | Deployments and clean database setup can fail or diverge | Compare local migration filenames with remote migration history using read-only access; do not reset or push changes during audit. |
| P1 | Existing documentation may be stale or contradictory | Engineers may implement against intended rather than actual behavior | Mark every claim verified/inferred/proposed and reconcile README, audits, gap analysis and source. |
| P1 | Authorization coverage not yet mapped end-to-end | RLS gaps or route-level omissions could expose private/financial data | Build route/action-to-role-to-policy matrix and test negative access cases. |
| P1 | API/server-action inventory incomplete | Client contracts and error behavior may be undocumented | Search route handlers, server functions, Supabase functions, RPC calls and webhooks. |
| P1 | Financial data invariants need full verification | Audit history must remain trustworthy and consistent | Trace financial tables, deletion behavior, transaction boundaries and append-only controls. |
| P2 | Accessibility and responsive design not yet systematically audited | Users may encounter barriers across screens | Inventory tokens/components, run automated checks, and manually review keyboard/focus/contrast. |
| P2 | Observability/recovery not confirmed | Signup/payment incidents may be hard to diagnose | Inventory logs, error reporting, alerting, backup/restore evidence and incident procedures. |

## 11. Incomplete, duplicated or inconsistent documentation signals

1. The README describes Peach as the payment provider and presents the webhook golden flow; the September production audit says real Peach is deferred.
2. `GAP_ANALYSIS.md` describes allocation and payment work as gaps; those statements need comparison with current implementation and newer commits.
3. Historical audit documents may describe prior migration or CI states. They should be treated as historical until revalidated.
4. Project terminology varies between contribution, donation, membership and subscription. This is both a product/documentation consistency issue and a legal/compliance decision.
5. No complete route/API/schema inventory has yet been established in this audit.

## 12. Unresolved decisions and missing evidence

- Is the canonical product currently CommonGround, or is the planned Citizen+ rebrand in scope for this documentation? This audit preserves the repository's current CommonGround terminology.
- What exact membership tiers, benefits, allocation rules, and Impact Pool rules are approved product requirements versus proposed business changes?
- Is Peach integration still deferred on the current branch, and is any real-money path enabled in any environment?
- Which Cloudflare environment is authoritative for production, and where are bindings/secrets configured (names only; never values)?
- Can the connected Supabase project's migration history and schema be inspected read-only for comparison? Until then, live schema status is unknown.
- Which existing audit/gap documents remain authoritative, and which are historical?
- What are the approved retention, deletion, refund, cancellation, receipt and financial-reconciliation policies?

## 13. Validation record

| Check | Status | Notes |
|---|---|---|
| Repository metadata | Complete | Private repo; default branch `main`. |
| Package manifest | Partial | Core dependencies/scripts inspected; full dependency-to-code usage audit remains. |
| Main Vite configuration | Complete for initial stack detection | `vite.config.ts` inspected. |
| Root route | Partial | Opening section and provider imports inspected; full root behavior remains to review. |
| Representative dynamic route | Partial | Initiative slug route discovered through code search. |
| Supabase config | Complete for visible local config | Does not establish production configuration or live health. |
| Playwright config/workflow | Partial | Test config inspected; workflow and failure trace need full review. |
| Migrations/schema/RLS | Partial | Search evidence only; complete inventory and live comparison outstanding. |
| Tests executed | Not performed | No claim of successful test execution. |
| Application run/deployment checked | Not performed | No claim that the application or production environment was run. |
| Production data inspected | Not performed | No production data was read or changed. |

## 14. Stage 1 exit criteria

Stage 1 is an initial audit, not a complete reverse-engineering sign-off. Before declaring the repository audit final:
- inventory every route and screen;
- inspect server routes/actions, Supabase Edge Functions, migrations, generated database types and RLS policies;
- inspect CI workflows and the latest signup E2E trace;
- map role checks and sensitive operations;
- compare actual implementation against existing audit/gap documents;
- verify diagram accuracy against discovered call paths.

**Next stage:** generate the PRD and stable requirement inventory, preserving verified, inferred and proposed behavior as separate categories.


## 10. Expanded source-tree inventory (2026-10-13)

A recursive Git tree of `main` returned **48 route modules**, **274 SQL migration files**, and **13 files under `tests/`**. The complete route/test lists and recent migration tail are recorded in [repository inventory](repository-inventory.md). These are repository file counts, not production route counts, schema-table counts or test coverage. Route file paths must be mapped to browser URLs using TanStack's generated route tree and module metadata.

## 11. Directly verified signup/payment implementation findings

The current source files inspected after the initial draft provide stronger evidence than the historical audit notes:

1. `src/routes/signup.tsx` sends a membership amount, fee-cover flag, phone, role, and `payment_transaction_id` in Supabase Auth user metadata after the mock checkout step.
2. `src/lib/payments/mock-provider.ts` creates a test payment intent by calling the Supabase RPC `create_test_payment_intent`. The mock provider is the selected provider exported from this module.
3. `src/lib/payments/webhook-handler.ts` contains a production note that signature verification still needs implementation. Its non-development check only tests for a configured `VITE_PAYMENT_WEBHOOK_SECRET` and whether a signature string is present; it does not perform cryptographic verification. It also logs an event insertion failure and continues processing. **This implementation must not be treated as production-safe Peach webhook verification.**
4. `supabase/migrations/20261008200025_diagnose_signup_payment_metadata.sql` raises a detailed error when a pending test payment intent cannot be matched by transaction ID, pending status, test flag and normalized email.
5. `supabase/migrations/20261008202215_remove_duplicate_signup_trigger_and_store_phone.sql` makes `handle_new_user()` insert/update the profile and role, then calls `finalize_test_signup_payment` when subscription/payment metadata is present. It requires a non-empty payment transaction ID and a subscription amount in the allowed range.
6. `supabase/migrations/20261008200000_fix_user_signup_activity_trigger.sql` explicitly describes itself as fixing signup failures caused by the hardened public-activity validator. This shows a recent signup-trigger regression was addressed in migration history, but does not prove whether the current CI failure is fixed.

### Signup root-cause status

The exact failing CI attempt has not been executed or its current job logs retrieved in this pass. Therefore **the current failure's root cause remains unconfirmed**. The best next diagnostic is to inspect the failed job's full error diagnostic and Supabase/Postgres logs for the precise Auth signup response. In particular, determine whether the Auth response includes a database-trigger error from `handle_new_user()`, a failed payment-intent match, or an activity trigger. Do not weaken validation or grant public execution on the finalization function to make the test pass.

### Immediate security gate

Keep real Peach processing disabled until the payment implementation has actual provider-specific cryptographic signature verification, amount/currency/merchant-reference checks, idempotent event handling, and trusted server-side secret management. A client-exposed `VITE_*` variable is not an appropriate place for a secret.


## 12. CI log evidence recovered for signup failure (run 37784478752)

The actual GitHub Actions job log for [run 37784478752 / job 113335589925](https://github.com/commongroundmauritius-sudo/guild-of-givers/actions/runs/37784478752/job/113335589925) was retrieved and inspected. This materially narrows the diagnosis for **that specific run**:

- The failure occurred at the *first* step transition, before entering details, payment, or Auth signup.
- Playwright remained on `/signup` with only the “Monthly Membership” heading after clicking “Start my monthly impact”.
- The browser recorded 404 responses for built assets including `/assets/index-BJBRaIVL.js`, `/assets/styles-SYFMdg-D.css`, `/assets/logo-B2qccutl.png`, and `/favicon.svg`.
- Since the JavaScript bundle itself returned 404, the client-side React click handler could not reliably run. For this run, the immediate failure is therefore **the preview/static-asset serving or build-output path**, not a signup database trigger or payment-intent validation error. The database path was never reached in that attempt.
- The same job shows that the production build, worker-output checks and test build completed before the Playwright failure.

### What changed in later workflow source

The current `.github/workflows/production-validation.yml` in `main` has since introduced a dedicated signup preview on port 8081, isolated local Supabase startup/reset, and a signup-only E2E step before the general 8080 preview. This is a plausible mitigation for test isolation and asset-root mismatch, but source inspection alone does not prove that it fixed the latest run.

### Important distinction

A later report described the test reaching “Create your account” and failing after the account button. That is a different observed failure stage and must be diagnosed from its own job log/SHA. Do not attribute that later symptom to the 404 root cause from run 37784478752 without retrieving the corresponding run log. The current status of the newest signup run remains **not verified in this pass**.

### Correct next action

1. Fetch the most recent run for the current `main` SHA and identify the exact signup E2E job.
2. If it fails at step 1, inspect preview logs, the generated `dist/client/wrangler.json`, and whether every asset referenced by the HTML exists under the configured static asset directory.
3. If it reaches account creation, inspect the captured `/auth/v1/signup` response body and local Supabase Postgres logs for the trigger exception.
4. Only change code after the failing stage and error are tied to the same commit and run.


## 13. Latest CI run diagnosis: migration syntax error blocks signup test (2026-10-13)

The latest `main` Production Validation run inspected during this pass is [38379270729](https://github.com/commongroundmauritius-sudo/guild-of-givers/actions/runs/38379270729), commit `d82fcff4792673c3d1871e6084e4d4f3b6e0c206`. Its job fails at **Start isolated local Supabase for signup E2E**, during `supabase db reset`, before the signup browser test runs.

The log names `supabase/migrations/20260529175732_consolidate_partner_application_system_v3.sql` and reports:
`ERROR: syntax error at or near "$" (SQLSTATE 42601)`, at the second DO block's `DO $` delimiter. The block closes with `END $;`. PostgreSQL dollar-quoted DO blocks require matching `$$` delimiters here. This is a reproducible source-level syntax defect evidenced by the CI log, and it blocks local migration replay; it is distinct from the earlier asset-404 browser failure in run 37784478752.

A separate draft fix is proposed in [PR #122](https://github.com/commongroundmauritius-sudo/guild-of-givers/pull/122), correcting only the opening and closing dollar-quote delimiters of that block. It does not change the data migration logic. **Do not consider the fix verified until CI successfully completes `supabase db reset` and proceeds through the signup E2E.** No production database was touched.

### CI sequence observed

- Production worker build and self-contained-worker checks passed in run 38379270729 before the migration reset step.
- The migration reset failed before Playwright signup ran, so that run gives no new evidence about current Auth trigger correctness.
- Docker image pulls initially reported rate limits, but the log proceeded to start the database and apply migrations; the terminal blocker was the SQL syntax error above, not the transient image pull messages.


## 14. Role-routing review and signup-role risk

A targeted inspection of the current route modules confirms:

- `src/routes/_authenticated.tsx` redirects unauthenticated users to `/login`.
- `src/routes/_authenticated/admin-dashboard.tsx` renders the administrative outlet only for `admin` or `super_admin`; other signed-in roles are sent to `/dashboard`.
- `src/routes/_authenticated/dashboard.tsx` routes administrators to `/admin-dashboard`, organization users to `/organization`, and other resolved roles to `/member`.
- The member and organization dashboards have client-side role gates and query enablement checks. These checks must be backed by RLS/server authorization, not treated as the security boundary.

### Potential organization signup role mismatch — verify before fixing

The latest inspected `handle_new_user()` definition in `supabase/migrations/20261008202215_remove_duplicate_signup_trigger_and_store_phone.sql` inserts a `member` row into `user_roles` unconditionally. Meanwhile, `src/routes/signup.tsx` constructs `role: "organization"` for partner-code signup metadata. The inspected trigger excerpt does not use that metadata role when assigning `user_roles`.

This is a **source-level discrepancy and a high-priority verification item**, not yet a confirmed end-user defect: another trigger or subsequent trusted process may assign or transform the organization role. Before changing it, inspect the full trigger set and partner conversion flow, then add tests proving (a) member signup receives only intended member privileges and (b) converted organization signup receives the organization role without self-assignable privilege escalation. Never trust a client-supplied role blindly inside a security-definer trigger.
