-- Performance hardening:
-- 1) index the payment_intents source initiative foreign key;
-- 2) remove redundant non-constraint member preference indexes.
CREATE INDEX IF NOT EXISTS idx_payment_intents_source_initiative_id
  ON public.payment_intents (source_initiative_id);

DROP INDEX IF EXISTS public.member_preferences_user_initiative_uidx;
DROP INDEX IF EXISTS public.member_preferences_user_priority_uidx;
