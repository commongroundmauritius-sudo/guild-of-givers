-- Add email to profiles for convenience and sync with trigger
-- Enhance Organizations/NGOs table with missing fields
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organizations') THEN
        ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS category TEXT;
        ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS contact_info TEXT;
        ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS mission TEXT;
    ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ngos') THEN
        ALTER TABLE public.ngos ADD COLUMN IF NOT EXISTS category TEXT;
        ALTER TABLE public.ngos ADD COLUMN IF NOT EXISTS contact_info TEXT;
        ALTER TABLE public.ngos ADD COLUMN IF NOT EXISTS mission TEXT;
    END IF;
END $$;

-- Enhance Initiatives table
ALTER TABLE public.initiatives ADD COLUMN IF NOT EXISTS media_url TEXT;

-- Create missing NGO-related tables mentioned in documentation
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organizations') THEN
        CREATE TABLE IF NOT EXISTS public.organization_documents (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          organization_id UUID REFERENCES public.organizations ON DELETE CASCADE NOT NULL,
          title TEXT NOT NULL,
          file_url TEXT NOT NULL,
          document_type TEXT,
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
    ELSE
        CREATE TABLE IF NOT EXISTS public.ngo_documents (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          ngo_id UUID REFERENCES public.ngos ON DELETE CASCADE NOT NULL,
          title TEXT NOT NULL,
          file_url TEXT NOT NULL,
          document_type TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
        );

        CREATE TABLE IF NOT EXISTS public.reports (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          ngo_id UUID REFERENCES public.ngos ON DELETE CASCADE NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          file_url TEXT NOT NULL,
          report_date DATE DEFAULT CURRENT_DATE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
        );
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.initiative_updates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  initiative_id UUID REFERENCES public.initiatives ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organization_documents') THEN
        ALTER TABLE public.organization_documents ENABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ngo_documents') THEN
        ALTER TABLE public.ngo_documents ENABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reports') THEN
        ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'initiative_updates') THEN
        ALTER TABLE public.initiative_updates ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- RLS Policies
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organization_documents') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can view organization documents') THEN
            CREATE POLICY "Anyone can view organization documents" ON public.organization_documents FOR SELECT USING (true);
        END IF;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ngo_documents') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can view NGO documents') THEN
            CREATE POLICY "Anyone can view NGO documents" ON public.ngo_documents FOR SELECT USING (true);
        END IF;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'initiative_updates') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can view initiative updates') THEN
            CREATE POLICY "Anyone can view initiative updates" ON public.initiative_updates FOR SELECT USING (true);
        END IF;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reports') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can view reports') THEN
            CREATE POLICY "Anyone can view reports" ON public.reports FOR SELECT USING (true);
        END IF;
    END IF;
END $$;
