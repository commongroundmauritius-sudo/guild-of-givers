-- Link users to NGOs and improve data relationships

-- Add ngo_id to profiles to support NGO staff/owners
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ngo_id UUID REFERENCES public.ngos(id) ON DELETE SET NULL;

-- Ensure reports have an initiative_id (refined from previous migration)
-- (Already handled in 20240327 but ensuring consistency here)

-- Add owner_id to NGOs for better access control
ALTER TABLE public.ngos ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Update RLS for NGO dashboard access
-- This allows NGO staff to see their own initiatives even if not public yet
CREATE POLICY "NGO staff can manage their own NGO initiatives"
  ON initiatives FOR ALL
  USING (
    ngo_id IN (
      SELECT ngo_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "NGO staff can manage their own NGO reports"
  ON reports FOR ALL
  USING (
    ngo_id IN (
      SELECT ngo_id FROM profiles WHERE id = auth.uid()
    )
  );
