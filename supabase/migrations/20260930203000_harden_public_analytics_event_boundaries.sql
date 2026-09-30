-- Public analytics/event intake is intentionally anonymous, but must only accept
-- the event shapes the browser tracking layer actually emits.

DROP POLICY IF EXISTS "Public can insert analytics" ON public.homepage_analytics;

CREATE POLICY "Public can insert validated analytics"
ON public.homepage_analytics
FOR INSERT
TO anon, authenticated
WITH CHECK (
  event_type = 'view'
  AND length(btrim(section_id)) BETWEEN 1 AND 100
  AND (
    version_id IS NULL
    OR EXISTS (
      SELECT 1
      FROM public.homepage_versions v
      WHERE v.id = homepage_analytics.version_id
        AND v.status = 'published'
    )
  )
  AND (user_id IS NULL OR user_id = (SELECT auth.uid()))
  AND (session_id IS NULL OR length(session_id) BETWEEN 1 AND 128)
  AND jsonb_typeof(coalesce(metadata, '{}'::jsonb)) = 'object'
);

DROP POLICY IF EXISTS "Allow public insert initiative_events" ON public.initiative_events;

CREATE POLICY "Public can insert validated initiative events"
ON public.initiative_events
FOR INSERT
TO anon, authenticated
WITH CHECK (
  event_type = 'view'
  AND (user_id IS NULL OR user_id = (SELECT auth.uid()))
  AND (session_id IS NULL OR length(session_id) BETWEEN 1 AND 128)
  AND (
    initiative_id IS NULL
    OR EXISTS (
      SELECT 1
      FROM public.initiatives i
      WHERE i.id = initiative_events.initiative_id
        AND i.is_approved = true
        AND i.is_published = true
    )
  )
  AND (
    campaign_link_id IS NULL
    OR EXISTS (
      SELECT 1
      FROM public.campaign_links c
      WHERE c.id = initiative_events.campaign_link_id
        AND c.is_active = true
    )
  )
  AND jsonb_typeof(coalesce(metadata, '{}'::jsonb)) = 'object'
);
