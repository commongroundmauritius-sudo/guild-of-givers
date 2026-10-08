ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_source_initiative_id_fkey;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_source_initiative_id_fkey FOREIGN KEY (source_initiative_id) REFERENCES public.initiatives(id) ON DELETE SET NULL;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_primary_initiative_id_fkey;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_primary_initiative_id_fkey FOREIGN KEY (primary_initiative_id) REFERENCES public.initiatives(id) ON DELETE SET NULL;
