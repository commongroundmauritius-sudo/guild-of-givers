-- Robust enforcement of initiative slugs and missing columns
-- Ensures the column exists, is populated, and has the required constraints.

-- 1. Ensure slug column exists
ALTER TABLE public.initiatives ADD COLUMN IF NOT EXISTS slug TEXT;

-- 2. Ensure category column exists (required by downstream views like public_visible_initiatives)
ALTER TABLE public.initiatives ADD COLUMN IF NOT EXISTS category TEXT;

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

-- 4. Ensure unique constraint exists
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

-- 5. Enforce NOT NULL
ALTER TABLE public.initiatives ALTER COLUMN slug SET NOT NULL;
