create or replace function public.process_recurring_billing()
returns void
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_run_id uuid;
  v_sub record;
  v_payment_id uuid;
  v_processed_count integer := 0;
  v_total_mur numeric := 0;
  v_effective_amount numeric;
  v_effective_day integer;
  v_next_date timestamptz;
  v_receipt_number text;
begin
  if exists (select 1 from public.billing_runs where run_date=current_date and status='completed') then return; end if;
  insert into public.billing_runs(run_date,status) values(current_date,'running') returning id into v_run_id;
  for v_sub in select * from public.subscriptions where status='active' and next_billing_date <= current_timestamp order by next_billing_date, created_at for update skip locked loop
    begin
      v_effective_amount := coalesce(v_sub.pending_amount_mur,v_sub.amount_mur);
      v_effective_day := least(greatest(coalesce(v_sub.pending_billing_day,extract(day from v_sub.next_billing_date)::integer),1),28);
      insert into public.payments(user_id,subscription_id,amount_mur,status,reconciliation_status,is_test)
      values(v_sub.user_id,v_sub.id,v_effective_amount,'pending','pending',coalesce(v_sub.is_test,false)) returning id into v_payment_id;
      perform public.allocate_payment_funds(v_payment_id,v_sub.user_id,v_effective_amount);
      update public.payments set status='success',paid_at=now(),reconciliation_status='success' where id=v_payment_id;
      v_receipt_number := 'CG-REC-' || to_char(current_date,'YYYYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,8));
      insert into public.receipts(payment_id,user_id,receipt_number,amount_mur) values(v_payment_id,v_sub.user_id,v_receipt_number,v_effective_amount);
      v_next_date := date_trunc('month',v_sub.next_billing_date) + interval '1 month' + make_interval(days=>v_effective_day-1);
      update public.subscriptions set amount_mur=v_effective_amount,pending_amount_mur=null,pending_billing_day=null,next_billing_date=v_next_date,updated_at=now() where id=v_sub.id;
      v_processed_count := v_processed_count+1; v_total_mur := v_total_mur+v_effective_amount;
    exception when others then
      if v_payment_id is not null then update public.payments set status='failed',reconciliation_status='failed',failure_reason=sqlerrm where id=v_payment_id and status='pending'; end if;
      insert into public.audit_logs(action,entity_type,entity_id,details) values('billing_failure','subscription',v_sub.id,jsonb_build_object('error',sqlerrm,'run_id',v_run_id,'payment_id',v_payment_id));
    end;
  end loop;
  update public.billing_runs set status='completed',subscriptions_processed=v_processed_count,total_amount_mur=v_total_mur where id=v_run_id;
exception when others then
  if v_run_id is not null then update public.billing_runs set status='failed',error_log=sqlerrm where id=v_run_id; end if;
end;
$function$;

revoke execute on function public.process_recurring_billing() from public,anon,authenticated;
