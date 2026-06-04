-- Create the reports table if it doesn't exist (handle preview environment drift)
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  report_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  status TEXT DEFAULT 'pending'
);

-- Create enum for report status if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'report_status') THEN
        CREATE TYPE report_status AS ENUM ('pending', 'reviewing', 'approved', 'returned_for_revision');
    END IF;
END $$;

-- Ensure status column exists
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS admin_feedback TEXT;

-- Standardize status column
ALTER TABLE public.reports
DROP CONSTRAINT IF EXISTS reports_status_check;

ALTER TABLE public.reports
ADD CONSTRAINT reports_status_check
CHECK (status IN ('pending', 'reviewing', 'approved', 'returned_for_revision'));

-- Ensure RLS is enabled
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Policies for reports
DROP POLICY IF EXISTS "Organizations can manage their own reports" ON public.reports;
CREATE POLICY "Organizations can manage their own reports"
ON public.reports
FOR ALL
USING (
  organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Admins can manage all reports" ON public.reports;
CREATE POLICY "Admins can manage all reports"
ON public.reports
FOR ALL
USING (public.has_role('admin') OR public.has_role('super_admin'));

-- Ensure public select policy is clean
DROP POLICY IF EXISTS "Anyone can view reports" ON public.reports;
CREATE POLICY "Anyone can view reports" ON public.reports FOR SELECT USING (true);

-- Grants
GRANT ALL ON public.reports TO authenticated;
GRANT ALL ON public.reports TO service_role;
