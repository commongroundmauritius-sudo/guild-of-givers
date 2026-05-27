-- Migration: CI Alignment
-- Purpose: Ensure columns used in 2026 logic migrations are present.
-- This prevents SQLSTATE 42703 in CI environments starting from older snapshots.

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
