-- Role Normalization and Cleanup

DO $$
BEGIN
    -- Check if ngo exists in enum before attempting rename
    IF EXISTS (
        SELECT 1 FROM pg_enum
        JOIN pg_type ON pg_type.oid = pg_enum.enumtypid
        WHERE pg_type.typname = 'app_role' AND pg_enum.enumlabel = 'ngo'
    ) THEN
        ALTER TYPE public.app_role RENAME VALUE 'ngo' TO 'organization';
    END IF;
END $$;
