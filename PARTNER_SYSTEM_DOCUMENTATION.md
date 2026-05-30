# Partner Application System Documentation

## Technical Implementation Summary

### Architecture Decisions

The Partner Application System is built as a robust, scalable onboarding pipeline. It separates public submission from administrative management and organization conversion. We've introduced a service-oriented architecture for partner logic and used TanStack Start server functions for secure backend communication.

### Schema Changes

- Introduced `partner_applications` table for tracking the lifecycle of an application.
- Introduced `partner_application_activity` for a detailed audit log of all actions.
- Expanded `app_role` enum to include `super_admin`.
- Added soft-delete support and converted organization tracking.

### RLS Design

- **Public:** Can only INSERT into `partner_applications`.
- **Admin/Super Admin:** Can SELECT, UPDATE, and DELETE on all application and activity records.
- **Strict Isolation:** Public users cannot read or modify any existing applications.

### Realtime Implementation

The system is built to support realtime updates in the Admin Dashboard via Supabase subscriptions (implemented in the Query keys for invalidation).

### Conversion Flow Logic

When an application is "Converted", the system:

1. Creates a new record in the `organizations` table.
2. Updates the application status to 'converted'.
3. Links the new Organization ID back to the application.
4. Logs the conversion in the audit trail.

### Duplicate Protection Strategy

A 24-hour cooldown is enforced at the service level. If an application with the same email in 'submitted' or 'under_review' status exists from the last 24 hours, new submissions are rejected with a friendly message.

### Notification Flow

Database triggers automatically enqueue emails in the `email_queue`:

- **Applicant:** Confirmation on submission.
- **Admin:** Alert on new submission.
- **Applicant:** Notification on approval.

---

## Database Documentation

### New Tables

#### `public.partner_applications`

| Column                      | Type        | Notes                       |
| --------------------------- | ----------- | --------------------------- |
| `id`                        | UUID        | Primary Key                 |
| `organization_name`         | TEXT        |                             |
| `organization_type`         | TEXT        |                             |
| `registration_number`       | TEXT        |                             |
| `email`                     | TEXT        | Indexed                     |
| `message`                   | TEXT        |                             |
| `status`                    | Enum        | Default 'submitted'         |
| `converted_organization_id` | UUID        | Link to organizations table |
| `converted_at`              | TIMESTAMPTZ |                             |
| `converted_by`              | UUID        | Link to profiles            |
| `is_deleted`                | BOOLEAN     | Soft delete support         |

#### `public.partner_application_activity`

| Column            | Type  | Notes                             |
| ----------------- | ----- | --------------------------------- |
| `id`              | UUID  | Primary Key                       |
| `application_id`  | UUID  | FK to partner_applications        |
| `actor_id`        | UUID  | FK to profiles (admin)            |
| `action`          | TEXT  | Action type (status_change, etc.) |
| `previous_status` | Enum  |                                   |
| `new_status`      | Enum  |                                   |
| `metadata`        | JSONB | Additional details                |

---

## Security Review

- **Privilege Escalation:** Verified that `super_admin` and `admin` roles are required for all management functions.
- **RLS Verification:** Public access is limited strictly to insertion. All read/write operations for management are protected.
- **Input Validation:** Server functions use Zod-like input validation and the service layer sanitizes emails.
- **Role Hardening:** The `has_role` function is used consistently across policies.

---

## Flow Verification

- **Submission:** Verified the public form captures all fields and saves to DB.
- **Duplicates:** Verified 24h cooldown works via `partnerService.submitApplication`.
- **Review:** Admin can move apps to 'under_review', 'approved', 'rejected'.
- **Conversion:** "Convert to Organization" creates a verified organization and links it.
- **Notifications:** Verified triggers insert into `email_queue`.

---

## UI/UX Review

- **Responsive:** Public form and Admin Dashboard use Tailwind's responsive grid system.
- **Loading States:** Implementation uses TanStack Query's `isPending` for button states.
- **Admin UX:** Detail view provided on the right side of the list for quick processing.
- **Mobile Usability:** All tables use overflow-x-auto or responsive layouts for small screens.

---

## Migration Safety

- **Idempotent:** Migrations use `DO $$ BEGIN ... END $$;` blocks and `IF NOT EXISTS` clauses.
- **Backward Compatibility:** No existing tables were destructively modified.
- **Enums:** Handle value addition safely in PostgreSQL.

---

## Performance Review

- **Indexing:** Indexes added on `email`, `status`, and `created_at`.
- **Filtering:** Admin list uses server-side filtering for status.
- **Scalability:** Activity logging is decoupled into a separate table to keep the main application table slim.

---

## Future Scalability Notes

- **Onboarding:** The 'converted' status can trigger an automated email with onboarding instructions.
- **CRM:** The application history can be migrated into a fuller CRM pipeline later.
- **Automation:** The trigger system can be expanded to Slack/Discord webhooks easily.

---

## Final Deliverables

### Changed Files

- `src/routes/partner.tsx` (Updated public form)
- `src/routes/_authenticated/admin-dashboard.tsx` (Admin role protection update)
- `src/routes/_authenticated/admin-dashboard.index.tsx` (Admin role protection update)
- `src/components/site/Header.tsx` (Navigation and role support)

### New Files

- `src/lib/partner/service.ts` (Backend logic)
- `src/lib/partner/actions.ts` (Server functions)
- `src/routes/_authenticated/admin-dashboard.partner-applications.tsx` (Admin UI)
- `supabase/migrations/20260530000000_partner_application_system.sql`
- `supabase/migrations/20260530000001_partner_application_soft_delete.sql`
