BEGIN;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'initiatives'
      AND column_name = 'monthly_target_mur'
  ) THEN
    UPDATE public.initiatives
    SET goal_amount_mur = monthly_target_mur,
        current_amount_mur = COALESCE((
          SELECT fc.received_amount_mur
          FROM public.initiative_funding_cycles fc
          JOIN public.billing_cycles bc ON bc.id = fc.billing_cycle_id
          WHERE fc.initiative_id = initiatives.id
            AND bc.month = EXTRACT(MONTH FROM now())::int
            AND bc.year = EXTRACT(YEAR FROM now())::int
          LIMIT 1
        ), 0)
    WHERE COALESCE(is_impact_pool, false) = false
      AND monthly_target_mur > 0;
  ELSE
    -- Older schema versions store the initiative goal in goal_amount_mur.
    -- Do not reference the optional monthly_target_mur column when absent.
    UPDATE public.initiatives
    SET current_amount_mur = COALESCE((
      SELECT fc.received_amount_mur
      FROM public.initiative_funding_cycles fc
      JOIN public.billing_cycles bc ON bc.id = fc.billing_cycle_id
      WHERE fc.initiative_id = initiatives.id
        AND bc.month = EXTRACT(MONTH FROM now())::int
        AND bc.year = EXTRACT(YEAR FROM now())::int
      LIMIT 1
    ), 0)
    WHERE COALESCE(is_impact_pool, false) = false;
  END IF;
END
$$;

UPDATE public.initiatives
SET goal_amount_mur = 0,
    current_amount_mur = COALESCE((
      SELECT fc.received_amount_mur
      FROM public.initiative_funding_cycles fc
      JOIN public.billing_cycles bc ON bc.id = fc.billing_cycle_id
      WHERE fc.initiative_id = initiatives.id
        AND bc.month = EXTRACT(MONTH FROM now())::int
        AND bc.year = EXTRACT(YEAR FROM now())::int
      LIMIT 1
    ), 0)
WHERE COALESCE(is_impact_pool, false) = true;
COMMIT;
