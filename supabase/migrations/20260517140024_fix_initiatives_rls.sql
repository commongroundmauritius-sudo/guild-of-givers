-- Fix RLS for initiatives to ensure NGOs can insert their own initiatives correctly
DROP POLICY IF EXISTS "NGO staff can manage own initiatives" ON public.initiatives;

CREATE POLICY "NGO staff can manage own initiatives" ON public.initiatives
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = (SELECT auth.uid())
    AND profiles.ngo_id = initiatives.ngo_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = (SELECT auth.uid())
    AND profiles.ngo_id = initiatives.ngo_id
  )
);

-- Ensure admins can always view and manage everything
DROP POLICY IF EXISTS "Admins have full access to initiatives" ON public.initiatives;

CREATE POLICY "Admins have full access to initiatives" ON public.initiatives
FOR ALL
TO authenticated
USING (public.has_role('admin'))
WITH CHECK (public.has_role('admin'));
