-- Final RLS fix for allocations
-- This ensures members can see their own contribution distribution

DROP POLICY IF EXISTS "Users can view own allocations" ON public.allocations;

CREATE POLICY "Users can view own allocations" ON public.allocations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.payments
    WHERE public.payments.id = public.allocations.payment_id
    AND public.payments.user_id = auth.uid()
  )
);

-- Ensure organization staff can see allocations for their initiatives
CREATE POLICY "Organization staff can view allocations" ON public.allocations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.initiatives
    JOIN public.profiles ON profiles.organization_id = initiatives.organization_id
    WHERE initiatives.id = allocations.initiative_id
    AND profiles.id = auth.uid()
  )
);
