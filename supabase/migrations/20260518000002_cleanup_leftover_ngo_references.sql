-- 1. Rename Primary Key constraints
DO $$ BEGIN ALTER TABLE public.organizations RENAME CONSTRAINT ngos_pkey TO organizations_pkey; EXCEPTION WHEN OTHERS THEN END; $$;
DO $$ BEGIN ALTER TABLE public.organization_documents RENAME CONSTRAINT ngo_documents_pkey TO organization_documents_pkey; EXCEPTION WHEN OTHERS THEN END; $$;

-- 2. Rename Foreign Key constraints
DO $$ BEGIN ALTER TABLE public.profiles RENAME CONSTRAINT profiles_ngo_id_fkey TO profiles_organization_id_fkey; EXCEPTION WHEN OTHERS THEN END; $$;
DO $$ BEGIN ALTER TABLE public.member_preferences RENAME CONSTRAINT member_preferences_ngo_id_fkey TO member_preferences_organization_id_fkey; EXCEPTION WHEN OTHERS THEN END; $$;
DO $$ BEGIN ALTER TABLE public.subscriptions RENAME CONSTRAINT subscriptions_ngo_id_fkey TO subscriptions_organization_id_fkey; EXCEPTION WHEN OTHERS THEN END; $$;
DO $$ BEGIN ALTER TABLE public.allocations RENAME CONSTRAINT allocations_ngo_id_fkey TO allocations_organization_id_fkey; EXCEPTION WHEN OTHERS THEN END; $$;
DO $$ BEGIN ALTER TABLE public.initiatives RENAME CONSTRAINT initiatives_ngo_id_fkey TO initiatives_organization_id_fkey; EXCEPTION WHEN OTHERS THEN END; $$;
DO $$ BEGIN ALTER TABLE public.organization_documents RENAME CONSTRAINT ngo_documents_ngo_id_fkey TO organization_documents_organization_id_fkey; EXCEPTION WHEN OTHERS THEN END; $$;
DO $$ BEGIN ALTER TABLE public.reports RENAME CONSTRAINT reports_ngo_id_fkey TO reports_organization_id_fkey; EXCEPTION WHEN OTHERS THEN END; $$;

-- 3. Rename Unique constraints
DO $$ BEGIN ALTER TABLE public.organizations RENAME CONSTRAINT unique_ngo_name TO unique_organization_name; EXCEPTION WHEN OTHERS THEN END; $$;
DO $$ BEGIN ALTER TABLE public.initiatives RENAME CONSTRAINT unique_ngo_initiative_title TO unique_organization_initiative_title; EXCEPTION WHEN OTHERS THEN END; $$;

-- 4. Rename Indices
DO $$ BEGIN EXECUTE 'ALTER INDEX IF EXISTS idx_initiatives_ngo_id RENAME TO idx_initiatives_organization_id'; EXCEPTION WHEN OTHERS THEN END; $$;
DO $$ BEGIN EXECUTE 'ALTER INDEX IF EXISTS idx_ngo_documents_ngo_id RENAME TO idx_organization_documents_organization_id'; EXCEPTION WHEN OTHERS THEN END; $$;
DO $$ BEGIN EXECUTE 'ALTER INDEX IF EXISTS idx_ngos_owner_id RENAME TO idx_organizations_owner_user_id'; EXCEPTION WHEN OTHERS THEN END; $$;
DO $$ BEGIN EXECUTE 'ALTER INDEX IF EXISTS idx_profiles_ngo_id RENAME TO idx_profiles_organization_id'; EXCEPTION WHEN OTHERS THEN END; $$;
DO $$ BEGIN EXECUTE 'ALTER INDEX IF EXISTS idx_reports_ngo_id RENAME TO idx_reports_organization_id'; EXCEPTION WHEN OTHERS THEN END; $$;

-- 5. Fix default value
ALTER TABLE public.initiatives ALTER COLUMN initiative_source SET DEFAULT 'organization_submission';

-- 6. Hardening has_role and handle_new_user (Already handled in previous migration but ensuring consistency)
CREATE OR REPLACE FUNCTION public.has_role(requested_role app_role)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = (SELECT auth.uid())
    AND role = requested_role
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  sub_amount DECIMAL;
  fee_cover BOOLEAN;
BEGIN
  INSERT INTO public.profiles (id, full_name, email, phone)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    new.email,
    new.raw_user_meta_data->>'phone'
  )
  ON CONFLICT (id) DO UPDATE
  SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    phone = COALESCE(EXCLUDED.phone, profiles.phone);

  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'member')
  ON CONFLICT (user_id, role) DO NOTHING;

  sub_amount := (new.raw_user_meta_data->>'subscription_amount')::NUMERIC;
  fee_cover := COALESCE((new.raw_user_meta_data->>'covers_fees')::BOOLEAN, false);

  IF sub_amount IS NOT NULL AND sub_amount > 0 THEN
    INSERT INTO public.subscriptions (user_id, amount_mur, status, covers_fees)
    VALUES (new.id, sub_amount, 'pending', fee_cover);
  END IF;

  RETURN new;
END;
$function$;
