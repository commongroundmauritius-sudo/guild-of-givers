-- Add is_unlimited column to initiatives
ALTER TABLE public.initiatives ADD COLUMN IF NOT EXISTS is_unlimited BOOLEAN DEFAULT false;

-- Correct the Impact Pool initiative architecture
-- 1. Ensure platform internal organization exists
DO $$
DECLARE
    v_platform_org_id UUID;
BEGIN
    SELECT id INTO v_platform_org_id FROM public.organizations WHERE organization_name = 'CommonGround Platform' LIMIT 1;

    IF v_platform_org_id IS NULL THEN
        INSERT INTO public.organizations (organization_name, status, is_verified)
        VALUES ('CommonGround Platform', 'active', true)
        RETURNING id INTO v_platform_org_id;
    END IF;

    -- 2. Update existing Impact Pool to be owned by CommonGround Platform
    UPDATE public.initiatives
    SET organization_id = v_platform_org_id,
        is_unlimited = true,
        title = 'CommonGround Impact Pool',
        description = 'Build a physical CommonGround Community Hub where Organizations can meet and host activities.'
    WHERE is_impact_pool = true;

    -- 3. Ensure an Impact Pool exists if it didn't
    IF NOT EXISTS (SELECT 1 FROM public.initiatives WHERE is_impact_pool = true) THEN
        INSERT INTO public.initiatives (
            organization_id,
            title,
            description,
            is_impact_pool,
            is_unlimited,
            goal_amount_mur,
            current_amount_mur,
            is_approved,
            is_published
        )
        VALUES (
            v_platform_org_id,
            'CommonGround Impact Pool',
            'Build a physical CommonGround Community Hub where Organizations can meet and host activities.',
            true,
            true,
            0,
            0,
            true,
            true
        );
    END IF;
END;
$$;

-- Update Allocation Sub-function to respect is_unlimited and ensure correct ownership lookup
CREATE OR REPLACE FUNCTION public.allocate_payment_funds(p_payment_id UUID, p_user_id UUID, p_total_amount NUMERIC)
RETURNS VOID AS $$
DECLARE
    v_net_pool NUMERIC;
    v_remaining NUMERIC;
    v_pref RECORD;
    v_initiative_id UUID;
    v_cap NUMERIC;
    v_current NUMERIC;
    v_space NUMERIC;
    v_to_allocate NUMERIC;
    v_impact_pool_id UUID;
    v_impact_pool_org_id UUID;
    v_potential NUMERIC;
    v_pref_count INTEGER;
BEGIN
    -- 20/80 Split
    v_net_pool := p_total_amount * 0.80;
    v_remaining := v_net_pool;

    -- Get Impact Pool and its Organization ID
    SELECT id, organization_id INTO v_impact_pool_id, v_impact_pool_org_id
    FROM public.initiatives
    WHERE is_impact_pool = true LIMIT 1;

    -- Count preferences for potential split calculation
    SELECT count(*) INTO v_pref_count FROM public.member_preferences WHERE user_id = p_user_id;
    IF v_pref_count = 0 THEN
        v_potential := 0;
    ELSE
        v_potential := v_net_pool / v_pref_count;
    END IF;

    -- Process Priorities
    FOR v_pref IN
        SELECT mp.initiative_id, i.organization_id, i.goal_amount_mur, i.current_amount_mur, i.is_unlimited
        FROM public.member_preferences mp
        JOIN public.initiatives i ON i.id = mp.initiative_id
        WHERE mp.user_id = p_user_id
        ORDER BY mp.priority_level ASC, mp.created_at ASC
    LOOP
        EXIT WHEN v_remaining <= 0;

        IF v_pref.is_unlimited THEN
            v_space := v_remaining;
        ELSE
            v_cap := COALESCE(v_pref.goal_amount_mur, 999999999);
            v_current := COALESCE(v_pref.current_amount_mur, 0);
            v_space := GREATEST(0, v_cap - v_current);
        END IF;

        v_to_allocate := LEAST(v_remaining, v_space);

        IF v_to_allocate > 0 THEN
            INSERT INTO public.allocations (payment_id, initiative_id, organization_id, amount_mur, potential_amount_mur, is_overflow)
            VALUES (p_payment_id, v_pref.initiative_id, v_pref.organization_id, v_to_allocate, v_potential, v_to_allocate < v_potential);

            PERFORM public.increment_initiative_amount(v_pref.initiative_id, v_to_allocate);
            v_remaining := v_remaining - v_to_allocate;
        END IF;
    END LOOP;

    -- Final Fallback to Impact Pool
    IF v_remaining > 0 AND v_impact_pool_id IS NOT NULL THEN
        INSERT INTO public.allocations (payment_id, initiative_id, organization_id, amount_mur, potential_amount_mur, is_overflow)
        VALUES (p_payment_id, v_impact_pool_id, v_impact_pool_org_id, v_remaining, 0, true);

        PERFORM public.increment_initiative_amount(v_impact_pool_id, v_remaining);
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
