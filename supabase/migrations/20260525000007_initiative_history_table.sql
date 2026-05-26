-- Initiative History & Archiving
-- Resolves [P1-011]

BEGIN;

CREATE TABLE IF NOT EXISTS public.initiative_monthly_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    initiative_id UUID REFERENCES public.initiatives(id) ON DELETE CASCADE NOT NULL,
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    target_amount_mur NUMERIC NOT NULL,
    received_amount_mur NUMERIC NOT NULL,
    remaining_amount_mur NUMERIC NOT NULL,
    overflow_amount_mur NUMERIC NOT NULL,
    supporter_count INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(initiative_id, month, year)
);

ALTER TABLE public.initiative_monthly_records ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'initiative_monthly_records') THEN
        CREATE POLICY "Anyone can view initiative history" ON public.initiative_monthly_records
        FOR SELECT USING (true);

        CREATE POLICY "Admins can manage initiative history" ON public.initiative_monthly_records
        FOR ALL USING (public.has_role('admin'));

    END IF;
END $$;
-- Function to archive and reset cycles (Monthly Rollover)
CREATE OR REPLACE FUNCTION public.perform_monthly_rollover()
RETURNS VOID AS $$
DECLARE
    v_prev_month INTEGER;
    v_prev_year INTEGER;
    v_current_month INTEGER;
    v_current_year INTEGER;
    v_billing_cycle_id UUID;
BEGIN
    v_current_month := EXTRACT(MONTH FROM now());
    v_current_year := EXTRACT(YEAR FROM now());

    -- Copy active data to history before reset
    INSERT INTO public.initiative_monthly_records (initiative_id, month, year, target_amount_mur, received_amount_mur, remaining_amount_mur, overflow_amount_mur, supporter_count)
    SELECT initiative_id, month, year, target_amount_mur, received_amount_mur, remaining_amount_mur, overflow_amount_mur, supporter_count
    FROM public.initiative_funding_cycles
    WHERE status != 'active' OR (month < v_current_month OR year < v_current_year)
    ON CONFLICT (initiative_id, month, year) DO UPDATE SET
        received_amount_mur = EXCLUDED.received_amount_mur,
        supporter_count = EXCLUDED.supporter_count;

    -- Note: Actual resetting of 'received_amount_mur' happens by creating a NEW funding cycle record
    -- for the new month in the allocation engine or a separate init script.
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMIT;
