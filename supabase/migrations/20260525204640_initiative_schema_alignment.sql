-- Ensure initiative schema alignment for downstream views
-- Resolves SQLSTATE 42703 (column does not exist) errors in CI

-- 1. Ensure category column exists
ALTER TABLE public.initiatives ADD COLUMN IF NOT EXISTS category TEXT;

-- 2. Ensure summary column exists
ALTER TABLE public.initiatives ADD COLUMN IF NOT EXISTS summary TEXT;

-- 3. Ensure updated_at column exists
ALTER TABLE public.initiatives ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 4. Ensure is_published column exists
ALTER TABLE public.initiatives ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false;

-- 5. Ensure is_approved column exists
ALTER TABLE public.initiatives ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT false;

-- 6. Ensure gallery_urls column exists
ALTER TABLE public.initiatives ADD COLUMN IF NOT EXISTS gallery_urls TEXT[] DEFAULT '{}';

-- 7. Ensure active_supporter_count column exists
ALTER TABLE public.initiatives ADD COLUMN IF NOT EXISTS active_supporter_count INTEGER DEFAULT 0;
