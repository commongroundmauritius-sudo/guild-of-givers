CREATE TABLE IF NOT EXISTS public.organization_team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  quote TEXT NOT NULL,
  photo_url TEXT,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_org_team_members_org_id ON public.organization_team_members(organization_id);

ALTER TABLE public.organization_team_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view organization team members" ON public.organization_team_members;
CREATE POLICY "Public can view organization team members"
  ON public.organization_team_members
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Org admins and owners can insert team members" ON public.organization_team_members;
CREATE POLICY "Org admins and owners can insert team members"
  ON public.organization_team_members
  FOR INSERT
  WITH CHECK (
    (auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' IN ('admin', 'super_admin')
    OR
    EXISTS (
      SELECT 1 FROM public.organizations o
      WHERE o.id = organization_id
        AND o.owner_user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.organization_id = organization_id
    )
  );

DROP POLICY IF EXISTS "Org admins and owners can update team members" ON public.organization_team_members;
CREATE POLICY "Org admins and owners can update team members"
  ON public.organization_team_members
  FOR UPDATE
  USING (
    (auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' IN ('admin', 'super_admin')
    OR
    EXISTS (
      SELECT 1 FROM public.organizations o
      WHERE o.id = organization_team_members.organization_id
        AND o.owner_user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.organization_id = organization_team_members.organization_id
    )
  )
  WITH CHECK (
    (auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' IN ('admin', 'super_admin')
    OR
    EXISTS (
      SELECT 1 FROM public.organizations o
      WHERE o.id = organization_team_members.organization_id
        AND o.owner_user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.organization_id = organization_team_members.organization_id
    )
  );

DROP POLICY IF EXISTS "Org admins and owners can delete team members" ON public.organization_team_members;
CREATE POLICY "Org admins and owners can delete team members"
  ON public.organization_team_members
  FOR DELETE
  USING (
    (auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' IN ('admin', 'super_admin')
    OR
    EXISTS (
      SELECT 1 FROM public.organizations o
      WHERE o.id = organization_team_members.organization_id
        AND o.owner_user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.organization_id = organization_team_members.organization_id
    )
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.organization_team_members TO authenticated;
GRANT SELECT ON public.organization_team_members TO anon;
GRANT ALL ON public.organization_team_members TO service_role;
