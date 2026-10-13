# API and Server-Operation Specification

**Status:** Inventory not complete. This document deliberately does not fabricate endpoint paths or payloads.

## Verified integration surfaces

| ID | Surface | Evidence | Current contract status |
|---|---|---|---|
| API-001 | Supabase Auth/client | Supabase client imports and local Supabase config | Exact calls, payloads and error handling not yet inventoried. |
| API-002 | Supabase database queries/RPC | Supabase client imports, migrations and generated types are present | Table/RPC call inventory incomplete. |
| API-003 | TanStack Start server operations | Framework and server entry are configured | Specific server functions/routes must be discovered before documenting contracts. |
| API-004 | Payment provider/webhook | Described in README and audit docs | Real provider endpoint and current implementation unverified; do not assume live Peach endpoint exists. |
| API-005 | Supabase Storage | Storage enabled in local config | Buckets, policies, upload rules and access patterns unknown. |

## Required inventory per operation

For each discovered operation record: stable ID; file and exported function; HTTP method/path only if it is truly HTTP; auth and role requirements; validated request shape; response shape; status/error semantics; database reads/writes; transaction/idempotency behavior; external side effects; and linked tests.

## Proposed API contract controls

- Validate all inputs on trusted server boundaries.
- Return consistent, non-sensitive errors.
- Ensure authorization checks occur before data mutation.
- Use idempotency for payment-related writes.
- Never log credentials, access tokens, or full card data.
- Generate OpenAPI only for confirmed HTTP endpoints. Server functions and direct Supabase calls should be documented according to their actual mechanism, not relabelled as REST endpoints.

## Confirmed signup and payment call sites (source inspection)

| ID | Source | Confirmed behavior | Contract/security note |
|---|---|---|---|
| API-006 | `src/hooks/use-auth.tsx` | `signUp` calls `supabase.auth.signUp({ email, password, options: { emailRedirectTo, data: metadata } })`. | Auth returns an error/data object; the caller must not assume profile/role/payment finalization succeeded unless the trigger transaction succeeds. |
| API-007 | `src/routes/signup.tsx` | Signup first creates a lead, calls `paymentService.startPayment`, then calls Auth signup with membership metadata including `payment_transaction_id`. | Exact current failing CI cause remains unknown. Inspect Auth response and database trigger logs. |
| API-008 | `src/lib/payments/mock-provider.ts` | Mock payment initialization calls RPC `create_test_payment_intent` with normalized email, amount, fee-cover flag and source initiative. | This is a test/mock provider path, not Peach Hosted Checkout. |
| API-009 | `supabase/migrations/20261008200025_diagnose_signup_payment_metadata.sql` | `finalize_test_signup_payment` matches a pending test intent by transaction ID, test flag and normalized email, then records simulated payment/subscription state. | Execution is revoked from public/anon/authenticated and granted to postgres in this migration. Confirm live grants match current migration state before relying on it. |
| API-010 | `src/lib/payments/webhook-handler.ts` | Handler inserts an event, parses it through the mock provider, and calls the subscription engine. | Current signature check is a placeholder, not cryptographic verification. Logging failure does not stop processing. Do not expose as a production Peach endpoint. |

These are source-file observations, not a complete API catalog. Do not label the test intent RPC as a real payment-provider contract.
