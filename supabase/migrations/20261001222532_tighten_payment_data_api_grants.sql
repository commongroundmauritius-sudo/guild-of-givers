
revoke all on table public.payment_intents from anon, authenticated;

revoke all on table public.payment_events from authenticated;

revoke select on table public.payments from anon;
