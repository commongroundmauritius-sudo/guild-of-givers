-- Placeholder for remote migration initiative_slug_enforcement
ALTER TABLE public.initiatives ALTER COLUMN slug SET NOT NULL;
