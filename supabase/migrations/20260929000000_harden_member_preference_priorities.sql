-- Keep member allocation preferences structurally valid.
-- One initiative and one priority slot may occur only once per member.
CREATE UNIQUE INDEX IF NOT EXISTS member_preferences_user_initiative_uidx
  ON public.member_preferences (user_id, initiative_id);

CREATE UNIQUE INDEX IF NOT EXISTS member_preferences_user_priority_uidx
  ON public.member_preferences (user_id, priority_level);

ALTER TABLE public.member_preferences
  ADD CONSTRAINT member_preferences_priority_level_check
  CHECK (priority_level BETWEEN 1 AND 4);
