-- Create indices for unindexed foreign keys to improve performance

BEGIN;

CREATE INDEX IF NOT EXISTS idx_admin_actions_admin_id ON public.admin_actions(admin_id);
CREATE INDEX IF NOT EXISTS idx_allocations_initiative_id ON public.allocations(initiative_id);
CREATE INDEX IF NOT EXISTS idx_allocations_payment_id ON public.allocations(payment_id);
CREATE INDEX IF NOT EXISTS idx_initiative_updates_initiative_id ON public.initiative_updates(initiative_id);
CREATE INDEX IF NOT EXISTS idx_initiatives_ngo_id ON public.initiatives(ngo_id);
CREATE INDEX IF NOT EXISTS idx_member_preferences_initiative_id ON public.member_preferences(initiative_id);
CREATE INDEX IF NOT EXISTS idx_ngo_documents_ngo_id ON public.ngo_documents(ngo_id);
CREATE INDEX IF NOT EXISTS idx_ngos_owner_id ON public.ngos(owner_id);
CREATE INDEX IF NOT EXISTS idx_payments_subscription_id ON public.payments(subscription_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_ngo_id ON public.profiles(ngo_id);
CREATE INDEX IF NOT EXISTS idx_receipts_payment_id ON public.receipts(payment_id);
CREATE INDEX IF NOT EXISTS idx_receipts_user_id ON public.receipts(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_initiative_id ON public.reports(initiative_id);
CREATE INDEX IF NOT EXISTS idx_reports_ngo_id ON public.reports(ngo_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);

COMMIT;
