ALTER TABLE public.reports 
ADD COLUMN IF NOT EXISTS profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Create index for performance on profile_id queries
CREATE INDEX IF NOT EXISTS idx_reports_profile_id ON public.reports(profile_id);

