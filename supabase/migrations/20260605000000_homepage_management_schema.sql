-- Homepage Layout Management Schema

-- Create custom types if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'homepage_version_status') THEN
        CREATE TYPE public.homepage_version_status AS ENUM ('draft', 'published', 'archived');
    END IF;
END $$;

-- 1. Create homepage_settings table
CREATE TABLE IF NOT EXISTS public.homepage_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key TEXT UNIQUE NOT NULL,
    setting_value JSONB NOT NULL,
    updated_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Create homepage_featured_initiatives table
CREATE TABLE IF NOT EXISTS public.homepage_featured_initiatives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    initiative_id UUID NOT NULL REFERENCES public.initiatives(id) ON DELETE CASCADE,
    display_order INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_display_order UNIQUE (display_order)
);

-- 3. Create homepage_versions table
CREATE TABLE IF NOT EXISTS public.homepage_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version_number SERIAL,
    status public.homepage_version_status DEFAULT 'draft'::public.homepage_version_status NOT NULL,
    configuration_json JSONB DEFAULT '{}'::jsonb NOT NULL,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    published_at TIMESTAMPTZ
);

-- 4. Create success_stories table
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
ALTER TABLE public.homepage_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homepage_featured_initiatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homepage_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.success_stories ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for homepage_settings
CREATE POLICY "Allow public read access for homepage_settings"
ON public.homepage_settings FOR SELECT
TO public
USING (true);

CREATE POLICY "Allow admins to manage homepage_settings"
ON public.homepage_settings FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
  )
);

-- 6. RLS Policies for homepage_featured_initiatives
CREATE POLICY "Allow public read access for homepage_featured_initiatives"
ON public.homepage_featured_initiatives FOR SELECT
TO public
USING (true);

CREATE POLICY "Allow admins to manage homepage_featured_initiatives"
ON public.homepage_featured_initiatives FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
  )
);

-- 7. RLS Policies for homepage_versions
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

-- 8. RLS Policies for success_stories
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

-- 9. Seed initial settings
INSERT INTO public.homepage_settings (setting_key, setting_value)
VALUES (
    'homepage_section_visibility',
    '{
        "hero": true,
        "valueProps": true,
        "featured": true,
        "forOrgs": true,
        "faq": true
    }'::jsonb
) ON CONFLICT (setting_key) DO NOTHING;

-- 10. Add updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_homepage_settings_updated
    BEFORE UPDATE ON public.homepage_settings
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER on_homepage_featured_initiatives_updated
    BEFORE UPDATE ON public.homepage_featured_initiatives
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER on_success_stories_updated
    BEFORE UPDATE ON public.success_stories
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Grant access
GRANT SELECT ON public.homepage_settings TO anon, authenticated;
GRANT SELECT ON public.homepage_featured_initiatives TO anon, authenticated;
GRANT SELECT ON public.homepage_versions TO anon, authenticated;
GRANT SELECT ON public.success_stories TO anon, authenticated;

GRANT ALL ON public.homepage_settings TO authenticated, service_role;
GRANT ALL ON public.homepage_featured_initiatives TO authenticated, service_role;
GRANT ALL ON public.homepage_versions TO authenticated, service_role;
GRANT ALL ON public.success_stories TO authenticated, service_role;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;
