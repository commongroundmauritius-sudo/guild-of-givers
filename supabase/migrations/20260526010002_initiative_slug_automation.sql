-- Placeholder for remote migration initiative_slug_automation
-- Already applied on remote, synchronized here for order.
DO $$ BEGIN
    -- Ensure slug column is populated
    UPDATE public.initiatives SET slug = lower(regexp_replace(title, '[^a-zA-Z0-9]+', '-', 'g')) WHERE slug IS NULL;
END $$;
