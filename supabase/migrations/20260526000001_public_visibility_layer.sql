-- Create a hardened public visibility layer for initiatives
CREATE OR REPLACE VIEW public.public_visible_initiatives WITH (security_invoker = true) AS
SELECT
    i.id,
    i.slug,
    i.title,
    i.summary as short_description,
    i.description as full_description,
    i.category,
    i.image_url as banner_image_url,
    i.created_at,
    i.updated_at,
    i.organization_id,
    i.is_approved,
    i.is_published,
    i.goal_amount_mur,
    i.current_amount_mur,
    i.active_supporter_count,
    i.conversion_count,
    i.gallery_urls,
    o.organization_name,
    o.logo_url as organization_logo,
    o.status as organization_status
FROM public.initiatives i
JOIN public.organizations o ON i.organization_id = o.id
WHERE
    i.is_approved = true
    AND i.is_published = true
    AND o.status = 'active';

-- Revoke all on view from public just in case, then grant select
REVOKE ALL ON public.public_visible_initiatives FROM public;
GRANT SELECT ON public.public_visible_initiatives TO anon, authenticated;

-- Audit and Hardened RLS policies for admin access to non-public records
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can read all initiatives' AND tablename = 'initiatives') THEN
        DROP POLICY "Admins can read all initiatives" ON public.initiatives;
    END IF;
END $$;

CREATE POLICY "Admins can read all initiatives" ON public.initiatives
FOR SELECT TO authenticated
USING (has_role('admin'::app_role));

-- Ensure initiative_versions has proper admin policy
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can manage all initiative versions' AND tablename = 'initiative_versions') THEN
        NULL;
    ELSE
        CREATE POLICY "Admins can manage all initiative versions" ON public.initiative_versions
        FOR ALL TO authenticated
        USING (has_role('admin'::app_role));
    END IF;
END $$;

-- Ensure organizations has admin policy
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can read all organizations' AND tablename = 'organizations') THEN
        CREATE POLICY "Admins can read all organizations" ON public.organizations
        FOR SELECT TO authenticated
        USING (has_role('admin'::app_role));
    END IF;
END $$;
