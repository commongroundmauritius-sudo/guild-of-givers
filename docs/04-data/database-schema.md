# Database Schema

**Status:** Reconstructed only at entity-name level; not verified against live production schema.

## Sources inspected

- `supabase/config.toml`
- `README.md`
- `docs/MIGRATIONS.md`
- Search excerpts from `supabase/migrations/`
- `src/integrations/supabase/types.ts`

## Entities evidenced in repository documentation/search

| Entity | Evidence | Purpose (documented/inferred) | Schema status |
|---|---|---|---|
| `auth.users` | README | Supabase identity | Exact live columns managed by Supabase; not queried. |
| `profiles` | README, migration/type search | Application profile | Columns/constraints not yet inventoried. |
| `user_roles` | README, AGENTS.md/search | Role assignments | Role values, keys and policies need inspection. |
| `subscriptions` | README and security migration search | Membership/subscription state | Schema and transition logic need inspection. |
| `payments` | README/AGENTS.md | Payment records | Immutability, references and constraints need inspection. |
| `payment_events` | README | Provider event archive | Existence/current schema and idempotency constraints need inspection. |
| `financial_events` | Admin finance route search | Financial event ledger/reporting | Columns/relationships/RLS need inspection. |
| `financial_accounts` | Admin finance route search | Financial account metadata | Columns/relationships/RLS need inspection. |
| `initiatives` | Route search and generated types context | Impact initiative records | Full columns, ownership and publication rules need inspection. |

This list is intentionally incomplete. Do not use it as a migration plan or claim that it matches production.

## Schema inventory procedure

1. Enumerate every migration in timestamp order.
2. Extract table/view/materialized view definitions, columns, defaults, checks, indexes, FKs, triggers, functions, grants and RLS policies.
3. Compare to generated Supabase TypeScript types and all query call sites.
4. Compare local migration versions with remote migration history using read-only inspection.
5. If production schema cannot be inspected, state that the schema is repository-reconstructed only.
6. For every proposed schema change, document forward migration, backfill, compatibility window, verification query and rollback strategy.

## Security notes

Financial and membership tables need explicit ownership and mutation rules. Confirm policies apply to SELECT/INSERT/UPDATE/DELETE separately; review SECURITY DEFINER functions, grants and role escalation paths. Do not execute destructive migrations during this audit.
