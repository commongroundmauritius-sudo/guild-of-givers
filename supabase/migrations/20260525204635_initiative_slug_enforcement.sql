-- Robust initiative schema enforcement and alignment
-- Ensures the column exists, is populated, and has the required constraints.
-- Resolves SQLSTATE 42703 (column does not exist) errors in CI for downstream views.

-- 1. Ensure initiatives columns exist (required for public_visible_initiatives view)
ALTER TABLE public.initiatives ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE public.initiatives ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.initiatives ADD COLUMN IF NOT EXISTS summary TEXT;
ALTER TABLE public.initiatives ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.initiatives ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false;
ALTER TABLE public.initiatives ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT false;
ALTER TABLE public.initiatives ADD COLUMN IF NOT EXISTS gallery_urls TEXT[] DEFAULT '{}';
ALTER TABLE public.initiatives ADD COLUMN IF NOT EXISTS active_supporter_count INTEGER DEFAULT 0;
ALTER TABLE public.initiatives ADD COLUMN IF NOT EXISTS conversion_count INTEGER DEFAULT 0;

-- 2. Ensure organizations columns exist (required for public_visible_initiatives join)
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- 3. Backfill existing initiatives with slugs if they are NULL
DO $$
DECLARE
    rec RECORD;
    base_slug TEXT;
    final_slug TEXT;
    counter INTEGER;
BEGIN
    FOR rec IN SELECT id, title FROM public.initiatives WHERE slug IS NULL LOOP
        -- Simple slugify: lowercase, replace non-alphanumeric with hyphen
        base_slug := lower(regexp_replace(rec.title, '[^a-zA-Z0-9]+', '-', 'g'));
        -- Trim hyphens from start and end
        base_slug := trim(both '-' from base_slug);

        -- If slug becomes empty (e.g. only symbols), use "initiative"
        IF base_slug = '' THEN
            base_slug := 'initiative';
        END IF;

        final_slug := base_slug;
        counter := 1;

        WHILE EXISTS (SELECT 1 FROM public.initiatives WHERE slug = final_slug) LOOP
            counter := counter + 1;
            final_slug := base_slug || '-' || counter;
        END LOOP;

        UPDATE public.initiatives SET slug = final_slug WHERE id = rec.id;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 4. Ensure unique constraint exists (Hardened PG Compatibility)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conrelid = 'public.initiatives'::regclass
        AND contype = 'u'
        AND (
            SELECT array_agg(a.attname::text ORDER BY x.n)
            FROM unnest(conkey) WITH ORDINALITY AS x(attnum, n)
            JOIN pg_attribute a ON a.attnum = x.attnum AND a.attrelid = conrelid
        ) = ARRAY['slug']
    ) THEN
        ALTER TABLE public.initiatives ADD CONSTRAINT initiatives_slug_unique UNIQUE (slug);
    END IF;
END $$;

-- 5. Enforce NOT NULL on slug
ALTER TABLE public.initiatives ALTER COLUMN slug SET NOT NULL;

-- 6. Security Hardening: Ensure RLS is enabled on critical tables
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'member_preferences') THEN
        ALTER TABLE public.member_preferences ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;
