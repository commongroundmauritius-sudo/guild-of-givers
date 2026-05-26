-- Create leads table for capturing potential members early in the flow
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  amount_mur DECIMAL NOT NULL,
  covers_fees BOOLEAN DEFAULT false NOT NULL,
  status TEXT DEFAULT 'pending' NOT NULL, -- pending, paid, converted
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to insert leads (for the signup flow) (Guarded)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'leads') THEN
        DROP POLICY IF EXISTS "Anyone can insert leads" ON public.leads;
        CREATE POLICY "Anyone can insert leads"
          ON public.leads FOR INSERT
          WITH CHECK (true);

        DROP POLICY IF EXISTS "Admins can manage leads" ON public.leads;
        -- Allow admins to view/manage leads
        CREATE POLICY "Admins can manage leads"
          ON public.leads FOR ALL
          USING (
            EXISTS (
              SELECT 1 FROM user_roles
              WHERE user_id = auth.uid() AND role = 'admin'
            )
          );
    END IF;
END $$;

-- Grant access to authenticated and anon roles
GRANT INSERT ON public.leads TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.leads TO authenticated;
