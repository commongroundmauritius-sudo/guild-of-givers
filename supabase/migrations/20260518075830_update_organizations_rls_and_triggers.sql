-- Update RLS Policies for Organizations
DROP POLICY IF EXISTS "NGO owners can update their NGO" ON public.organizations;
CREATE POLICY "Organization owners can manage their organization" ON public.organizations
    FOR ALL
    USING (owner_user_id = auth.uid());

-- Add RLS for organization_documents
ALTER TABLE public.organization_documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owners can manage organization documents" ON public.organization_documents;
CREATE POLICY "Owners can manage organization documents" ON public.organization_documents
    FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.organizations
        WHERE id = organization_documents.organization_id
        AND owner_user_id = auth.uid()
    ));

-- Grant access
GRANT ALL ON public.organizations TO authenticated;
GRANT ALL ON public.organization_documents TO authenticated;
GRANT SELECT ON public.organizations TO anon;
