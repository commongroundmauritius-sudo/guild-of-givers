# Data Dictionary

**Status:** Preliminary; full field-level dictionary requires complete migration and generated-type inspection.

| Entity | Fields / types | Constraints / purpose |
|---|---|---|
| `auth.users` | Supabase-managed; not enumerated | Identity and authentication; exact managed schema not reproduced here. |
| `profiles` | Unknown in this audit | Inspect migrations and `src/integrations/supabase/types.ts`. |
| `user_roles` | Unknown in this audit | Determine role enum/text values, unique constraints, foreign keys and who may write rows. |
| `subscriptions` | Unknown in this audit | Determine status enum, user reference, billing dates, amount/currency, provider reference and lifecycle constraints. |
| `payments` | Unknown in this audit | Determine amount/currency, provider identifiers, status, timestamps, refunds and immutability controls. |
| `payment_events` | Unknown in this audit | Determine event ID uniqueness, raw payload handling, signature verification metadata and retention. |
| `financial_events` | Unknown in this audit | Determine event type, amount, currency, source/reference, timestamps and ledger constraints. |
| `financial_accounts` | Unknown in this audit | Determine account type, ownership, status and links to financial events. |
| `initiatives` | Unknown in this audit | Determine slug uniqueness, organization ownership, publication status, media and metrics. |

No column type, nullability, default or constraint is invented where the source has not been inspected. Expand each row into a field-level schema table from migrations and generated types, and explicitly record differences between them.
