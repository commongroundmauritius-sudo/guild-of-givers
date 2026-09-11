-- Production-readiness hardening
-- Provider-agnostic payment idempotency and member preference integrity.

ALTER TABLE public.payment_events
  ADD COLUMN IF NOT EXISTS provider TEXT,
  ADD COLUMN IF NOT EXISTS provider_event_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS payment_events_provider_event_id_uidx
  ON public.payment_events (provider, provider_event_id)
  WHERE provider_event_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS member_preferences_user_priority_uidx
  ON public.member_preferences (user_id, priority_level)
  WHERE priority_level IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS member_preferences_user_initiative_uidx
  ON public.member_preferences (user_id, initiative_id);

COMMENT ON INDEX public.payment_events_provider_event_id_uidx IS
  'Prevents duplicate processing of at-least-once payment webhook deliveries.';
COMMENT ON INDEX public.member_preferences_user_priority_uidx IS
  'Prevents duplicate priority slots for a member.';
COMMENT ON INDEX public.member_preferences_user_initiative_uidx IS
  'Prevents duplicate initiative preferences for a member.';
