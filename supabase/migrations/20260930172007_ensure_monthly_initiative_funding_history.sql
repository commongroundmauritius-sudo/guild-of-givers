CREATE OR REPLACE FUNCTION public.ensure_monthly_initiative_funding_cycles()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE v_month integer:=extract(month from now()); v_year integer:=extract(year from now()); v_billing_cycle_id uuid;
BEGIN
 SELECT id INTO v_billing_cycle_id FROM public.billing_cycles WHERE month=v_month AND year=v_year LIMIT 1;
 IF v_billing_cycle_id IS NULL THEN
  INSERT INTO public.billing_cycles(month,year,start_date,end_date) VALUES(v_month,v_year,date_trunc('month',now())::date,(date_trunc('month',now())+interval '1 month - 1 day')::date) ON CONFLICT DO NOTHING RETURNING id INTO v_billing_cycle_id;
  IF v_billing_cycle_id IS NULL THEN SELECT id INTO v_billing_cycle_id FROM public.billing_cycles WHERE month=v_month AND year=v_year LIMIT 1; END IF;
 END IF;
 INSERT INTO public.initiative_funding_cycles(initiative_id,billing_cycle_id,month,year,target_amount_mur,received_amount_mur,remaining_amount_mur,status)
 SELECT i.id,v_billing_cycle_id,v_month,v_year,CASE WHEN COALESCE(i.is_impact_pool,false) THEN 0 ELSE GREATEST(0,COALESCE(i.goal_amount_mur,0)) END,0,CASE WHEN COALESCE(i.is_impact_pool,false) THEN 0 ELSE GREATEST(0,COALESCE(i.goal_amount_mur,0)) END,'active'
 FROM public.initiatives i WHERE i.status='active' AND i.is_approved=true AND i.is_published=true AND (COALESCE(i.goal_amount_mur,0)>0 OR COALESCE(i.is_impact_pool,false)=true)
 ON CONFLICT(initiative_id,billing_cycle_id) DO NOTHING;
 UPDATE public.initiatives i SET current_amount_mur=f.received_amount_mur FROM public.initiative_funding_cycles f WHERE f.initiative_id=i.id AND f.billing_cycle_id=v_billing_cycle_id AND i.status='active' AND i.is_approved=true AND i.is_published=true;
END;
$function$;
REVOKE ALL ON FUNCTION public.ensure_monthly_initiative_funding_cycles() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.ensure_monthly_initiative_funding_cycles() FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_monthly_initiative_funding_cycles() TO postgres;
SELECT public.ensure_monthly_initiative_funding_cycles();
DO $cron$ BEGIN IF to_regclass('cron.job') IS NOT NULL AND to_regprocedure('cron.schedule(text,text,text)') IS NOT NULL THEN IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname='monthly-funding-cycle-initialization') THEN PERFORM cron.schedule('monthly-funding-cycle-initialization','5 0 1 * *','SELECT public.ensure_monthly_initiative_funding_cycles()'); END IF; END IF; END $cron$;