-- Migration: 20240401000000_consolidate_rls.sql
-- Description: Consolidate redundant RLS policies and optimize performance with (SELECT auth.uid())

BEGIN;

-- Update has_role function to use optimized subquery
CREATE OR REPLACE FUNCTION public.has_role(requested_role public.app_role)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = (SELECT auth.uid())
    AND role = requested_role
  );
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;


-- 1. member_preferences
DROP POLICY IF EXISTS "Admins can view all preferences" ON public.member_preferences;
DROP POLICY IF EXISTS "Users can insert their own preferences" ON public.member_preferences;
DROP POLICY IF EXISTS "Users can manage own preferences" ON public.member_preferences;
DROP POLICY IF EXISTS "Users can update their own preferences" ON public.member_preferences;
DROP POLICY IF EXISTS "Users can view their own preferences" ON public.member_preferences;

CREATE POLICY "Admins can view all preferences" ON public.member_preferences
FOR SELECT USING (has_role('admin'::app_role));

CREATE POLICY "Users can manage own preferences" ON public.member_preferences
FOR ALL USING (user_id = (SELECT auth.uid()));


-- 2. profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

CREATE POLICY "Admins can view all profiles" ON public.profiles
FOR SELECT USING (has_role('admin'::app_role));

CREATE POLICY "Users can manage own profile" ON public.profiles
FOR ALL USING (id = (SELECT auth.uid()));


-- 3. user_roles
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can insert their own role" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;

CREATE POLICY "Admins can view all roles" ON public.user_roles
FOR SELECT USING (has_role('admin'::app_role));

CREATE POLICY "Users can view own roles" ON public.user_roles
FOR SELECT USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own role" ON public.user_roles
FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));


-- 4. Clean up any other redundant policies on other tables while we are at it
-- initiatives
DROP POLICY IF EXISTS "Admins have full access to initiatives" ON public.initiatives;
DROP POLICY IF EXISTS "Admins can manage initiatives" ON public.initiatives;

CREATE POLICY "Admins have full access to initiatives" ON public.initiatives
FOR ALL USING (has_role('admin'::app_role));

-- organizations
DROP POLICY IF EXISTS "Admins can manage Organizations" ON public.organizations;
CREATE POLICY "Admins can manage Organizations" ON public.organizations
FOR ALL USING (has_role('admin'::app_role));

-- subscriptions
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can insert their own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.subscriptions;

CREATE POLICY "Admins can view all subscriptions" ON public.subscriptions
FOR SELECT USING (has_role('admin'::app_role));

CREATE POLICY "Users can view own subscriptions" ON public.subscriptions
FOR SELECT USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own subscriptions" ON public.subscriptions
FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));

-- payments
DROP POLICY IF EXISTS "Admins can view all payments" ON public.payments;
DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;

CREATE POLICY "Admins can view all payments" ON public.payments
FOR SELECT USING (has_role('admin'::app_role));

CREATE POLICY "Users can view own payments" ON public.payments
FOR SELECT USING (user_id = (SELECT auth.uid()));

-- receipts
DROP POLICY IF EXISTS "Admins can view all receipts" ON public.receipts;
DROP POLICY IF EXISTS "Users can view own receipts" ON public.receipts;

CREATE POLICY "Admins can view all receipts" ON public.receipts
FOR SELECT USING (has_role('admin'::app_role));

CREATE POLICY "Users can view own receipts" ON public.receipts
FOR SELECT USING (user_id = (SELECT auth.uid()));

COMMIT;
