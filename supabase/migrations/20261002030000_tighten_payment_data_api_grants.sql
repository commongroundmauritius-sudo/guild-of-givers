-- Tighten direct client access to financial tables.
-- payment_intents and payment_events are backend-only data paths.
-- payments remains readable through authenticated RLS policies only.

revoke all on table public.payment_intents from anon, authenticated;
revoke all on table public.payment_events from authenticated;
revoke select on table public.payments from anon;
