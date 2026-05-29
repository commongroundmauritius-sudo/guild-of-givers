-- Placeholder for remote migration fix_reports_and_index_scoping
DO $$ BEGIN
    -- Performance index for reports
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'reports') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_reports_created_at') THEN
            CREATE INDEX idx_reports_created_at ON public.reports(created_at);
        END IF;
    END IF;
END $$;
