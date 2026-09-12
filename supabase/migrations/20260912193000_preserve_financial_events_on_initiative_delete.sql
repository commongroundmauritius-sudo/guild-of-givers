-- Preserve the immutable financial ledger when an initiative is deleted.
-- financial_events are audit records and must not be cascaded away with an initiative.
-- The initiative_id relationship is optional, so detach the ledger row instead.

BEGIN;

ALTER TABLE public.financial_events
  DROP CONSTRAINT IF EXISTS financial_events_initiative_id_fkey;

ALTER TABLE public.financial_events
  ADD CONSTRAINT financial_events_initiative_id_fkey
  FOREIGN KEY (initiative_id)
  REFERENCES public.initiatives(id)
  ON DELETE SET NULL;

COMMIT;
