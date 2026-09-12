-- Preserve the immutable financial ledger when an initiative is deleted.
-- financial_events are audit records and must not be cascaded away or mutated.
-- The ledger keeps the original initiative UUID as historical evidence, so the
-- foreign key is removed rather than using ON DELETE SET NULL (which would
-- mutate an immutable financial event).

BEGIN;

ALTER TABLE public.financial_events
  DROP CONSTRAINT IF EXISTS financial_events_initiative_id_fkey;

COMMIT;
