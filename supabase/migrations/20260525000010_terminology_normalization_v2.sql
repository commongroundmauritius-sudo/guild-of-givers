-- Terminology Normalization Phase B (Database Values)
-- Resolves [P3-003]

BEGIN;

-- 1. Standardize system account records
UPDATE public.financial_accounts
SET account_type = 'organization_pool'
WHERE account_type::text = 'ngo_pool';

-- 2. Audit and update enum comments
COMMENT ON TYPE public.app_role IS 'Roles: admin, member, organization (formerly ngo)';
COMMENT ON COLUMN public.financial_accounts.account_type IS 'Types: platform, organization_pool, impact_pool, fee, initiative';

COMMIT;
