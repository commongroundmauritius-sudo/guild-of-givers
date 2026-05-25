ALTER TABLE public.member_preferences ADD COLUMN IF NOT EXISTS priority_level INTEGER DEFAULT 1;
