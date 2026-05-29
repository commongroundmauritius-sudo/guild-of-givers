ALTER TABLE public.partner_applications ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.partner_applications ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;

-- Update RLS for soft delete
DROP POLICY IF EXISTS "Admins can manage partner applications" ON public.partner_applications;
CREATE POLICY "Admins can manage partner applications"
ON public.partner_applications FOR ALL
TO authenticated
USING (
    (public.has_role('admin') OR public.has_role('super_admin'))
    AND (is_deleted = false OR is_deleted IS NULL)
);

-- Policy for viewing deleted ones (super admins only maybe? or just admins)
CREATE POLICY "Admins can view deleted partner applications"
ON public.partner_applications FOR SELECT
TO authenticated
USING (
    (public.has_role('admin') OR public.has_role('super_admin'))
    AND is_deleted = true
);
