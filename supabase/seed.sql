-- Seed Organizations
-- Note: 'organization_name' is the modern identifying field.
-- 'name' is handled via legacy rename migrations if it exists.
DO $$
BEGIN
    INSERT INTO public.organizations (id, organization_name, description, is_verified)
    VALUES
      ('a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d', 'Coral Guardians Mauritius', 'Protecting and restoring the coral reefs of Mauritius.', true),
      ('b2c3d4e5-f6a7-4b6c-8d7e-9f0a1b2c3d4e', 'Mauritius Education Fund', 'Providing scholarships and educational resources to underprivileged children.', true),
      ('c3d4e5f6-a7b8-4c7d-8e9f-0a1b2c3d4e5f', 'Eco-Farm Initiative', 'Promoting sustainable agriculture and food security in local communities.', false)
    ON CONFLICT (id) DO NOTHING;
END $$;

-- Seed Initiatives
INSERT INTO public.initiatives (organization_id, title, description, goal_amount_mur, current_amount_mur, status)
VALUES
  ('a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d', 'Reef Restoration 2024', 'Planting 5000 new coral fragments in the Blue Bay region.', 500000, 125000, 'active'),
  ('b2c3d4e5-f6a7-4b6c-8d7e-9f0a1b2c3d4e', 'Scholarships for Rodrigues', 'Full tuition coverage for 50 students in Rodrigues for the upcoming academic year.', 1000000, 450000, 'active'),
  ('c3d4e5f6-a7b8-4c7d-8e9f-0a1b2c3d4e5f', 'Community Greenhouse Project', 'Building solar-powered greenhouses for 10 local villages.', 750000, 0, 'active')
ON CONFLICT DO NOTHING;

-- Seed the minimum financial configuration required by the signup/payment E2E.
-- These are local-only fixtures; no production data is copied into CI.
INSERT INTO public.fee_configurations (fee_type, percentage_value, fixed_amount_mur, active)
SELECT 'percentage', 0, 0, true
WHERE NOT EXISTS (
  SELECT 1 FROM public.fee_configurations WHERE active = true
);

INSERT INTO public.financial_accounts (account_type, is_system, cached_balance_mur)
SELECT 'platform', true, 0
WHERE NOT EXISTS (
  SELECT 1 FROM public.financial_accounts
  WHERE account_type = 'platform' AND is_system = true
);

INSERT INTO public.financial_accounts (account_type, is_system, cached_balance_mur)
SELECT 'organization_pool', true, 0
WHERE NOT EXISTS (
  SELECT 1 FROM public.financial_accounts
  WHERE account_type = 'organization_pool' AND is_system = true
);

INSERT INTO public.financial_accounts (account_type, is_system, cached_balance_mur)
SELECT 'fee', true, 0
WHERE NOT EXISTS (
  SELECT 1 FROM public.financial_accounts
  WHERE account_type = 'fee' AND is_system = true
);

DO $$
DECLARE
  v_impact_pool_id uuid;
BEGIN
  SELECT id INTO v_impact_pool_id
  FROM public.initiatives
  WHERE is_impact_pool = true
    AND is_system_owned = true
  LIMIT 1;

  IF v_impact_pool_id IS NULL THEN
    INSERT INTO public.initiatives (
      organization_id,
      title,
      description,
      goal_amount_mur,
      current_amount_mur,
      status,
      is_impact_pool,
      is_unlimited,
      is_system_owned,
      is_approved,
      is_published,
      monthly_target_mur,
      initiative_source
    )
    VALUES (
      NULL,
      'Impact Pool',
      'Local test fallback pool.',
      0,
      0,
      'active',
      true,
      true,
      true,
      true,
      true,
      0,
      'admin_created'
    )
    RETURNING id INTO v_impact_pool_id;
  END IF;

  INSERT INTO public.financial_accounts (account_type, is_system, reference_id, cached_balance_mur)
  SELECT 'impact_pool', true, v_impact_pool_id, 0
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.financial_accounts
    WHERE reference_id = v_impact_pool_id
  );
END $$;

