-- Restore missing permissions for Success Stories and Homepage Settings

GRANT ALL ON public.success_stories TO authenticated, service_role;
GRANT ALL ON public.homepage_settings TO authenticated, service_role;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;
