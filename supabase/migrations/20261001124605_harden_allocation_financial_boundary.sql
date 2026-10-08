create or replace function public.allocate_payment_funds(p_payment_id uuid,p_user_id uuid,p_total_amount numeric)
returns void language plpgsql security definer set search_path = ''
as $function$
declare
  v_payment public.payments%rowtype; v_fee_config record; v_fee_amount numeric:=0; v_net_amount numeric; v_cg_share numeric; v_org_pool_amount numeric;
  v_cg_account_id uuid; v_org_pool_account_id uuid; v_impact_pool_account_id uuid; v_fee_account_id uuid; v_impact_pool_initiative_id uuid; v_billing_cycle_id uuid;
  v_current_month integer; v_current_year integer; v_pref record; v_remaining_pool numeric; v_to_allocate numeric; v_funding_cycle_id uuid; v_cycle_target numeric; v_cycle_received numeric; v_cycle_space numeric; v_prev_bal numeric;
begin
  if p_payment_id is null or p_user_id is null or p_total_amount is null or p_total_amount<=0 then raise exception 'Invalid payment allocation request'; end if;
  select * into v_payment from public.payments where id=p_payment_id for update;
  if not found then raise exception 'Payment not found'; end if;
  if v_payment.user_id<>p_user_id then raise exception 'Payment user does not match allocation user'; end if;
  if v_payment.amount_mur<>p_total_amount then raise exception 'Payment amount does not match allocation amount'; end if;
  if v_payment.status not in ('pending','success') then raise exception 'Payment is not allocatable in its current state'; end if;
  if exists(select 1 from public.financial_events where payment_id=p_payment_id and event_type in ('platform_share','allocation','initiative_allocation','impact_pool')) then return; end if;
  select * into v_fee_config from public.fee_configurations where active=true order by created_at desc limit 1 for share;
  if v_fee_config.id is null then raise exception 'Active fee configuration is not configured'; end if;
  select id into v_cg_account_id from public.financial_accounts where account_type='platform' and is_system=true limit 1;
  select id into v_org_pool_account_id from public.financial_accounts where account_type='organization_pool' and is_system=true limit 1;
  select id into v_fee_account_id from public.financial_accounts where account_type='fee' and is_system=true limit 1;
  select id into v_impact_pool_initiative_id from public.initiatives where is_impact_pool=true and is_system_owned=true limit 1;
  select id into v_impact_pool_account_id from public.financial_accounts where reference_id=v_impact_pool_initiative_id limit 1;
  if v_cg_account_id is null or v_org_pool_account_id is null or v_fee_account_id is null or v_impact_pool_initiative_id is null or v_impact_pool_account_id is null then raise exception 'Allocation financial accounts or Impact Pool are not configured'; end if;
  v_current_month:=extract(month from now()); v_current_year:=extract(year from now());
  select id into v_billing_cycle_id from public.billing_cycles where month=v_current_month and year=v_current_year;
  if v_billing_cycle_id is null then insert into public.billing_cycles(month,year,start_date,end_date) values(v_current_month,v_current_year,date_trunc('month',now())::date,(date_trunc('month',now())+interval '1 month - 1 day')::date) returning id into v_billing_cycle_id; end if;
  if v_fee_config.fee_type='percentage' then v_fee_amount:=round(p_total_amount*(v_fee_config.percentage_value/100.0),2); elsif v_fee_config.fee_type='fixed' then v_fee_amount:=v_fee_config.fixed_amount_mur; elsif v_fee_config.fee_type='hybrid' then v_fee_amount:=round(p_total_amount*(v_fee_config.percentage_value/100.0),2)+v_fee_config.fixed_amount_mur; else raise exception 'Unsupported fee configuration type'; end if;
  if v_fee_amount<0 or v_fee_amount>p_total_amount then raise exception 'Invalid calculated transaction fee'; end if;
  v_net_amount:=p_total_amount-v_fee_amount; v_cg_share:=round(v_net_amount*0.20,2); v_org_pool_amount:=v_net_amount-v_cg_share;
  select cached_balance_mur into v_prev_bal from public.financial_accounts where id=v_fee_account_id for update;
  insert into public.financial_events(payment_id,billing_cycle_id,user_id,account_id,event_type,amount_mur,previous_balance,resulting_balance) values(p_payment_id,v_billing_cycle_id,p_user_id,v_fee_account_id,'transaction_fee',v_fee_amount,v_prev_bal,v_prev_bal+v_fee_amount);
  update public.financial_accounts set cached_balance_mur=v_prev_bal+v_fee_amount where id=v_fee_account_id;
  select cached_balance_mur into v_prev_bal from public.financial_accounts where id=v_cg_account_id for update;
  insert into public.financial_events(payment_id,billing_cycle_id,user_id,account_id,event_type,amount_mur,previous_balance,resulting_balance) values(p_payment_id,v_billing_cycle_id,p_user_id,v_cg_account_id,'platform_share',v_cg_share,v_prev_bal,v_prev_bal+v_cg_share);
  update public.financial_accounts set cached_balance_mur=v_prev_bal+v_cg_share where id=v_cg_account_id;
  v_remaining_pool:=v_org_pool_amount;
  for v_pref in (select mp.initiative_id,i.monthly_target_mur,fa.id account_id from public.member_preferences mp join public.initiatives i on i.id=mp.initiative_id join public.financial_accounts fa on fa.reference_id=i.id where mp.user_id=p_user_id and mp.priority_level between 1 and 4 and i.status='active' and i.is_approved=true and i.is_published=true and coalesce(i.is_impact_pool,false)=false order by mp.priority_level asc) loop
    exit when v_remaining_pool<=0;
    select id,target_amount_mur,received_amount_mur into v_funding_cycle_id,v_cycle_target,v_cycle_received from public.initiative_funding_cycles where initiative_id=v_pref.initiative_id and billing_cycle_id=v_billing_cycle_id for update;
    if v_funding_cycle_id is null then v_cycle_target:=coalesce(v_pref.monthly_target_mur,0); insert into public.initiative_funding_cycles(initiative_id,billing_cycle_id,month,year,target_amount_mur,received_amount_mur,remaining_amount_mur) values(v_pref.initiative_id,v_billing_cycle_id,v_current_month,v_current_year,v_cycle_target,0,v_cycle_target) returning id into v_funding_cycle_id; v_cycle_received:=0; end if;
    v_cycle_space:=greatest(0,v_cycle_target-v_cycle_received);
    if v_cycle_space>0 or v_pref.monthly_target_mur=0 then
      v_to_allocate:=least(v_remaining_pool,case when v_cycle_target>0 then v_cycle_space else v_remaining_pool end);
      if v_to_allocate>0 then
        select cached_balance_mur into v_prev_bal from public.financial_accounts where id=v_pref.account_id for update;
        insert into public.financial_events(payment_id,billing_cycle_id,user_id,initiative_id,account_id,event_type,amount_mur,previous_balance,resulting_balance) values(p_payment_id,v_billing_cycle_id,p_user_id,v_pref.initiative_id,v_pref.account_id,'allocation',v_to_allocate,v_prev_bal,v_prev_bal+v_to_allocate);
        update public.financial_accounts set cached_balance_mur=v_prev_bal+v_to_allocate where id=v_pref.account_id;
        update public.initiative_funding_cycles set received_amount_mur=received_amount_mur+v_to_allocate,remaining_amount_mur=greatest(0,target_amount_mur-(received_amount_mur+v_to_allocate)),status=case when (received_amount_mur+v_to_allocate)>=target_amount_mur and target_amount_mur>0 then 'completed'::public.funding_cycle_status else 'active'::public.funding_cycle_status end where id=v_funding_cycle_id returning received_amount_mur into v_cycle_received;
        update public.initiatives set current_amount_mur=v_cycle_received where id=v_pref.initiative_id; v_remaining_pool:=v_remaining_pool-v_to_allocate;
      end if;
    end if;
  end loop;
  if v_remaining_pool>0 then
    select cached_balance_mur into v_prev_bal from public.financial_accounts where id=v_impact_pool_account_id for update;
    insert into public.financial_events(payment_id,billing_cycle_id,user_id,initiative_id,account_id,event_type,amount_mur,previous_balance,resulting_balance) values(p_payment_id,v_billing_cycle_id,p_user_id,v_impact_pool_initiative_id,v_impact_pool_account_id,'impact_pool',v_remaining_pool,v_prev_bal,v_prev_bal+v_remaining_pool);
    update public.financial_accounts set cached_balance_mur=v_prev_bal+v_remaining_pool where id=v_impact_pool_account_id;
    insert into public.initiative_funding_cycles(initiative_id,billing_cycle_id,month,year,target_amount_mur,received_amount_mur,status) values(v_impact_pool_initiative_id,v_billing_cycle_id,v_current_month,v_current_year,0,v_remaining_pool,'active') on conflict(initiative_id,billing_cycle_id) do update set received_amount_mur=public.initiative_funding_cycles.received_amount_mur+excluded.received_amount_mur;
    select received_amount_mur into v_cycle_received from public.initiative_funding_cycles where initiative_id=v_impact_pool_initiative_id and billing_cycle_id=v_billing_cycle_id;
    update public.initiatives set current_amount_mur=v_cycle_received where id=v_impact_pool_initiative_id;
  end if;
  update public.initiative_funding_cycles set supporter_count=supporter_count+1 where billing_cycle_id=v_billing_cycle_id and initiative_id in(select initiative_id from public.financial_events where payment_id=p_payment_id and event_type in('allocation','impact_pool'));
end;
$function$;

revoke execute on function public.allocate_payment_funds(uuid,uuid,numeric) from public,anon,authenticated;
