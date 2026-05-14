# Agent Instructions for CommonGround

Welcome to the CommonGround codebase. This file provides critical architectural rules and patterns to ensure the platform's integrity is maintained.

## 1. Core Principles

- **Backend as Source of Truth:** Never trust the frontend for sensitive data (e.g., payment status, role assignment). Use Supabase RLS and database triggers.
- **Webhook-Only Payment Confirmation:** Only process payment successes via verified webhooks from the payment processor (Peach Payments).
- **Immutability of Ledger:** Do not delete records from `payments`, `subscriptions`, or `payment_events`. These are historical audit trails.
- **Role-Based Routing:** Use the `user_roles` table to determine user access. Role initialization must be handled by the `handle_new_user()` database trigger.

## 2. Database & Migrations

- **Schema Management:** All DDL changes must be performed via migrations in `supabase/migrations/`.
- **Naming Convention:** Use 14-digit timestamps (`YYYYMMDDHHMMSS_name.sql`) for migration files to ensure correct ordering and Supabase CLI compatibility.
- **Idempotency:** Use `DO $$ BEGIN ... END $$;` blocks for logic within migrations to allow them to be re-run safely.
- **RLS Policies:** Every new table **MUST** have RLS enabled and appropriate policies defined for `member`, `ngo`, and `admin` roles.

## 3. Styling & Components

- **Theming:** Use the established role-based themes:
  - **Member:** Teal (#0D3D34)
  - **NGO:** Coral (#F26D5F)
  - **Admin:** Amber (#F2994A)
- **CSS Variables:** Prefer semantic CSS variables from `src/styles.css` over hardcoded hex values.

## 4. Key Workflows

- **Initiative Moderation:** Initiatives are not visible to members unless `is_approved = true`.
- **NGO Vetting:** Only NGOs with `is_verified = true` are public-facing.
- **Member Signup:** Ensure the `profiles` and `user_roles` records are created before the user reaches the dashboard.

## 5. Development Utilities

- **Project ID:** The primary Supabase project is `vzsifigcowusabfmnudk`.
- **Type Generation:** Run `supabase gen types typescript --project-id vzsifigcowusabfmnudk > src/integrations/supabase/types.ts` after schema changes.

Follow these rules to maintain the platform's fintech-grade infrastructure and transparency standards.
