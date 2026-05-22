ALTER TABLE public.allocations ADD COLUMN IF NOT EXISTS potential_amount_mur NUMERIC DEFAULT 0;
ALTER TABLE public.allocations ADD COLUMN IF NOT EXISTS is_overflow BOOLEAN DEFAULT false;
