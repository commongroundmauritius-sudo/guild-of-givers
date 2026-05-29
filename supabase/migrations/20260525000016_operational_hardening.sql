-- Step 1: Add lifecycle timestamps to leads
ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS first_seen_at TIMESTAMPTZ DEFAULT now(),
ADD COLUMN IF NOT EXISTS converted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ DEFAULT now();

-- Step 2: Ensure critical events are unique per user/initiative to prevent duplication
-- We allow multiple page_views but only one member_acquired per user/initiative
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'initiative_events') THEN
        CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_member_acquisition
        ON public.initiative_events (user_id, initiative_id)
        WHERE event_type = 'member_acquired';
    END IF;
END $$;

-- Step 3: Implement robust reconciliation function
CREATE OR REPLACE FUNCTION public.reconcile_initiative_analytics(p_initiative_id UUID)
RETURNS VOID AS $$
DECLARE
    v_views INTEGER;
    v_acquired INTEGER;
    v_active INTEGER;
    v_inactive INTEGER;
BEGIN
    -- Count Views
    SELECT count(*) INTO v_views
    FROM public.initiative_events
    WHERE initiative_id = p_initiative_id AND event_type = 'page_view';

    -- Count Members Acquired
    SELECT count(*) INTO v_acquired
    FROM public.initiative_events
    WHERE initiative_id = p_initiative_id AND event_type = 'member_acquired';

    -- Count Active Supporters
    SELECT count(*) INTO v_active
    FROM public.subscriptions s
    JOIN public.profiles p ON s.user_id = p.id
    WHERE p.primary_initiative_id = p_initiative_id AND s.status = 'active';

    -- Count Inactive Supporters
    SELECT count(*) INTO v_inactive
    FROM public.subscriptions s
    JOIN public.profiles p ON s.user_id = p.id
    WHERE p.primary_initiative_id = p_initiative_id AND s.status IN ('cancelled', 'past_due');

    -- Update counters on initiative
    UPDATE public.initiatives
    SET view_count = v_views,
        conversion_count = v_acquired,
        active_supporter_count = v_active,
        inactive_supporter_count = v_inactive,
        updated_at = now()
    WHERE id = p_initiative_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Step 4: Update handle_new_user to set converted_at
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sub_amount DECIMAL;
  fee_cover BOOLEAN;
  source_init_id UUID;
BEGIN
  -- Extract attribution metadata
  BEGIN
    source_init_id := (new.raw_user_meta_data->>'source_initiative_id')::UUID;
  EXCEPTION WHEN OTHERS THEN
    source_init_id := NULL;
  END;

  -- 1. Initialize Profile with attribution
  INSERT INTO public.profiles (id, full_name, email, source_initiative_id, primary_initiative_id)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    new.email,
    source_init_id,
    source_init_id
  )
  ON CONFLICT (id) DO UPDATE
  SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    source_initiative_id = COALESCE(profiles.source_initiative_id, EXCLUDED.source_initiative_id),
    primary_initiative_id = COALESCE(profiles.primary_initiative_id, EXCLUDED.primary_initiative_id);

  -- 2. Initialize Role (defaulting to member)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'member')
  ON CONFLICT (user_id, role) DO NOTHING;

  -- 3. Initialize Subscription if metadata is present
  BEGIN
    sub_amount := (new.raw_user_meta_data->>'subscription_amount')::NUMERIC;
  EXCEPTION WHEN OTHERS THEN
    sub_amount := NULL;
  END;

  fee_cover := COALESCE((new.raw_user_meta_data->>'covers_fees')::BOOLEAN, false);

  IF sub_amount IS NOT NULL AND sub_amount > 0 THEN
    INSERT INTO public.subscriptions (user_id, amount_mur, status, covers_fees)
    VALUES (new.id, sub_amount, 'pending', fee_cover);
  END IF;

  -- 4. Automatically set member preference if source_initiative_id exists
  IF source_init_id IS NOT NULL THEN
    INSERT INTO public.member_preferences (user_id, initiative_id, priority_level)
    VALUES (new.id, source_init_id, 1)
    ON CONFLICT (user_id, initiative_id) DO NOTHING;
  END IF;

  -- 5. Update lead status if exists
  UPDATE public.leads
  SET status = 'converted',
      converted_at = now(),
      last_activity_at = now()
  WHERE email = new.email;

  RETURN new;
END;
$$;
