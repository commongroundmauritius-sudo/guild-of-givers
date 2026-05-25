-- Create member_preferences table
CREATE TABLE IF NOT EXISTS public.member_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  initiative_id UUID REFERENCES public.initiatives ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, initiative_id)
);

-- Enable RLS
ALTER TABLE public.member_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Using subqueries for auth.uid() as recommended for performance and to match manual adjustment
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage own preferences') THEN
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'member_preferences') THEN
                CREATE POLICY "Users can manage own preferences" ON public.member_preferences
                FOR ALL USING ((SELECT auth.uid()) = user_id);
    END IF;
END $$;
    END IF;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert their own preferences') THEN
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'member_preferences') THEN
                CREATE POLICY "Users can insert their own preferences" ON public.member_preferences
                FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);
    END IF;
END $$;
    END IF;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can view all preferences') THEN
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'member_preferences') THEN
                CREATE POLICY "Admins can view all preferences" ON public.member_preferences
                FOR SELECT USING (public.has_role('admin'));
    END IF;
END $$;
    END IF;
EXCEPTION WHEN duplicate_object THEN null; END $$;
