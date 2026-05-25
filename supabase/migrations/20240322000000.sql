-- Add email to profiles for convenience and sync with trigger
-- Enhance Organizations table with missing fields from documentation
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS contact_info TEXT;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS mission TEXT;

-- Enhance Initiatives table
ALTER TABLE public.initiatives ADD COLUMN IF NOT EXISTS media_url TEXT;

-- Create missing Organization-related tables mentioned in documentation
CREATE TABLE IF NOT EXISTS public.organization_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  file_url TEXT NOT NULL,
  document_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.initiative_updates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  initiative_id UUID REFERENCES public.initiatives ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  report_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on new tables
ALTER TABLE public.organization_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.initiative_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;



-- RLS Policies
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organization_documents') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can view organization documents') THEN
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'organization_documents') THEN
                    CREATE POLICY "Anyone can view organization documents" ON public.organization_documents FOR SELECT USING (true);
    END IF;
END $$;
        END IF;
    END IF;

    -- Legacy check for NGO documents during transition phase
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ngo_documents') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can view NGO documents') THEN
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ngo_documents') THEN
                    CREATE POLICY "Anyone can view NGO documents" ON public.ngo_documents FOR SELECT USING (true);
    END IF;
END $$;
        END IF;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'initiative_updates') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can view initiative updates') THEN
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'initiative_updates') THEN
                    CREATE POLICY "Anyone can view initiative updates" ON public.initiative_updates FOR SELECT USING (true);
    END IF;
END $$;
        END IF;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reports') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can view reports') THEN
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'reports') THEN
                    CREATE POLICY "Anyone can view reports" ON public.reports FOR SELECT USING (true);
    END IF;
END $$;
        END IF;
    END IF;
END $$;
