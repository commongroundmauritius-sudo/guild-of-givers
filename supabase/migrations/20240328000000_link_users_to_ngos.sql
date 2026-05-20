-- Link users to Organizations and improve data relationships

-- Add organization_id to profiles to support Organization staff/owners
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;

-- Ensure reports have an initiative_id (refined from previous migration)
-- (Already handled in 20240327 but ensuring consistency here)

-- Add owner_user_id to Organizations for better access control
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS owner_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Update RLS for Organization dashboard access
-- This allows Organization staff to see their own initiatives even if not public yet
CREATE POLICY "Organization staff can manage their own Organization initiatives"
  ON initiatives FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Organization staff can manage their own Organization reports"
  ON reports FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );
