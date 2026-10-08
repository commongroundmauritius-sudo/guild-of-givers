DROP POLICY IF EXISTS "Public can insert validated initiative events" ON public.initiative_events;
CREATE POLICY "Public can insert validated initiative events"
ON public.initiative_events
FOR INSERT
TO anon, authenticated
WITH CHECK (
  event_type IN ('initiative_view','share_click','member_acquired','member_conversion')
  AND (user_id IS NULL OR user_id = (SELECT auth.uid()))
  AND (session_id IS NULL OR length(session_id) BETWEEN 1 AND 128)
  AND (
    initiative_id IS NULL
    OR EXISTS (
      SELECT 1 FROM public.initiatives i
      WHERE i.id = initiative_events.initiative_id
        AND i.is_approved = true
        AND i.is_published = true
    )
  )
  AND (
    campaign_link_id IS NULL
    OR EXISTS (
      SELECT 1 FROM public.campaign_links c
      WHERE c.id = initiative_events.campaign_link_id
        AND c.is_active = true
    )
  )
  AND jsonb_typeof(coalesce(metadata, '{}'::jsonb)) = 'object'
);
