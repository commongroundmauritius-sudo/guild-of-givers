-- 1. Create a fresh system-owned "CommonGround Impact Pool" initiative
DO $$
DECLARE
    v_platform_org_id UUID;
    v_new_impact_pool_id UUID;
BEGIN
    -- Get or create platform organization
    SELECT id INTO v_platform_org_id FROM public.organizations WHERE organization_name = 'CommonGround Platform';

    IF v_platform_org_id IS NULL THEN
        INSERT INTO public.organizations (organization_name, is_verified, status)
        VALUES ('CommonGround Platform', true, 'active')
        RETURNING id INTO v_platform_org_id;
    END IF;

    -- Create new impact pool initiative
    INSERT INTO public.initiatives (
        organization_id,
        title,
        description,
        is_impact_pool,
        is_system_owned,
        is_approved,
        is_published,
        status,
        goal_amount_mur,
        is_unlimited
    )
    VALUES (
        v_platform_org_id,
        'CommonGround Impact Pool',
        'The primary fallback destination for all platform contributions. Funds in the impact pool are distributed to high-impact projects across the CommonGround network.',
        true,
        true,
        true,
        true,
        'active',
        999999999, -- Effectively unlimited
        true
    )
    RETURNING id INTO v_new_impact_pool_id;

    -- 2. Migrate references from old impact pools
    -- Update allocations
    UPDATE public.allocations
    SET initiative_id = v_new_impact_pool_id
    WHERE initiative_id IN (
        SELECT id FROM public.initiatives
        WHERE is_impact_pool = true AND id != v_new_impact_pool_id
    );

    -- Update member preferences
    UPDATE public.member_preferences
    SET initiative_id = v_new_impact_pool_id
    WHERE initiative_id IN (
        SELECT id FROM public.initiatives
        WHERE is_impact_pool = true AND id != v_new_impact_pool_id
    );

    -- Update community posts
    UPDATE public.community_posts
    SET initiative_id = v_new_impact_pool_id
    WHERE initiative_id IN (
        SELECT id FROM public.initiatives
        WHERE is_impact_pool = true AND id != v_new_impact_pool_id
    );

    -- 3. Archive old impact pool initiatives
    UPDATE public.initiatives
    SET
        status = 'archived',
        is_impact_pool = false,
        title = title || ' (Legacy)'
    WHERE is_impact_pool = true AND id != v_new_impact_pool_id;

    -- 4. Initialize financial account for the new impact pool
    -- We use a subquery check to avoid duplicate key error if reference_id already exists
    IF NOT EXISTS (SELECT 1 FROM public.financial_accounts WHERE reference_id = v_new_impact_pool_id) THEN
        INSERT INTO public.financial_accounts (account_type, reference_id, is_system)
        VALUES ('initiative', v_new_impact_pool_id, false);
    END IF;

END $$;
