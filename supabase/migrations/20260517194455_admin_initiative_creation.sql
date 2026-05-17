-- Add admin initiative creation fields
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'initiatives' AND column_name = 'initiative_source') THEN
        ALTER TABLE public.initiatives ADD COLUMN initiative_source TEXT DEFAULT 'ngo_submission' CHECK (initiative_source IN ('ngo_submission', 'admin_created'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'initiatives' AND column_name = 'creator_user_id') THEN
        ALTER TABLE public.initiatives ADD COLUMN creator_user_id UUID REFERENCES auth.users(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'initiatives' AND column_name = 'creator_role') THEN
        ALTER TABLE public.initiatives ADD COLUMN creator_role public.app_role;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'initiatives' AND column_name = 'category') THEN
        ALTER TABLE public.initiatives ADD COLUMN category TEXT;
    END IF;

    -- Make ngo_id nullable to support admin-created initiatives not tied to a specific NGO
    ALTER TABLE public.initiatives ALTER COLUMN ngo_id DROP NOT NULL;

    -- Update existing records
    UPDATE public.initiatives SET initiative_source = 'ngo_submission' WHERE initiative_source IS NULL;
END $$;
