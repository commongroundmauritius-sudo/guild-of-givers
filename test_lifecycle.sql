-- Setup: Create a test initiative
INSERT INTO public.initiatives (id, organization_id, title, slug, is_approved, is_published)
VALUES ('00000000-0000-0000-0000-000000000001', (SELECT id FROM public.organizations LIMIT 1), 'Test Lifecycle', 'test-lifecycle', true, true)
ON CONFLICT (id) DO NOTHING;

-- 1. Visitor landing (Page View)
INSERT INTO public.initiative_events (initiative_id, event_type, session_id)
VALUES ('00000000-0000-0000-0000-000000000001', 'page_view', 'test-session-1');

SELECT view_count FROM public.initiatives WHERE id = '00000000-0000-0000-0000-000000000001';

-- 2. Lead creation
INSERT INTO public.leads (email, full_name, amount_mur, status)
VALUES ('test@example.com', 'Test User', 450, 'started');

SELECT status, first_seen_at FROM public.leads WHERE email = 'test@example.com';

-- 3. Account creation (Simulate handle_new_user trigger)
-- We need to mock auth.users for this or just simulate the trigger call.
-- Actually, the trigger logic was updated. Let's call it or insert into profiles directly to check.
-- But handle_new_user is for auth.users.
-- Let's just verify the trigger logic via the migration file again.

-- 4. Member Acquisition
INSERT INTO public.initiative_events (initiative_id, event_type, user_id, session_id)
VALUES ('00000000-0000-0000-0000-000000000001', 'member_acquired', '00000000-0000-0000-0000-000000000002', 'test-session-1');

SELECT conversion_count, active_supporter_count FROM public.initiatives WHERE id = '00000000-0000-0000-0000-000000000001';

-- 5. Duplicate protection (member_acquired)
-- This should FAIL due to unique index
-- INSERT INTO public.initiative_events (initiative_id, event_type, user_id, session_id)
-- VALUES ('00000000-0000-0000-0000-000000000001', 'member_acquired', '00000000-0000-0000-0000-000000000002', 'test-session-2');

-- 6. Subscription lifecycle
-- Activated
INSERT INTO public.initiative_events (initiative_id, event_type, user_id)
VALUES ('00000000-0000-0000-0000-000000000001', 'supporter_activated', '00000000-0000-0000-0000-000000000002');

SELECT active_supporter_count, inactive_supporter_count FROM public.initiatives WHERE id = '00000000-0000-0000-0000-000000000001';

-- Deactivated
INSERT INTO public.initiative_events (initiative_id, event_type, user_id)
VALUES ('00000000-0000-0000-0000-000000000001', 'supporter_deactivated', '00000000-0000-0000-0000-000000000002');

SELECT active_supporter_count, inactive_supporter_count FROM public.initiatives WHERE id = '00000000-0000-0000-0000-000000000001';

-- 7. Reconciliation
UPDATE public.initiatives SET view_count = 999, active_supporter_count = 999 WHERE id = '00000000-0000-0000-0000-000000000001';
SELECT reconcile_initiative_analytics('00000000-0000-0000-0000-000000000001');

SELECT view_count, conversion_count, active_supporter_count, inactive_supporter_count
FROM public.initiatives WHERE id = '00000000-0000-0000-0000-000000000001';
