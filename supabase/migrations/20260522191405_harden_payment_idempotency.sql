-- Add unique constraint to prevent duplicate payments for the same provider transaction
ALTER TABLE public.payments
ADD CONSTRAINT payments_peach_payment_id_key UNIQUE (peach_payment_id);
