-- Add 'organization' to app_role enum
-- Enum value additions must be committed separately from their use in data updates
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'organization';
