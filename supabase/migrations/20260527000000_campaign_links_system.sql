-- Campaign Link Infrastructure
-- This ensures the table exists for both local and production environments

CREATE TABLE IF NOT EXISTS public.campaign_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    initiative_id UUID REFERENCES public.initiatives(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    tracking_code TEXT UNIQUE NOT NULL,
    source_type TEXT NOT NULL, -- e.g., 'facebook', 'newsletter', 'qr'
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- RLS
ALTER TABLE public.campaign_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active links" ON public.campaign_links;
CREATE POLICY "Public can view active links"
ON public.campaign_links FOR SELECT
TO public
USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage all links" ON public.campaign_links;
CREATE POLICY "Admins can manage all links"
ON public.campaign_links FOR ALL
TO authenticated
USING (public.has_role('admin'));

DROP POLICY IF EXISTS "Staff can manage own initiative links" ON public.campaign_links;
CREATE POLICY "Staff can manage own initiative links"
ON public.campaign_links FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.initiatives i
        JOIN public.profiles p ON i.organization_id = p.organization_id
        WHERE i.id = campaign_links.initiative_id AND p.id = auth.uid()
    )
);

CREATE INDEX IF NOT EXISTS idx_campaign_links_tracking_code ON public.campaign_links(tracking_code);
CREATE INDEX IF NOT EXISTS idx_campaign_links_initiative_id ON public.campaign_links(initiative_id);
