DO $$
DECLARE
  r record;
  new_qual text;
  new_check text;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname, qual, with_check
    FROM pg_policies
    WHERE schemaname = 'public'
      AND (qual ILIKE '%auth.uid()%' OR qual ILIKE '%auth.jwt()%' OR with_check ILIKE '%auth.uid()%' OR with_check ILIKE '%auth.jwt()%')
  LOOP
    new_qual := r.qual;
    new_check := r.with_check;

    IF new_qual IS NOT NULL THEN
      new_qual := regexp_replace(new_qual, '\mauth\.uid\(\)', '(select auth.uid())', 'g');
      new_qual := regexp_replace(new_qual, '\mauth\.jwt\(\)', '(select auth.jwt())', 'g');
      EXECUTE format('ALTER POLICY %I ON %I.%I USING (%s)', r.policyname, r.schemaname, r.tablename, new_qual);
    END IF;

    IF new_check IS NOT NULL THEN
      new_check := regexp_replace(new_check, '\mauth\.uid\(\)', '(select auth.uid())', 'g');
      new_check := regexp_replace(new_check, '\mauth\.jwt\(\)', '(select auth.jwt())', 'g');
      EXECUTE format('ALTER POLICY %I ON %I.%I WITH CHECK (%s)', r.policyname, r.schemaname, r.tablename, new_check);
    END IF;
  END LOOP;
END $$;
