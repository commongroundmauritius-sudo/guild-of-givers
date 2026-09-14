-- Keep the subscription invariant in source control as well as the live database.
-- Historical cancelled/past_due subscriptions remain allowed; only one active
-- subscription may exist for a member at a time.
CREATE UNIQUE INDEX IF NOT EXISTS uq_subscriptions_one_active_per_user
  ON public.subscriptions (user_id)
  WHERE status = 'active';
