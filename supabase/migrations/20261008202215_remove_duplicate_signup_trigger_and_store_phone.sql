-- Remove the legacy duplicate auth trigger that called handle_new_user() a second time.
-- handle_new_user now persists phone metadata itself, so the legacy trigger is redundant.

DROP TRIGGER IF EXISTS trigger_save_phone ON auth.users;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
declare
  v_payment_id uuid;
  v_payment_txn text;
  v_provider_sub text;
  v_subscription_amount numeric;
  v_covers_fees boolean;
begin
  insert into public.profiles (id, full_name, email, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.email,
    nullif(btrim(new.raw_user_meta_data->>'phone'), '')
  )
  on conflict (id) do update
  set full_name = excluded.full_name,
      email = excluded.email,
      phone = coalesce(excluded.phone, public.profiles.phone);

  insert into public.user_roles (user_id, role)
  values (new.id, 'member')
  on conflict (user_id, role) do nothing;

  v_payment_txn := nullif(btrim(new.raw_user_meta_data->>'payment_transaction_id'), '');
  v_provider_sub := nullif(btrim(new.raw_user_meta_data->>'provider_subscription_id'), '');
  v_subscription_amount := (new.raw_user_meta_data->>'subscription_amount')::numeric;
  v_covers_fees := coalesce((new.raw_user_meta_data->>'covers_fees')::boolean, false);

  if v_subscription_amount is not null
     or v_payment_txn is not null
     or v_provider_sub is not null then
    if v_payment_txn is null then
      raise exception 'Signup payment transaction is required';
    end if;

    if v_subscription_amount is null
       or v_subscription_amount < 167
       or v_subscription_amount > 1000000 then
      raise exception 'Invalid signup subscription amount';
    end if;

    v_payment_id := public.finalize_test_signup_payment(
      new.id, new.email, v_payment_txn, v_provider_sub
    );
  end if;

  return new;
end;
$function$;