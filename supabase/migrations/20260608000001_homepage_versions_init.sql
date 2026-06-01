-- Initialize homepage_versions and success_stories

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'homepage_version_status') THEN
        CREATE TYPE public.homepage_version_status AS ENUM ('draft', 'published', 'archived');
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.homepage_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version_number SERIAL,
    status public.homepage_version_status DEFAULT 'draft'::public.homepage_version_status NOT NULL,
    configuration_json JSONB DEFAULT '{}'::jsonb NOT NULL,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    published_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.success_stories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    summary TEXT,
    image_url TEXT,
    slug TEXT UNIQUE,
    cta_link TEXT,
    display_order INTEGER DEFAULT 0,
    is_published BOOLEAN DEFAULT false,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.homepage_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.success_stories ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins manage homepage versions"
ON public.homepage_versions FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Public read for published homepage version"
ON public.homepage_versions FOR SELECT
TO public
USING (status = 'published'::homepage_version_status);

CREATE POLICY "Public read for success_stories"
ON public.success_stories FOR SELECT
TO public
USING (is_published = true);

CREATE POLICY "Admins manage success_stories"
ON public.success_stories FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
  )
);

-- GRANTs
GRANT ALL ON public.homepage_versions TO authenticated, service_role;
GRANT ALL ON public.success_stories TO authenticated, service_role;
GRANT SELECT ON public.homepage_versions TO anon;
GRANT SELECT ON public.success_stories TO anon;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;
