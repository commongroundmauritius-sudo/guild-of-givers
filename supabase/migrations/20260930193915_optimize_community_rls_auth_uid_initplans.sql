DO $$
DECLARE r record; v_using text; v_check text; v_sql text;
BEGIN
FOR r IN SELECT tablename,policyname,cmd,qual,with_check FROM pg_policies
WHERE schemaname='public' AND (
(tablename='post_reactions' AND policyname IN ('Active members and own organization reactions visible','Active members can delete own reactions','Active members can manage own reactions','Active members can react','Active members can view reactions'))
OR (tablename='post_comments' AND policyname IN ('Active members and own organization comments visible','Active members can comment','Authors admins and active members can delete comments'))
OR (tablename='community_posts' AND policyname='Active members and own organization posts visible')
OR (tablename='initiatives' AND policyname='Organization staff can view own initiatives'))
LOOP
v_using=CASE WHEN r.qual IS NULL THEN NULL ELSE replace(r.qual,'auth.uid()','(select auth.uid())') END;
v_check=CASE WHEN r.with_check IS NULL THEN NULL ELSE replace(r.with_check,'auth.uid()','(select auth.uid())') END;
v_sql=format('ALTER POLICY %I ON public.%I',r.policyname,r.tablename);
IF r.cmd NOT IN ('INSERT') AND v_using IS NOT NULL THEN v_sql:=v_sql||format(' USING (%s)',v_using); END IF;
IF v_check IS NOT NULL THEN v_sql:=v_sql||format(' WITH CHECK (%s)',v_check); END IF;
EXECUTE v_sql;
END LOOP;
END $$;
