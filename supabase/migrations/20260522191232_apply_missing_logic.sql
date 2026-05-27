-- Ensure activate_membership exists
CREATE OR REPLACE FUNCTION public.activate_membership(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (p_user_id, 'member')
    ON CONFLICT (user_id, role) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Defensive column addition to prevent SQLSTATE 42703 in CI
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'initiatives' AND column_name = 'is_impact_pool') THEN
        ALTER TABLE public.initiatives ADD COLUMN is_impact_pool BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'initiatives' AND column_name = 'is_unlimited') THEN
        ALTER TABLE public.initiatives ADD COLUMN is_unlimited BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Ensure Impact Pool is marked correctly
UPDATE public.initiatives
SET is_impact_pool = true, is_unlimited = true
WHERE title ILIKE '%Impact Pool%' OR organization_id IS NULL;
