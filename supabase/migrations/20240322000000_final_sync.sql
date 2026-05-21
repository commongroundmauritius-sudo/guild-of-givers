-- Add email to profiles for convenience and sync with trigger
-- Enhance Organizations table with missing fields from documentation
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'organizations') THEN
        ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS category TEXT;
        ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS contact_info TEXT;
        ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS mission TEXT;
    ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ngos') THEN
        ALTER TABLE public.ngos ADD COLUMN IF NOT EXISTS category TEXT;
        ALTER TABLE public.ngos ADD COLUMN IF NOT EXISTS contact_info TEXT;
        ALTER TABLE public.ngos ADD COLUMN IF NOT EXISTS mission TEXT;
    END IF;
END $$;

-- Enhance Initiatives table
ALTER TABLE public.initiatives ADD COLUMN IF NOT EXISTS media_url TEXT;

-- Create missing Organization-related tables mentioned in documentation
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'organizations') THEN
        CREATE TABLE IF NOT EXISTS public.organization_documents (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
          title TEXT NOT NULL,
          file_url TEXT NOT NULL,
          document_type TEXT,
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

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'organizations') THEN
        CREATE TABLE IF NOT EXISTS public.reports (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          file_url TEXT NOT NULL,
          report_date DATE DEFAULT CURRENT_DATE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
        );
    ELSE
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

-- Enable RLS on new tables
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'organization_documents') THEN
        ALTER TABLE public.organization_documents ENABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ngo_documents') THEN
        ALTER TABLE public.ngo_documents ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;
ALTER TABLE public.initiative_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for new tables
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'organization_documents') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can view Organization documents') THEN
            CREATE POLICY "Anyone can view Organization documents" ON public.organization_documents FOR SELECT USING (true);
        END IF;
    ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ngo_documents') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can view NGO documents') THEN
            CREATE POLICY "Anyone can view NGO documents" ON public.ngo_documents FOR SELECT USING (true);
        END IF;
    END IF;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can view initiative updates') THEN
        CREATE POLICY "Anyone can view initiative updates" ON public.initiative_updates FOR SELECT USING (true);
    END IF;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can view reports') THEN
        CREATE POLICY "Anyone can view reports" ON public.reports FOR SELECT USING (true);
    END IF;
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Update trigger to be more robust and handle the "Backend is source of truth" requirement
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    new.email
  )
  ON CONFLICT (id) DO UPDATE
  SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'member')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
