-- Homepage Layout Management Schema

-- 1. Create homepage_settings table
CREATE TABLE public.homepage_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key TEXT UNIQUE NOT NULL,
    setting_value JSONB NOT NULL,
    updated_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Create homepage_featured_initiatives table
CREATE TABLE public.homepage_featured_initiatives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    initiative_id UUID NOT NULL REFERENCES public.initiatives(id) ON DELETE CASCADE,
    display_order INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_display_order UNIQUE (display_order)
);

-- Enable RLS
ALTER TABLE public.homepage_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homepage_featured_initiatives ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies for homepage_settings

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

-- 4. RLS Policies for homepage_featured_initiatives

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

-- 5. Seed initial settings
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

-- 6. Add updated_at trigger for both tables
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

-- Grant access to authenticated and anon users for SELECT
GRANT SELECT ON public.homepage_settings TO anon, authenticated;
GRANT SELECT ON public.homepage_featured_initiatives TO anon, authenticated;

-- Grant all to service_role for internal use
GRANT ALL ON public.homepage_settings TO service_role;
GRANT ALL ON public.homepage_featured_initiatives TO service_role;
