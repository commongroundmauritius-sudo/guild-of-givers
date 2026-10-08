-- Add columns to organizations table for better tracking
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS created_by_admin_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS conversion_source TEXT DEFAULT 'direct';

-- Create an index for source tracking
CREATE INDEX IF NOT EXISTS idx_orgs_conversion_source ON public.organizations(conversion_source);

