-- Migration: CI Alignment
-- Purpose: Ensure tables and columns used in 2026 logic migrations are present.
-- This prevents SQLSTATE 42703 (column not found) and 42P01 (relation not found)
-- in CI environments starting from older snapshots.

-- 1. Ensure member_preferences exists
CREATE TABLE IF NOT EXISTS public.member_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  initiative_id UUID REFERENCES public.initiatives ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, initiative_id)
);

-- 2. Ensure critical initiative columns exist
DO $$
BEGIN
    -- is_impact_pool
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'initiatives' AND column_name = 'is_impact_pool') THEN
        ALTER TABLE public.initiatives ADD COLUMN is_impact_pool BOOLEAN DEFAULT false;
    END IF;

    -- is_unlimited
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'initiatives' AND column_name = 'is_unlimited') THEN
        ALTER TABLE public.initiatives ADD COLUMN is_unlimited BOOLEAN DEFAULT false;
    END IF;

    -- is_system_owned
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'initiatives' AND column_name = 'is_system_owned') THEN
        ALTER TABLE public.initiatives ADD COLUMN is_system_owned BOOLEAN DEFAULT false;
    END IF;

    -- cap_amount_mur
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'initiatives' AND column_name = 'cap_amount_mur') THEN
        ALTER TABLE public.initiatives ADD COLUMN cap_amount_mur DECIMAL;
    END IF;
END $$;
