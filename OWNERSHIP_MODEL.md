# Ownership Model Decision Document (CommonGround)

## 1. Current State (Fragmentation)
The platform currently has three competing patterns for identifying ownership and management rights:

1.  **Legacy NGO Model:** `organizations.owner_user_id` (References `auth.users.id`). Used in older RLS policies.
2.  **Modern Profile Model:** `profiles.organization_id` (References `organizations.id`). Links a human user to an entity.
3.  **Initiative Tracking:** `initiatives.creator_user_id` and `initiatives.organization_id`.
4.  **Role System:** `user_roles` table defines 'admin', 'organization', 'member'.

## 2. Authoritative Source Determination
*   **Authoritative Link:** `profiles.organization_id`
    - This is the primary mechanism for associating a user with an Organization.
    - Multiple users (staff) can be linked to a single Organization through this column.
*   **Authoritative Rights:** `user_roles.role = 'organization'`
    - This grants the permission to access organization-level dashboards.

## 3. Deprecated Patterns (To be Purged)
*   **DEPRECATED:** `organizations.owner_user_id`
    - **Reason:** Limits management to a single user. Redundant with profile-based linking.
*   **DEPRECATED:** `initiatives.creator_user_id`
    - **Reason:** Initiatives should be owned by the *Organization* entity, not the individual staff member who clicked "Create".
*   **DEPRECATED:** Terminology 'NGO'. All references must be updated to 'Organization'.

## 4. Implementation Strategy
1.  Update RLS policies to use `EXISTS (SELECT 1 FROM profiles WHERE profiles.organization_id = target.organization_id AND profiles.id = auth.uid())`.
2.  Remove `owner_user_id` from `public.organizations` after verifying no live data is lost.
3.  Remove `creator_user_id` from `public.initiatives`.

## 5. Decision Summary
The platform will move to a **Delegated Entity Model** where ownership is defined by a user's `organization_id` in their profile and a valid 'organization' role assignment.
