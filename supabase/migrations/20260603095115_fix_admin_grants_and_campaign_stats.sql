-- 1. Ensure authenticated role has necessary grants on campaign and analytics tables
GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaign_links TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_campaign_stats TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_initiative_stats TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_revenue_stats TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.activities TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.partner_applications TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.partner_application_activity TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organizations TO authenticated;

-- 2. Ensure sequences can be used by authenticated users (essential for INSERTs)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 3. Double check has_role is robust
-- Already confirmed to be SECURITY DEFINER with search_path = public

-- 4. Fix potential issue with daily_campaign_stats RLS being too restrictive for SELECT
-- Some policies might be missing for admins to see ALL stats
DROP POLICY IF EXISTS "Stabilization SELECT access for authenticated" ON public.daily_campaign_stats;
CREATE POLICY "Admins can view all daily campaign stats"
ON public.daily_campaign_stats FOR SELECT
TO authenticated
USING (has_role('admin'::app_role) OR has_role('super_admin'::app_role));

-- 5. Ensure admins can manage ALL campaign links (standardizing names)
DROP POLICY IF EXISTS "Admins can manage all links" ON public.campaign_links;
DROP POLICY IF EXISTS "Admins can manage campaign links" ON public.campaign_links;

CREATE POLICY "Admins can manage all campaign links"
ON public.campaign_links FOR ALL
TO authenticated
USING (has_role('admin'::app_role) OR has_role('super_admin'::app_role))
WITH CHECK (has_role('admin'::app_role) OR has_role('super_admin'::app_role));

