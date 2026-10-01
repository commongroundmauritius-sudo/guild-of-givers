-- Reduce direct client grants on financial read tables to SELECT only.
-- RLS remains authoritative for which rows each authenticated user can see.

revoke all on table public.subscriptions from anon, authenticated;
grant select on table public.subscriptions to authenticated;

revoke all on table public.payments from anon, authenticated;
grant select on table public.payments to authenticated;

revoke all on table public.receipts from anon, authenticated;
grant select on table public.receipts to authenticated;

revoke all on table public.financial_events from anon, authenticated;
grant select on table public.financial_events to authenticated;
