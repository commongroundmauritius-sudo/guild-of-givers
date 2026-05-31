-- Create public partner application submissions table and restore access
-- Note: This is a legacy migration to ensure consistency with existing production schema
-- if the table already exists.

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'partner_applications') THEN
        CREATE TABLE public.partner_applications (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          organization_name TEXT NOT NULL,
          registration_number TEXT NOT NULL,
          email TEXT NOT NULL,
          message TEXT NOT NULL,
          status TEXT DEFAULT 'pending' NOT NULL,
          created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
        );
    END IF;
END $$;

ALTER TABLE public.partner_applications ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'partner_applications') THEN
        DROP POLICY IF EXISTS "Anyone can insert partner applications" ON public.partner_applications;
        CREATE POLICY "Anyone can insert partner applications"
            ON public.partner_applications
            FOR INSERT
            WITH CHECK (true);

        DROP POLICY IF EXISTS "Admins can manage partner applications" ON public.partner_applications;
        CREATE POLICY "Admins can manage partner applications"
            ON public.partner_applications
            FOR ALL
            USING (
                EXISTS (
                    SELECT 1
                    FROM user_roles
                    WHERE user_id = auth.uid()
                      AND role = 'admin'
                )
            );
    END IF;
END $$;

GRANT INSERT ON public.partner_applications TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.partner_applications TO authenticated;
