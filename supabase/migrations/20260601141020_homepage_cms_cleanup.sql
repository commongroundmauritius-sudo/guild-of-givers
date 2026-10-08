-- Cleanup legacy homepage tables
DROP TABLE IF EXISTS public.homepage_featured_initiatives;

-- Note: We keep homepage_settings for now as a precaution, 
-- but we could migrate data if needed. 
-- For now, the new system is entirely in homepage_versions.

