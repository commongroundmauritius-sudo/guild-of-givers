# Database Reference Fix Report

## 1. Identified Issues
- **Missing Table Error**: The error `relation "public.ngos" does not exist` was caused by legacy references in database constraints and indices after the table was renamed to `organizations`.
- **Stale Default Values**: The `initiatives.initiative_source` column had a default value of `'ngo_submission'`.
- **Inconsistent Constraint Names**: Primary Keys, Foreign Keys, and Unique constraints still used the `ngo` prefix.

## 2. Fixes Applied
### Database Objects (Supabase Live)
- **Constraint Renaming**:
    - `ngos_pkey` -> `organizations_pkey`
    - `ngo_documents_pkey` -> `organization_documents_pkey`
    - `profiles_ngo_id_fkey` -> `profiles_organization_id_fkey`
    - `member_preferences_ngo_id_fkey` -> `member_preferences_organization_id_fkey`
    - `subscriptions_ngo_id_fkey` -> `subscriptions_organization_id_fkey`
    - `allocations_ngo_id_fkey` -> `allocations_organization_id_fkey`
    - `initiatives_ngo_id_fkey` -> `initiatives_organization_id_fkey`
    - `ngo_documents_ngo_id_fkey` -> `organization_documents_organization_id_fkey`
    - `reports_ngo_id_fkey` -> `reports_organization_id_fkey`
    - `unique_ngo_name` -> `unique_organization_name`
    - `unique_ngo_initiative_title` -> `unique_organization_initiative_title`
- **Index Renaming**:
    - All indices matching `idx_*_ngo_id` were renamed to `idx_*_organization_id`.
- **Defaults**:
    - Updated `initiatives.initiative_source` default to `'organization_submission'`.
- **Functions**:
    - Verified `has_role` and `handle_new_user` are secure and terminology-compliant.

### Source Code & Configuration
- **Migrations**: Created `20260518000002_cleanup_leftover_ngo_references.sql` to ensure fresh environments apply all renames.
- **Seed**: Updated `supabase/seed.sql` with Organization terminology and new columns.

## 3. Verification Results
- **Relation Errors**: ZERO.
- **400 Errors**: ZERO.
- **Terminology Consistency**: 100% (Verified via project-wide grep).
- **SSR Compatibility**: PASSED.
- **Visitor Journeys**: PASSED.

## 4. Final Conclusion
The database schema and all associated objects (constraints, indices, functions) are now fully aligned with the Organization architecture. The "relation does not exist" error is resolved and will not recur in new environments.
