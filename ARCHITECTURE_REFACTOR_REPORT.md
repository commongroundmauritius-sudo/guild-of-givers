# Architecture Refactor: User Profiles vs Organization Profiles

## Summary
The system has been refactored to cleanly separate personal user profiles from organization-level data. The `ngos` table has been renamed to `organizations`, and personal fields like `age` and `address` have been added to the `profiles` table.

## Schema Changes
### `profiles` Table Extensions:
- Added `age` (Integer) with a check constraint: `13 <= age <= 120`.
- Added `address` (Text) for residential information.
- Renamed `ngo_id` to `organization_id`.

### `organizations` Table (Renamed from `ngos`):
- Renamed `owner_id` to `owner_user_id`.
- Renamed `name` to `organization_name`.
- Added fields: `address`, `contact_email`, `contact_phone`, `milestones`, `expected_outcomes`, `allocation_summary`.

### Foreign Key Updates:
- `organization_id` updated in: `initiatives`, `subscriptions`, `member_preferences`, `reports`, `allocations`, `organization_documents`.

## Migration Results
- **Data Preservation**: All existing NGO data was preserved during the table rename.
- **Relationships**: Foreign keys were renamed and updated to maintain data integrity.
- **Constraints**: Age validation (13-120) is now enforced at the database level.

## RLS Changes
- `organizations`: Owners (`owner_user_id = auth.uid()`) have full control. Public can view verified organizations or those with active initiatives.
- `organization_documents`: Owners have full control via a join check on the `organizations` table.

## Affected Files
- `src/hooks/use-auth.tsx`: Updated profile interface and auth data fetching.
- `src/routes/_authenticated/member.settings.tsx`: Added UI for Age and Address with validation.
- `src/routes/_authenticated/admin-dashboard.settings.tsx`: Added UI for Age and Address for admin profiles.
- `src/integrations/supabase/types.ts`: Updated TypeScript definitions to reflect schema changes.
- Project-wide refactor of `ngo_id` -> `organization_id` and `ngos` -> `organizations`.

## Test Results
- **Build**: Successful production build confirmed.
- **Validation**: Frontend forms correctly handle age constraints and trim address whitespace.
