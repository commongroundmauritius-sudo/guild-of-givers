-- Add fee cover support to financial tables
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS covers_fees BOOLEAN DEFAULT false;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS fees_covered_amount_mur DECIMAL DEFAULT 0;
