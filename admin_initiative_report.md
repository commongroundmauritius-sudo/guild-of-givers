# Admin Initiative Creation - Implementation Report

## 1. Schema Changes

The `public.initiatives` table was updated to support direct Admin creation and better tracking:

- **Added** `initiative_source`: TEXT (Values: 'organization_submission', 'admin_created'). Default: 'organization_submission'.
- **Added** `creator_user_id`: UUID (References auth.users).
- **Added** `creator_role`: public.app_role (admin, organization, member).
- **Added** `category`: TEXT.
- **Modified** `organization_id`: Changed from NOT NULL to NULLABLE to allow initiatives not directly tied to a specific Organization (e.g., internal or multi-partner).

## 2. RLS & Security

- **Admin Access**: Existing policy `Admins have full access to initiatives` allows admins to create and manage all initiatives regardless of source.
- **Organization Access**: Policy `Organization staff can manage own initiatives` remains unchanged, ensuring Organizations only see/edit initiatives linked to their `organization_id`.
- **Public Access**: Policy `Anyone can view published initiatives` remains unchanged (`is_approved = true AND is_published = true`).
- **Route Protection**: The new `admin-dashboard/initiatives/new` route is protected with an Admin-only role guard.

## 3. Dashboard Modifications

### Admin Dashboard

- **New Page**: `Admin Initiative Creation` (`/admin-dashboard/initiatives/new`) allowing admins to create initiatives with full control over all fields (Impact Pool, Goals, Category, Organization assignment).
- **Listing View**:
  - Added "Create Initiative" action.
  - Added Tabs: All, Organization Submitted, Admin Created, Drafts, Published, Pending Review.
  - Added Source Filter: All Sources, Organization Submission, Admin Created.
  - Improved card UI with source indicators and status badges.
- **Management View**:
  - Added Category field.
  - Added Organization assignment selector.
  - Displayed Source and Creator Role metadata.

### Organization Dashboard

- **Unchanged Workflow**: Organizations still submit initiatives for review.
- **Metadata**: Submissions now automatically include `initiative_source: 'organization_submission'`, `creator_user_id`, and `creator_role: 'organization'`.

## 4. Tested Flows

1. **Admin Create Draft**: Verified an initiative can be created with `is_published = false`.
2. **Admin Publish**: Verified transition from draft to published status.
3. **Organization Submission**: Verified that new Organization submissions still require admin approval (`is_approved = false`) and correctly track metadata.
4. **Public Listing**: Verified that only approved AND published initiatives (both Organization and Admin sources) appear in the public gallery.
5. **Build Check**: Confirmed `npm run build` passes with the new routes.
