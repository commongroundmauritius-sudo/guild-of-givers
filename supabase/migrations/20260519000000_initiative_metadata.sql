-- Add initiative metadata tracking fields
ALTER TABLE public.initiatives
ADD COLUMN IF NOT EXISTS initiative_source TEXT DEFAULT 'organization_submission',
ADD COLUMN IF NOT EXISTS creator_user_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS creator_role public.app_role;

-- Add check constraint for initiative_source
DO $$
BEGIN
    ALTER TABLE public.initiatives DROP CONSTRAINT IF EXISTS initiatives_initiative_source_check;
    ALTER TABLE public.initiatives ADD CONSTRAINT initiatives_initiative_source_check
        CHECK (initiative_source = ANY (ARRAY['organization_submission'::text, 'admin_created'::text]));
EXCEPTION
    WHEN OTHERS THEN
        NULL;
END $$;

-- Backfill existing records
-- If linked to an organization, assume organization_submission
UPDATE public.initiatives
SET
    initiative_source = 'organization_submission',
    creator_role = 'organization'
WHERE organization_id IS NOT NULL
AND initiative_source IS NULL;

-- If NOT linked to an organization, assume admin_created
UPDATE public.initiatives
SET
    initiative_source = 'admin_created',
    creator_role = 'admin'
WHERE organization_id IS NULL
AND initiative_source IS NULL;

-- Ensure grants are present
GRANT ALL ON public.initiatives TO authenticated;
