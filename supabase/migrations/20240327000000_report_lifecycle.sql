-- Cross-Role Report Lifecycle refinement

-- Initiatives: Add approval status
ALTER TABLE public.initiatives ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT false;

-- Enhance reports with approval system
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS initiative_id UUID REFERENCES public.initiatives(id) ON DELETE CASCADE;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending_review';
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS admin_feedback TEXT;
