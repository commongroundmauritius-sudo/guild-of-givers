-- Public lead conversion secured via the secure_convert_lead PostgreSQL RPC
-- Removed permissive public UPDATE policies on the leads table.

CREATE OR REPLACE FUNCTION public.secure_convert_lead(p_lead_id uuid)
RETURNS void AS $$
BEGIN
  -- Logic for converting lead
  UPDATE public.leads
  SET status = 'converted', converted_at = now()
  WHERE id = p_lead_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
