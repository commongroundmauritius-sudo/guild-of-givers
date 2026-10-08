create or replace function public.create_test_payment_intent(
  p_email text,
  p_amount_mur numeric,
  p_covers_fees boolean default false,
  p_source_initiative_id uuid default null,
  p_provider_subscription_id text default null
)
returns text
language plpgsql
security definer
set search_path = 'public'
as $$
declare
  v_txn text := 'mock_txn_' || replace(gen_random_uuid()::text, '-', '');
  v_email text := lower(btrim(p_email));
  v_provider_subscription_id text := nullif(btrim(p_provider_subscription_id), '');
begin
  if v_email is null
     or length(v_email) > 254
     or v_email !~ '^[A-Za-z0-9.!#$%&''*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$'
  then
    raise exception 'Invalid email address';
  end if;

  if p_amount_mur is null or p_amount_mur < 167 or p_amount_mur > 1000000 then
    raise exception 'Invalid test payment amount';
  end if;

  if v_provider_subscription_id is not null and length(v_provider_subscription_id) > 255 then
    raise exception 'Invalid provider subscription ID';
  end if;

  insert into public.payment_intents(
    provider_transaction_id,
    provider_subscription_id,
    email,
    amount_mur,
    covers_fees,
    source_initiative_id,
    is_test
  ) values (
    v_txn,
    v_provider_subscription_id,
    p_email,
    p_amount_mur,
    coalesce(p_covers_fees, false),
    p_source_initiative_id,
    true
  );

  return v_txn;
end;
$$;
