-- Security Audit Pass 2: Secure Lead Conversion via RPC

-- 1. Remove public update policy on leads
DROP POLICY IF EXISTS "Public can update own lead by email" ON public.leads;
DROP POLICY IF EXISTS "Public can update own lead for conversion" ON public.leads;
DROP POLICY IF EXISTS "Public can update own lead" ON public.leads;

-- 2. Create a secure RPC for lead conversion
-- This allows us to remove the permissive UPDATE policy entirely.
CREATE OR REPLACE FUNCTION public.secure_convert_lead(
    p_email TEXT,
    p_status TEXT DEFAULT 'converted',
    p_initiative_id UUID DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    UPDATE public.leads
    SET
        status = p_status,
        lead_stage = CASE WHEN p_status = 'converted' THEN 'Engaged Supporter' ELSE 'Visitor' END,
        last_activity_at = now(),
        converted_at = CASE WHEN p_status = 'converted' THEN now() ELSE converted_at END
    WHERE
        email = lower(trim(p_email))
        AND (p_initiative_id IS NULL OR source_initiative_id = p_initiative_id)
        AND status <> p_status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Revoke public execution, only allow authenticated (or keep public if guest conversion is needed)
-- Since signup happens after conversion, we might need public EXECUTE but the function is restricted
-- to only updating certain fields based on the email.
REVOKE ALL ON FUNCTION public.secure_convert_lead(text, text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.secure_convert_lead(text, text, uuid) TO anon, authenticated;
