-- Placeholder for remote migration initiative_slug_enforcement
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'initiatives' AND column_name = 'slug') THEN
        ALTER TABLE public.initiatives ALTER COLUMN slug SET NOT NULL;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        NULL;
END $$;
