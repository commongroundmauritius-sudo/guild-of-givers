-- Ensure initiative and organization schema alignment for downstream views
-- Resolves SQLSTATE 42703 (column does not exist) errors in CI

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
