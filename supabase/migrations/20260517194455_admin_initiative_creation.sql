-- Support for admin-created initiatives and better tracking of initiative sources
BEGIN;

-- Add tracking for initiative source
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'initiatives' AND column_name = 'initiative_source') THEN
        ALTER TABLE public.initiatives ADD COLUMN initiative_source TEXT DEFAULT 'organization_submission' CHECK (initiative_source IN ('organization_submission', 'admin_created'));
    END IF;
END $$;

-- Ensure creator metadata exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'initiatives' AND column_name = 'creator_user_id') THEN
        ALTER TABLE public.initiatives ADD COLUMN creator_user_id UUID REFERENCES auth.users(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'initiatives' AND column_name = 'creator_role') THEN
        ALTER TABLE public.initiatives ADD COLUMN creator_role public.app_role;
    END IF;
END $$;

-- Ensure organization_id handle nullability
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'initiatives' AND column_name = 'organization_id') THEN
        ALTER TABLE public.initiatives ALTER COLUMN organization_id DROP NOT NULL;
    END IF;
END $$;

UPDATE public.initiatives SET initiative_source = 'organization_submission' WHERE initiative_source IS NULL;

-- Admin visibility and creation policy
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'initiatives') THEN
        DROP POLICY IF EXISTS "Admins can manage all initiatives" ON public.initiatives;
        CREATE POLICY "Admins can manage all initiatives" ON public.initiatives
        FOR ALL USING (public.has_role('admin'));

    END IF;
END $$;
COMMIT;
