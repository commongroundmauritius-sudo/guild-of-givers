-- Link users to NGOs and improve data relationships

-- Add ngo_id to profiles to support NGO staff/owners
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ngos') THEN
        ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ngo_id UUID REFERENCES public.ngos(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Update RLS for NGO dashboard access
DROP POLICY IF EXISTS "NGO staff can manage their own NGO initiatives" ON public.initiatives;
CREATE POLICY "NGO staff can manage their own NGO initiatives"
  ON public.initiatives FOR ALL
  USING (
    ngo_id IN (
      SELECT ngo_id FROM public.profiles WHERE id = (SELECT auth.uid())
    )
  );

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reports') THEN
        DROP POLICY IF EXISTS "NGO staff can manage their own NGO reports" ON public.reports;
        CREATE POLICY "NGO staff can manage their own NGO reports"
          ON public.reports FOR ALL
          USING (
            ngo_id IN (
              SELECT ngo_id FROM public.profiles WHERE id = (SELECT auth.uid())
            )
          );
    END IF;
END $$;
