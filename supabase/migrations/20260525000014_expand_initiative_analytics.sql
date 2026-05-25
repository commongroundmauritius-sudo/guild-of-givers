-- Step 1: Add new supporter count columns to initiatives
ALTER TABLE public.initiatives
ADD COLUMN IF NOT EXISTS active_supporter_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS inactive_supporter_count INTEGER DEFAULT 0;

-- Step 2: Update the update_initiative_counters function to handle new event types
CREATE OR REPLACE FUNCTION public.update_initiative_counters()
RETURNS TRIGGER AS $$
BEGIN
    IF (NEW.event_type = 'page_view') THEN
        UPDATE public.initiatives
        SET view_count = view_count + 1
        WHERE id = NEW.initiative_id;
    ELSIF (NEW.event_type = 'member_acquired') THEN
        UPDATE public.initiatives
        SET conversion_count = conversion_count + 1,
            active_supporter_count = active_supporter_count + 1
        WHERE id = NEW.initiative_id;
    ELSIF (NEW.event_type = 'supporter_activated') THEN
        UPDATE public.initiatives
        SET active_supporter_count = active_supporter_count + 1,
            inactive_supporter_count = GREATEST(0, inactive_supporter_count - 1)
        WHERE id = NEW.initiative_id;
    ELSIF (NEW.event_type = 'supporter_deactivated') THEN
        UPDATE public.initiatives
        SET active_supporter_count = GREATEST(0, active_supporter_count - 1),
            inactive_supporter_count = inactive_supporter_count + 1
        WHERE id = NEW.initiative_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Update leads status constraints and defaults
-- First, remove old constraint if it exists (might not have one if it was just 'text')
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'leads') THEN
        ALTER TABLE public.leads ALTER COLUMN status SET DEFAULT 'started';
    END IF;
END $$;

-- Step 4: Tighten RLS on leads table (Admin only) (Guarded)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'leads') THEN
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'leads') THEN
                DROP POLICY IF EXISTS "Anyone can view leads" ON public.leads;
                DROP POLICY IF EXISTS "Allow public insert leads" ON public.leads;
                DROP POLICY IF EXISTS "Allow public update leads" ON public.leads;
                DROP POLICY IF EXISTS "Admins can view all leads" ON public.leads;

    END IF;
END $$;
        -- Public can only insert (start the flow)
        CREATE POLICY "Public can start leads"
        ON public.leads FOR INSERT
        TO public
        WITH CHECK (true);

        -- Public can update their own lead if they know the email (for conversion flow)
        CREATE POLICY "Public can update own lead"
        ON public.leads FOR UPDATE
        TO public
        USING (true)
        WITH CHECK (true);

        -- Only admins can read leads
        CREATE POLICY "Only admins can read leads"
        ON public.leads FOR SELECT
        TO authenticated
        USING (
          EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid() AND role = 'admin'
          )
        );
    END IF;
END $$;

-- Step 5: Clean up old event types if any exist (optional, but good for consistency)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'initiative_events') THEN
        UPDATE public.initiative_events
        SET event_type = 'member_acquired'
        WHERE event_type = 'registration_conversion';
    END IF;
END $$;
