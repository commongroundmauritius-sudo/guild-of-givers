-- 1. Extend profiles and add constraints
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS age integer;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_age_check') THEN
        ALTER TABLE public.profiles ADD CONSTRAINT profiles_age_check CHECK (age >= 13 AND age <= 120);
    END IF;
END $$;

-- 2. Refactor ngos to organizations and update columns
DO $$
BEGIN
    -- Rename table only if it still exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ngos' AND table_schema = 'public') THEN
        ALTER TABLE public.ngos RENAME TO organizations;
    END IF;

    -- Rename owner_id
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'owner_id' AND table_schema = 'public') THEN
        ALTER TABLE public.organizations RENAME COLUMN owner_id TO owner_user_id;
    END IF;

    -- Rename name
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'name' AND table_schema = 'public') THEN
        ALTER TABLE public.organizations RENAME COLUMN name TO organization_name;
    END IF;
END $$;

-- 4. Add new fields to organizations
ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS address text,
ADD COLUMN IF NOT EXISTS contact_email text,
ADD COLUMN IF NOT EXISTS contact_phone text,
ADD COLUMN IF NOT EXISTS milestones text,
ADD COLUMN IF NOT EXISTS expected_outcomes text,
ADD COLUMN IF NOT EXISTS allocation_summary text;

-- 5. Rename ngo_id to organization_id in all referencing tables
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN SELECT table_name FROM information_schema.columns WHERE column_name = 'ngo_id' AND table_schema = 'public' LOOP
        EXECUTE format('ALTER TABLE public.%I RENAME COLUMN ngo_id TO organization_id', t);
    END LOOP;
END $$;

-- 6. Rename ngo_documents table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ngo_documents' AND table_schema = 'public') THEN
        ALTER TABLE public.ngo_documents RENAME TO organization_documents;
    END IF;
END $$;

-- 7. Handle app_role enum migration
-- Note: value additions to enums cannot be inside a procedural block in some Postgres versions or if followed by use in same block.
-- Adding it as a standalone statement is generally fine in Supabase migrations as they handle COMMITs.
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'organization';

-- 8. Update role data
UPDATE public.user_roles SET role = 'organization'::public.app_role WHERE role = 'ngo'::public.app_role;
UPDATE public.initiatives SET creator_role = 'organization'::public.app_role WHERE creator_role = 'ngo'::public.app_role;

-- 9. Update has_role function
CREATE OR REPLACE FUNCTION public.has_role(requested_role public.app_role)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = (SELECT auth.uid())
    AND role = requested_role
  );
END;
$function$;

-- 10. Update RLS Policies
-- Organizations
DROP POLICY IF EXISTS "Admins can manage NGOs" ON public.organizations;
DROP POLICY IF EXISTS "Public can view NGOs with published initiatives" ON public.organizations;
DROP POLICY IF EXISTS "NGO owners can update their NGO" ON public.organizations;

CREATE POLICY "Admins can manage organizations" ON public.organizations FOR ALL USING (has_role('admin'::app_role));
CREATE POLICY "Organization owners can manage their organization" ON public.organizations FOR ALL USING (owner_user_id = auth.uid());
CREATE POLICY "Public can view organizations with published initiatives" ON public.organizations FOR SELECT
USING ((is_verified = true) OR (EXISTS (SELECT 1 FROM initiatives i WHERE i.organization_id = organizations.id AND i.is_approved = true AND i.is_published = true)));

-- Organization Documents
ALTER TABLE public.organization_documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owners can manage organization documents" ON public.organization_documents;
CREATE POLICY "Owners can manage organization documents" ON public.organization_documents FOR ALL
USING (EXISTS (SELECT 1 FROM organizations WHERE id = organization_documents.organization_id AND owner_user_id = auth.uid()));

-- Initiatives
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'NGO staff can manage own initiatives' AND tablename = 'initiatives') THEN
        ALTER POLICY "NGO staff can manage own initiatives" ON public.initiatives RENAME TO "Organization staff can manage own initiatives";
    END IF;
END $$;

-- Reports
DROP POLICY IF EXISTS "NGO staff can manage their own NGO reports" ON public.reports;
DROP POLICY IF EXISTS "Organization staff can manage their reports" ON public.reports;
CREATE POLICY "Organization staff can manage their reports" ON public.reports FOR ALL
USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = (SELECT auth.uid())));

-- Comments
DROP POLICY IF EXISTS "Qualified users can comment" ON public.post_comments;
CREATE POLICY "Qualified users can comment" ON public.post_comments FOR INSERT WITH CHECK (
    ((SELECT auth.uid()) = user_id) AND (
        has_role('admin'::app_role) OR
        has_role('member'::app_role) OR (
            has_role('organization'::app_role) AND (
                EXISTS (
                    SELECT 1 FROM community_posts p
                    JOIN initiatives i ON p.initiative_id = i.id
                    JOIN profiles prof ON prof.organization_id = i.organization_id
                    WHERE p.id = post_comments.post_id
                    AND prof.id = (SELECT auth.uid())
                )
            )
        )
    )
);

-- 11. Update initiative_source constraint
ALTER TABLE public.initiatives DROP CONSTRAINT IF EXISTS initiatives_initiative_source_check;
UPDATE public.initiatives SET initiative_source = 'organization_submission' WHERE initiative_source = 'ngo_submission';
ALTER TABLE public.initiatives ADD CONSTRAINT initiatives_initiative_source_check
    CHECK (initiative_source = ANY (ARRAY['organization_submission'::text, 'admin_created'::text]));

-- 12. Grants
GRANT ALL ON public.organizations TO authenticated;
GRANT ALL ON public.organization_documents TO authenticated;
GRANT SELECT ON public.organizations TO anon;
