-- Allow anyone to queue emails for partner applications
-- This is necessary since the public form needs to trigger confirmation/admin notifications
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'email_queue' AND policyname = 'Anyone can insert into email_queue') THEN
        CREATE POLICY "Anyone can insert into email_queue" 
        ON public.email_queue 
        FOR INSERT 
        WITH CHECK (true);
    END IF;
END $$;

-- Grant INSERT on email_queue to anon and authenticated
GRANT INSERT ON public.email_queue TO anon, authenticated;

