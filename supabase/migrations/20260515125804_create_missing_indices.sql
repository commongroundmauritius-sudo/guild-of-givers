-- Create missing indices for performance

-- Financial/Core joins
CREATE INDEX IF NOT EXISTS idx_initiatives_organization_id ON public.initiatives(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_documents_organization_id ON public.organization_documents(organization_id);
CREATE INDEX IF NOT EXISTS idx_organizations_owner_user_id ON public.organizations(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_organization_id ON public.profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_reports_organization_id ON public.reports(organization_id);

-- User lookup
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Financial tracking
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_allocations_payment_id ON public.allocations(payment_id);
CREATE INDEX IF NOT EXISTS idx_allocations_initiative_id ON public.allocations(initiative_id);
