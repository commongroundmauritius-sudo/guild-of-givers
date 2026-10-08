-- 1. Add volunteer_opportunity to initiatives
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='initiatives' AND column_name='volunteer_opportunity') THEN
        ALTER TABLE public.initiatives ADD COLUMN volunteer_opportunity BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- 2. Create success_stories table
CREATE TABLE IF NOT EXISTS public.success_stories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    summary TEXT,
    image_url TEXT,
    slug TEXT UNIQUE,
    cta_link TEXT,
    display_order INTEGER DEFAULT 0,
    is_published BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create homepage_versions table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'homepage_version_status') THEN
        CREATE TYPE public.homepage_version_status AS ENUM ('draft', 'published', 'archived');
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.homepage_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version_number SERIAL,
    status public.homepage_version_status NOT NULL DEFAULT 'draft',
    configuration_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    published_at TIMESTAMPTZ
);

-- 4. Create homepage_analytics table
CREATE TABLE IF NOT EXISTS public.homepage_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version_id UUID REFERENCES public.homepage_versions(id) ON DELETE SET NULL,
    section_id TEXT NOT NULL,
    event_type TEXT NOT NULL, -- 'view', 'click', 'conversion'
    target_id UUID, -- Optional: initiative_id, story_id, etc.
    cta_label TEXT,
    user_id UUID REFERENCES auth.users(id),
    session_id TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_success_stories_published ON public.success_stories(is_published);
CREATE INDEX IF NOT EXISTS idx_homepage_versions_status ON public.homepage_versions(status);
CREATE INDEX IF NOT EXISTS idx_homepage_analytics_section ON public.homepage_analytics(section_id);

-- 6. Enable RLS
ALTER TABLE public.success_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homepage_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homepage_analytics ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies

-- Success Stories
DROP POLICY IF EXISTS "Public read for published success stories" ON public.success_stories;
CREATE POLICY "Public read for published success stories"
ON public.success_stories FOR SELECT
USING (is_published = true);

DROP POLICY IF EXISTS "Admins manage success stories" ON public.success_stories;
CREATE POLICY "Admins manage success stories"
ON public.success_stories FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
  )
);

-- Homepage Versions
DROP POLICY IF EXISTS "Public read for published homepage version" ON public.homepage_versions;
CREATE POLICY "Public read for published homepage version"
ON public.homepage_versions FOR SELECT
USING (status = 'published');

DROP POLICY IF EXISTS "Admins manage homepage versions" ON public.homepage_versions;
CREATE POLICY "Admins manage homepage versions"
ON public.homepage_versions FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
  )
);

-- Homepage Analytics
DROP POLICY IF EXISTS "Public can insert analytics" ON public.homepage_analytics;
CREATE POLICY "Public can insert analytics"
ON public.homepage_analytics FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Admins view analytics" ON public.homepage_analytics;
CREATE POLICY "Admins view analytics"
ON public.homepage_analytics FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
  )
);

-- 8. Grants
GRANT SELECT ON public.success_stories TO anon, authenticated;
GRANT SELECT ON public.homepage_versions TO anon, authenticated;
GRANT INSERT ON public.homepage_analytics TO anon, authenticated;
GRANT SELECT ON public.homepage_analytics TO authenticated;

-- 9. Trigger for updated_at on success_stories
DROP TRIGGER IF EXISTS on_success_stories_updated ON public.success_stories;
CREATE TRIGGER on_success_stories_updated
    BEFORE UPDATE ON public.success_stories
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- 10. Initial Published Version (Seed)
INSERT INTO public.homepage_versions (status, configuration_json)
SELECT 'published', '{
  "sections": [
    { "id": "hero", "visible": true, "settings": { "headline": "One Membership. Endless Impact.", "subheadline": "We turn predictable monthly contributions into reliable funding for Mauritius most effective long-horizon social programs.", "primaryCTA": { "text": "Start Supporting", "link": "/signup" }, "secondaryCTA": { "text": "Explore Initiatives", "link": "/initiatives" } } },
    { "id": "stats", "visible": true, "settings": { "metrics": [ { "id": "donations", "label": "Total Donations", "auto": true }, { "id": "ngos", "label": "Total NGOs", "auto": true }, { "id": "volunteers", "label": "Total Volunteers", "auto": true }, { "id": "campaigns", "label": "Total Campaigns", "auto": true } ] } },
    { "id": "featured", "visible": true, "settings": { "limit": 4, "manual_ids": [] } },
    { "id": "urgent", "visible": true, "settings": { "limit": 4, "auto": true } },
    { "id": "trending", "visible": true, "settings": { "limit": 4, "auto": true } },
    { "id": "volunteers", "visible": false, "settings": { "limit": 4, "auto": true } },
    { "id": "success", "visible": false, "settings": { "limit": 3 } },
    { "id": "partners", "visible": true, "settings": {} },
    { "id": "updates", "visible": false, "settings": {} },
    { "id": "faq", "visible": true, "settings": {} },
    { "id": "newsletter", "visible": true, "settings": {} }
  ]
}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.homepage_versions WHERE status = 'published');

