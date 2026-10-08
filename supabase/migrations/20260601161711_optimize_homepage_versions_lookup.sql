CREATE INDEX IF NOT EXISTS idx_homepage_versions_created_at ON public.homepage_versions (created_at DESC);
COMMENT ON INDEX idx_homepage_versions_created_at IS 'Optimizes draft retrieval by sorting latest versions first.';
