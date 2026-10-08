BEGIN;

ALTER TABLE public.financial_events
  DROP CONSTRAINT IF EXISTS financial_events_initiative_id_fkey;

ALTER TABLE public.financial_events
  ADD CONSTRAINT financial_events_initiative_id_fkey
  FOREIGN KEY (initiative_id)
  REFERENCES public.initiatives(id)
  ON DELETE SET NULL;

COMMIT;
