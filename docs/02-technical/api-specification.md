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
