-- Final enforcement of slug NOT NULL constraint
-- This ensures any data inserted during the transition period is backfilled.

DO $$
BEGIN
    -- Final backfill for safety
    UPDATE public.initiatives
    SET slug = lower(regexp_replace(title, '[^a-zA-Z0-9]+', '-', 'g'))
    WHERE slug IS NULL OR slug = '';

    -- Enforce constraint
    ALTER TABLE public.initiatives ALTER COLUMN slug SET NOT NULL;
END $$;
