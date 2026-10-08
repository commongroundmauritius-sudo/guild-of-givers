BEGIN;

-- Financial events are an immutable ledger. They must retain the original
-- initiative UUID even when the initiative itself is removed. A foreign key
-- with SET NULL would mutate the ledger and is therefore incompatible with
-- the immutability trigger.
ALTER TABLE public.financial_events
  DROP CONSTRAINT IF EXISTS financial_events_initiative_id_fkey;

COMMIT;
