-- Link users to NGOs and improve data relationships

-- Add organization_id to profiles to support Organization staff/owners
-- Handle both naming conventions to prevent migration failures during refactor
DO $$
BEGIN
    -- Handle profiles column
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'organizations') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'organization_id') THEN
            ALTER TABLE public.profiles ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;
        END IF;
    ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ngos') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'ngo_id') THEN
            ALTER TABLE public.profiles ADD COLUMN ngo_id UUID REFERENCES public.ngos(id) ON DELETE SET NULL;
        END IF;
    END IF;

    -- Handle NGO/Organization owner_id
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'organizations') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'organizations' AND column_name = 'owner_user_id') THEN
            ALTER TABLE public.organizations ADD COLUMN owner_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
        END IF;
    ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ngos') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ngos' AND column_name = 'owner_id') THEN
            ALTER TABLE public.ngos ADD COLUMN owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
        END IF;
    END IF;
END $$;

-- Update RLS for Organization dashboard access
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'organizations') THEN
        DROP POLICY IF EXISTS "Organization staff can manage their own initiatives" ON initiatives;
        CREATE POLICY "Organization staff can manage their own initiatives"
          ON initiatives FOR ALL
          USING (
            organization_id IN (
              SELECT organization_id FROM profiles WHERE id = auth.uid()
            )
          );

        DROP POLICY IF EXISTS "Organization staff can manage their own reports" ON reports;
        CREATE POLICY "Organization staff can manage their own reports"
          ON reports FOR ALL
          USING (
            organization_id IN (
              SELECT organization_id FROM profiles WHERE id = auth.uid()
            )
          );
    ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ngos') THEN
        DROP POLICY IF EXISTS "NGO staff can manage their own NGO initiatives" ON initiatives;
        CREATE POLICY "NGO staff can manage their own NGO initiatives"
          ON initiatives FOR ALL
          USING (
            ngo_id IN (
              SELECT ngo_id FROM profiles WHERE id = auth.uid()
            )
          );

        DROP POLICY IF EXISTS "NGO staff can manage their own NGO reports" ON reports;
        CREATE POLICY "NGO staff can manage their own NGO reports"
          ON reports FOR ALL
          USING (
            ngo_id IN (
              SELECT ngo_id FROM profiles WHERE id = auth.uid()
            )
          );
    END IF;
END $$;
