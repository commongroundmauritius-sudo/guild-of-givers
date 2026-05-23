-- Ensure activate_membership exists
CREATE OR REPLACE FUNCTION public.activate_membership(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (p_user_id, 'member')
    ON CONFLICT (user_id, role) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Ensure Impact Pool is marked correctly
UPDATE public.initiatives
SET is_impact_pool = true, is_unlimited = true
WHERE title ILIKE '%Impact Pool%' OR organization_id IS NULL;
