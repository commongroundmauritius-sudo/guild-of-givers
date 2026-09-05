# Database Migrations Guide

## Overview

CommonGround uses Supabase migrations with strict naming conventions and idempotency requirements. All schema changes must be performed via migrations in `supabase/migrations/`.

## Naming Convention

**Format:** `YYYYMMDDHHMMSS_description.sql`

**Example:** `20260605000000_create_financial_events_table.sql`

**Requirements:**
- 14-digit timestamp (`YYYYMMDDHHMMSS`) for correct ordering
- Snake_case description
- Must be compatible with Supabase CLI
- Sequential ordering is critical

## Idempotency Requirements

All migrations must be idempotent using `DO $$ BEGIN ... END $$;` blocks:

```sql
DO $$ BEGIN
  -- Check if table already exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'my_table') THEN
    CREATE TABLE my_table (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );
  END IF;
END $$;
```

## RLS Requirements

**Every new table MUST have:**
1. RLS enabled
2. Appropriate policies for each role: `member`, `organization`, `admin`
3. Explicit policies for public access (if applicable)

### Example RLS Setup

```sql
ALTER TABLE my_table ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view own records"
  ON my_table
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'member'
      AND my_table.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all"
  ON my_table
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );
```

## Timeline Consistency Principle

**CRITICAL:** Migrations must respect the schema state at their point in time.

### Example: Organization Rename (2026-05-18)

All migrations **before** `20260518075811` must use original naming:
```sql
-- Before 2026-05-18
CREATE TABLE organizations ( ... );
```

All migrations **after** `20260518075811` must use updated naming:
```sql
-- After 2026-05-18
CREATE TABLE organizations ( ... );
```

**DO NOT use conditional branching inside migrations** to handle multiple schema versions.

## Migration Safeguards

### ❌ DO NOT
- **Rename** migration files once pushed to production/staging
- **Delete** migration files
- Use conditional logic to detect and migrate between different schema versions
- Modify migrations that have already been applied

### ✅ DO
- **Create new migrations** to revert changes if needed
- **Verify sequential timestamps** before pushing
- **Test migrations** locally with `supabase db pull` and `supabase db push`
- **Reference immutable tables** like `payments` and `financial_events` in RLS policies

## Common Patterns

### Creating an Immutable Table

```sql
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'financial_events') THEN
    CREATE TABLE financial_events (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      payment_id UUID NOT NULL REFERENCES payments(id),
      event_type TEXT NOT NULL,
      amount_mur DECIMAL(15, 2) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );

    -- Prevent updates and deletes
    CREATE TRIGGER prevent_financial_events_modification
      BEFORE UPDATE OR DELETE ON financial_events
      FOR EACH ROW
      EXECUTE FUNCTION raise_immutability_error();
  END IF;
END $$;
```

### Adding an Index

```sql
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'financial_events'
    AND indexname = 'idx_financial_events_payment_id'
  ) THEN
    CREATE INDEX idx_financial_events_payment_id
      ON financial_events(payment_id);
  END IF;
END $$;
```

### Creating an RPC Function

```sql
DO $$ BEGIN
  DROP FUNCTION IF EXISTS allocate_payment_funds(UUID, DECIMAL, TEXT[]);
END $$;

CREATE FUNCTION allocate_payment_funds(
  p_payment_id UUID,
  p_net_amount DECIMAL,
  p_preference_ids TEXT[]
)
RETURNS TABLE (...) AS $$
  -- Implementation
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION allocate_payment_funds TO authenticated;
```

## Verifying Migrations

### Local Testing

```bash
# Pull current production schema
supabase db pull

# Test new migration locally
supabase db push

# Verify via CLI
supabase db list tables
```

### Production Checklist

- [ ] Migration creates idempotent DO blocks
- [ ] RLS policies are defined for new tables
- [ ] Indexes are created for foreign keys
- [ ] Functions include `SET search_path = public`
- [ ] Timestamp is sequential after latest migration
- [ ] Description clearly indicates purpose
- [ ] Tested locally with `supabase db push`

## Current Schema State

**Latest Migration:** `20260903_organization_role_based_security.sql`

**Key Tables:**
- `auth.users` - Supabase Auth
- `profiles` - User identity
- `user_roles` - Role-based access control
- `organizations` - Partner organizations
- `initiatives` - Vetted programs
- `subscriptions` - Recurring contributions
- `payments` - Transaction history
- `financial_events` - Immutable ledger
- `allocations` - Fund distribution
- `community_posts` - Community platform
- `community_comments` - Post comments

## References

- [Supabase Migrations](https://supabase.com/docs/guides/migrations)
- [PostgreSQL CREATE TABLE](https://www.postgresql.org/docs/current/sql-createtable.html)
- [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
