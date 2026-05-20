# Initiative Schema Sync Report

## 1. Identified Discrepancies
The application code was using the following fields in the `initiatives` table which were missing or inconsistent in the database schema:
- `initiative_source`: Used to distinguish between organization submissions and admin-created initiatives.
- `creator_user_id`: Used to track the specific user who created the record.
- `creator_role`: Used to track the role of the creator.

## 2. Changes Applied
### Database Migration (`20260519000000_initiative_metadata.sql`)
- Added `initiative_source` (TEXT) with a default of `'organization_submission'`.
- Added `creator_user_id` (UUID) referencing `auth.users(id)`.
- Added `creator_role` (public.app_role).
- Implemented a check constraint for `initiative_source` allowing only `organization_submission` and `admin_created`.
- Backfilled existing records:
    - Initiatives with an `organization_id` were set to `organization_submission` / `organization`.
    - Initiatives without an `organization_id` were set to `admin_created` / `admin`.

### Frontend Compatibility
- Verified that `src/routes/_authenticated/organization.tsx` and `src/routes/_authenticated/admin-dashboard.initiatives.new.tsx` correctly populate these fields during insertion.
- Confirmed that types in `src/integrations/supabase/types.ts` reflect the updated schema.

## 3. Verification Results
- **Schema Validation**: PASSED. All columns are present and constraints are enforced.
- **Data Integrity**: PASSED. Existing rows have been backfilled without data loss.
- **Workflows**: PASSED. Both admin and organization insertion paths have been verified via code audit and build check.

## 4. Conclusion
The `initiatives` schema is now fully in sync with the application's requirements for ownership and source tracking.
