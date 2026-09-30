-- Activity intake is public for browser attribution, but must remain limited
-- to the event vocabulary enforced by validate_public_activity_insert().
DROP POLICY IF EXISTS "System can insert activities" ON public.activities;

CREATE POLICY "Public can insert validated activities"
ON public.activities
FOR INSERT
TO anon, authenticated
WITH CHECK (
  event_type IN (
    'homepage_view',
    'initiative_view',
    'share_click',
    'lead_captured',
    'campaign_click',
    'payment_completed'
  )
  AND (
    event_type <> 'payment_completed'
    OR (
      source = 'backend'
      AND COALESCE(current_setting('app.internal_activity_write', true), 'false') = 'true'
    )
  )
  AND (user_id IS NULL OR user_id = (SELECT auth.uid()))
  AND (
    initiative_id IS NULL
    OR EXISTS (
      SELECT 1
      FROM public.initiatives i
      WHERE i.id = activities.initiative_id
        AND i.is_approved = true
        AND i.is_published = true
    )
  )
  AND (
    organization_id IS NULL
    OR EXISTS (
      SELECT 1
      FROM public.organizations o
      WHERE o.id = activities.organization_id
  )
  )
  AND jsonb_typeof(coalesce(metadata, '{}'::jsonb)) = 'object'
);
