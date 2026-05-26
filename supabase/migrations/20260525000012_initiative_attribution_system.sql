-- Step 1: Add columns to initiatives
ALTER TABLE public.initiatives
ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS conversion_count INTEGER DEFAULT 0;

-- Step 2: Add columns to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS source_initiative_id UUID REFERENCES public.initiatives(id),
ADD COLUMN IF NOT EXISTS primary_initiative_id UUID REFERENCES public.initiatives(id);

-- Step 3: Create initiative_events table
CREATE TABLE IF NOT EXISTS public.initiative_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    initiative_id UUID REFERENCES public.initiatives(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    session_id TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Step 4: Create indexes
CREATE INDEX IF NOT EXISTS idx_initiative_events_initiative_id ON public.initiative_events(initiative_id);
CREATE INDEX IF NOT EXISTS idx_initiative_events_event_type ON public.initiative_events(event_type);
CREATE INDEX IF NOT EXISTS idx_initiative_events_user_id ON public.initiative_events(user_id);
CREATE INDEX IF NOT EXISTS idx_initiative_events_created_at ON public.initiative_events(created_at);
CREATE INDEX IF NOT EXISTS idx_initiative_events_session_id ON public.initiative_events(session_id);
CREATE INDEX IF NOT EXISTS idx_initiatives_slug ON public.initiatives(slug);

-- Step 5: Set up RLS for initiative_events (Guarded)
ALTER TABLE public.initiative_events ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'initiative_events') THEN
        DROP POLICY IF EXISTS "Allow public insert initiative_events" ON public.initiative_events;
        -- Allow anyone to insert events (to track anonymous page views)
        CREATE POLICY "Allow public insert initiative_events"
        ON public.initiative_events FOR INSERT
        TO public
        WITH CHECK (true);

        DROP POLICY IF EXISTS "Allow admins to read initiative_events" ON public.initiative_events;
        -- Allow admins to read all events
        CREATE POLICY "Allow admins to read initiative_events"
        ON public.initiative_events FOR SELECT
        TO authenticated
        USING (
          EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid() AND role = 'admin'
          )
        );
    END IF;
END $$;

-- Step 6: Create function and trigger to update counters
CREATE OR REPLACE FUNCTION public.update_initiative_counters()
RETURNS TRIGGER AS $$
BEGIN
    IF (NEW.event_type = 'page_view') THEN
        UPDATE public.initiatives
        SET view_count = view_count + 1
        WHERE id = NEW.initiative_id;
    ELSIF (NEW.event_type = 'registration_conversion') THEN
        UPDATE public.initiatives
        SET conversion_count = conversion_count + 1
        WHERE id = NEW.initiative_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop if exists to avoid errors on re-run
DROP TRIGGER IF EXISTS trigger_update_initiative_counters ON public.initiative_events;
CREATE TRIGGER trigger_update_initiative_counters
AFTER INSERT ON public.initiative_events
FOR EACH ROW
EXECUTE FUNCTION public.update_initiative_counters();

-- Step 7: Backfill existing initiatives with slugs
DO $$
DECLARE
    rec RECORD;
    base_slug TEXT;
    final_slug TEXT;
    counter INTEGER;
BEGIN
    FOR rec IN SELECT id, title FROM public.initiatives WHERE slug IS NULL LOOP
        -- Simple slugify: lowercase, replace non-alphanumeric with hyphen
        base_slug := lower(regexp_replace(rec.title, '[^a-zA-Z0-9]+', '-', 'g'));
        -- Trim hyphens from start and end
        base_slug := trim(both '-' from base_slug);

        -- If slug becomes empty (e.g. only symbols), use "initiative"
        IF base_slug = '' THEN
            base_slug := 'initiative';
        END IF;

        final_slug := base_slug;
        counter := 1;

        WHILE EXISTS (SELECT 1 FROM public.initiatives WHERE slug = final_slug) LOOP
            counter := counter + 1;
            final_slug := base_slug || '-' || counter;
        END LOOP;

        UPDATE public.initiatives SET slug = final_slug WHERE id = rec.id;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Step 8: Ensure slug is NOT NULL for future inserts
ALTER TABLE public.initiatives ALTER COLUMN slug SET NOT NULL;
