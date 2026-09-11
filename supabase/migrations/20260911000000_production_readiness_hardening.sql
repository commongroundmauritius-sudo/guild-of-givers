-- Production-readiness hardening
-- Safe, idempotent constraints for the existing payment-event and priority models.

-- Webhook delivery is at-least-once. A provider event must therefore be uniquely
-- identifiable so retries cannot create a second financial side effect.
CREATE UNIQUE INDEX IF NOT EXISTS payment_events_provider_event_id_uidx
  ON public.payment_events (provider, provider_event_id)
  WHERE provider_event_id IS NOT NULL;

-- A member cannot have two initiatives occupying the same priority slot.
CREATE UNIQUE INDEX IF NOT EXISTS member_preferences_user_priority_uidx
  ON public.member_preferences (user_id, priority_level)
  WHERE priority_level IS NOT NULL;

-- A member should not rank the same initiative more than once.
CREATE UNIQUE INDEX IF NOT EXISTS member_preferences_user_initiative_uidx
  ON public.member_preferences (user_id, initiative_id);

COMMENT ON INDEX public.payment_events_provider_event_id_uidx IS
  'Prevents duplicate processing of at-least-once payment webhook deliveries.';
COMMENT ON INDEX public.member_preferences_user_priority_uidx IS
  'Prevents duplicate priority slots for a member.';
COMMENT ON INDEX public.member_preferences_user_initiative_uidx IS
  'Prevents duplicate initiative preferences for a member.';
