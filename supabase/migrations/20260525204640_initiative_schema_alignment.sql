-- Ensure initiative and organization schema alignment for downstream views
-- Resolves SQLSTATE 42703 (column does not exist) errors in CI
-- Addresses Security Advisory: RLS Disabled on public tables

-- 1. Ensure initiatives columns exist
ALTER TABLE public.initiatives ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.initiatives ADD COLUMN IF NOT EXISTS summary TEXT;
ALTER TABLE public.initiatives ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.initiatives ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false;
ALTER TABLE public.initiatives ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT false;
ALTER TABLE public.initiatives ADD COLUMN IF NOT EXISTS gallery_urls TEXT[] DEFAULT '{}';
ALTER TABLE public.initiatives ADD COLUMN IF NOT EXISTS active_supporter_count INTEGER DEFAULT 0;

-- 2. Ensure organizations columns exist
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- 3. Security Hardening: Ensure RLS is enabled on critical tables
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'member_preferences') THEN
        ALTER TABLE public.member_preferences ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;
