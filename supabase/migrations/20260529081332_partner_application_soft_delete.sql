ALTER TABLE public.partner_applications ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.partner_applications ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;

-- Update RLS for soft delete
DROP POLICY IF EXISTS "Admins can manage partner applications" ON public.partner_applications;
CREATE POLICY "Admins can manage partner applications"
ON public.partner_applications FOR ALL
TO authenticated
USING (
    (public.has_role('admin') OR public.has_role('super_admin'))
);

-- Note: We allow admins to see everything including soft deleted ones in the management policy,
-- but we'll use is_deleted for filtering in the UI. 
-- Actually, let's keep it simple and just use one policy for now.
