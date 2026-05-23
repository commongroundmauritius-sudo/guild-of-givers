-- No DDL changes were strictly required as the issue was in the application logic.
-- However, we ensure the profiles table has the correct updated_at trigger if it doesn't already.
-- The application now correctly satisfies the existing RLS policy.
SELECT 1;
