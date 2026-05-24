CREATE OR REPLACE FUNCTION public.increment_initiative_amount(initiative_id uuid, increment_by numeric)
RETURNS void AS $$
BEGIN
  UPDATE public.initiatives
  SET current_amount_mur = current_amount_mur + increment_by
  WHERE id = initiative_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
