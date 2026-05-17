# Admin Initiative Creation - Implementation Report

## 1. Schema Changes
The `public.initiatives` table was updated to support direct Admin creation and better tracking:
- **Added** `initiative_source`: TEXT (Values: 'ngo_submission', 'admin_created'). Default: 'ngo_submission'.
- **Added** `creator_user_id`: UUID (References auth.users).
- **Added** `creator_role`: public.app_role (admin, ngo, member).
- **Added** `category`: TEXT.
- **Modified** `ngo_id`: Changed from NOT NULL to NULLABLE to allow initiatives not directly tied to a specific NGO (e.g., internal or multi-partner).

## 2. RLS & Security
- **Admin Access**: Existing policy `Admins have full access to initiatives` allows admins to create and manage all initiatives regardless of source.
- **NGO Access**: Policy `NGO staff can manage own initiatives` remains unchanged, ensuring NGOs only see/edit initiatives linked to their `ngo_id`.
- **Public Access**: Policy `Anyone can view published initiatives` remains unchanged (`is_approved = true AND is_published = true`).
- **Route Protection**: The new `admin-dashboard/initiatives/new` route is protected with an Admin-only role guard.

## 3. Dashboard Modifications
### Admin Dashboard
- **New Page**: `Admin Initiative Creation` (`/admin-dashboard/initiatives/new`) allowing admins to create initiatives with full control over all fields (Impact Pool, Goals, Category, NGO assignment).
- **Listing View**:
    - Added "Create Initiative" action.
    - Added Tabs: All, NGO Submitted, Admin Created, Drafts, Published, Pending Review.
    - Added Source Filter: All Sources, NGO Submission, Admin Created.
    - Improved card UI with source indicators and status badges.
- **Management View**:
    - Added Category field.
    - Added NGO assignment selector.
    - Displayed Source and Creator Role metadata.

### NGO Dashboard
- **Unchanged Workflow**: NGOs still submit initiatives for review.
- **Metadata**: Submissions now automatically include `initiative_source: 'ngo_submission'`, `creator_user_id`, and `creator_role: 'ngo'`.

## 4. Tested Flows
1. **Admin Create Draft**: Verified an initiative can be created with `is_published = false`.
2. **Admin Publish**: Verified transition from draft to published status.
3. **NGO Submission**: Verified that new NGO submissions still require admin approval (`is_approved = false`) and correctly track metadata.
4. **Public Listing**: Verified that only approved AND published initiatives (both NGO and Admin sources) appear in the public gallery.
5. **Build Check**: Confirmed `npm run build` passes with the new routes.
