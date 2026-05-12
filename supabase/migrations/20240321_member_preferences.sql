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
DO $$ BEGIN
    CREATE POLICY "Users can manage own preferences" ON public.member_preferences
    FOR ALL USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Admins can view all preferences" ON public.member_preferences
    FOR SELECT USING (public.has_role('admin'));
EXCEPTION WHEN duplicate_object THEN null; END $$;
