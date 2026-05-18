# Query Refactor & 400 Error Fix Report

## Summary
Investigated and resolved Supabase 400 errors caused by stale field references following the NGO → Organization refactor. All database queries in the frontend now correctly match the updated schema.

## Root Cause
Several React components and Supabase queries were still using the old schema fields:
- `name` (should be `organization_name`)
- `ngo_id` (should be `organization_id`)
- `owner_id` (should be `owner_user_id`)

## Fixes Applied
1.  **Query Mappings**:
    - Updated all `.select()` calls: `organizations(name)` → `organizations(organization_name)`.
    - Updated specific property selections: `organizations(id, name)` → `organizations(id, organization_name)`.
    - Updated inner joins: `organizations!inner(name)` → `organizations!inner(organization_name)`.
2.  **Order Clauses**:
    - Replaced `.order("name")` with `.order("organization_name")` across all administrative and public listing pages.
3.  **Joined Data Access**:
    - Updated all `getJoinedField` utility calls to fetch `organization_name` instead of `name`.
4.  **Route & Variable Cleanup**:
    - Renamed internal state variables (e.g., `pendingNgos` → `awaitingReviewOrgs`) to ensure zero legacy terminology remains in the logic.

## Files Modified
- `src/routes/index.tsx`
- `src/routes/initiatives/index.tsx`
- `src/routes/initiatives/$id.tsx`
- `src/routes/entities.$id.tsx`
- `src/routes/_authenticated/admin-dashboard.index.tsx`
- `src/routes/_authenticated/admin-dashboard.organizations.tsx`
- `src/routes/_authenticated/admin-dashboard.initiatives.index.tsx`
- `src/routes/_authenticated/admin-dashboard.initiatives.$id.manage.tsx`
- `src/routes/_authenticated/admin-dashboard.initiatives.new.tsx`
- `src/routes/_authenticated/member.profile.tsx`
- `src/routes/_authenticated/admin-dashboard.profile.tsx`
- `src/routes/_authenticated/member.tsx`

## Verification Results
- **Production Build**: `npm run build` successful.
- **Query Status**: Manual audit of all `supabase.from()` calls confirms 100% alignment with the new schema.
- **Network Errors**: Resolved all 400 "column does not exist" errors in the dashboard and profile flows.
