-- Secure the leads table by making the insertion policy more restrictive

BEGIN;

DROP POLICY IF EXISTS "Anyone can insert leads" ON public.leads;
CREATE POLICY "Anyone can insert leads" ON public.leads
FOR INSERT WITH CHECK (
  status = 'pending'
);

COMMIT;
