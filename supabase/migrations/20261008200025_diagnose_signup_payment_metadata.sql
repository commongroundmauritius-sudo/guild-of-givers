-- Make failed test-signup payment matching diagnosable in Postgres logs without weakening validation.
CREATE OR REPLACE FUNCTION public.finalize_test_signup_payment(
  p_user_id uuid,
  p_email text,
  p_transaction_id text,
  p_provider_subscription_id text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
declare
  v_intent public.payment_intents%rowtype;
  v_payment_id uuid;
  v_subscription_id uuid;
  v_next_billing_date timestamptz;
  v_requested_provider_sub text := nullif(btrim(p_provider_subscription_id), '');
begin
  if p_user_id is null
     or p_email is null
     or p_transaction_id is null
     or btrim(p_transaction_id) = '' then
    raise exception 'Invalid test signup payment request';
  end if;

  select *
  into v_intent
  from public.payment_intents
  where provider_transaction_id = p_transaction_id
    and status = 'pending'
    and is_test = true
    and lower(email) = lower(btrim(p_email))
  for update;

  if not found then
    raise exception 'Signup payment match failed: txn=% email=% txn_count=% email_count=% pending_test=%',
      p_transaction_id, lower(btrim(p_email)),
      (select count(*) from public.payment_intents where provider_transaction_id = p_transaction_id),
      (select count(*) from public.payment_intents where lower(email) = lower(btrim(p_email))),
      (select count(*) from public.payment_intents where status = 'pending' and is_test = true)
      ;
  end if;

  if v_requested_provider_sub is not null
     and v_intent.provider_subscription_id is not null
     and v_requested_provider_sub <> v_intent.provider_subscription_id then
    raise exception 'Provider subscription ID does not match payment intent';
  end if;

  if v_intent.amount_mur < 167 or v_intent.amount_mur > 1000000 then
    raise exception 'Invalid test signup payment amount';
  end if;

  v_next_billing_date := date_trunc('month', now()) + interval '1 month' + interval '6 days';

  insert into public.payments(
    user_id, amount_mur, status, peach_payment_id, paid_at, currency,
    processor_response, fees_covered_amount_mur, reconciliation_status, is_test
  ) values (
    p_user_id, v_intent.amount_mur, 'pending', v_intent.provider_transaction_id,
    null, v_intent.currency,
    jsonb_build_object('simulated', true, 'payment_intent_id', v_intent.id),
    0, 'pending', true
  )
  on conflict (peach_payment_id) where peach_payment_id is not null do nothing
  returning id into v_payment_id;

  if v_payment_id is null then
    select id into v_payment_id from public.payments
    where peach_payment_id = v_intent.provider_transaction_id limit 1;
  end if;

  perform public.allocate_payment_funds(v_payment_id, p_user_id, v_intent.amount_mur);

  update public.payments
  set status = 'success', paid_at = now(), reconciliation_status = 'success',
      gateway_response = jsonb_build_object(
        'simulated', true,
        'payment_intent_id', v_intent.id,
        'provider_subscription_id',
        coalesce(v_intent.provider_subscription_id, v_requested_provider_sub)
      )
  where id = v_payment_id;

  select id into v_subscription_id
  from public.subscriptions
  where user_id = p_user_id order by created_at desc limit 1;

  if v_subscription_id is not null then
    if exists (select 1 from public.subscriptions where id = v_subscription_id and is_test = false) then
      raise exception 'Cannot replace a live subscription with test signup data';
    end if;
    update public.subscriptions
    set status = 'active', amount_mur = v_intent.amount_mur,
        peach_subscription_id = coalesce(v_intent.provider_subscription_id, peach_subscription_id),
        covers_fees = v_intent.covers_fees, start_date = coalesce(start_date, now()),
        next_billing_date = v_next_billing_date, is_test = true, updated_at = now()
    where id = v_subscription_id;
  else
    insert into public.subscriptions(
      user_id, amount_mur, status, peach_subscription_id, covers_fees,
      start_date, next_billing_date, is_test
    ) values (
      p_user_id, v_intent.amount_mur, 'active',
      v_intent.provider_subscription_id, v_intent.covers_fees, now(),
      v_next_billing_date, true
    )
    returning id into v_subscription_id;
  end if;

  update public.payments set subscription_id = v_subscription_id where id = v_payment_id;
  update public.payment_intents
  set status = 'completed', completed_at = now(),
      provider_subscription_id = coalesce(v_intent.provider_subscription_id, v_requested_provider_sub)
  where id = v_intent.id;

  return v_payment_id;
end;
$function$;

REVOKE EXECUTE ON FUNCTION public.finalize_test_signup_payment(uuid,text,text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.finalize_test_signup_payment(uuid,text,text,text) TO postgres;
