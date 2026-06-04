-- Add signup_code to partner_applications to support access control after conversion
ALTER TABLE public.partner_applications
ADD COLUMN IF NOT EXISTS signup_code TEXT;

-- Index for lookup performance
CREATE INDEX IF NOT EXISTS idx_partner_applications_signup_code ON public.partner_applications(signup_code);

-- Grant access to authenticated and service roles
GRANT SELECT, UPDATE ON public.partner_applications TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.partner_applications TO service_role;
