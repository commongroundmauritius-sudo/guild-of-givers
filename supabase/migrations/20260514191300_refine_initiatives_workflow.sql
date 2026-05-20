-- Migration: 20260512000000_refine_initiatives_workflow.sql
-- Description: Adds fields for initiative content management and updates visibility policies.

BEGIN;

-- Add content management fields to initiatives
ALTER TABLE public.initiatives
ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS content TEXT,
ADD COLUMN IF NOT EXISTS caption TEXT,
ADD COLUMN IF NOT EXISTS summary TEXT,
ADD COLUMN IF NOT EXISTS gallery_urls TEXT[] DEFAULT '{}';

-- Update public visibility policy to require both approval and publishing
DROP POLICY IF EXISTS "Anyone can view approved initiatives" ON public.initiatives;
DROP POLICY IF EXISTS "Anyone can view published initiatives" ON public.initiatives;

CREATE POLICY "Anyone can view published initiatives" ON public.initiatives
FOR SELECT
USING (is_approved = true AND is_published = true);

-- Ensure authenticated users (Admins/NGOs) have necessary grants
GRANT ALL ON public.initiatives TO authenticated;

COMMIT;
