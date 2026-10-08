-- Add missing foreign key constraints to organization_contact_applications
-- These references to auth.users require explicit ALTER TABLE statements

ALTER TABLE public.organization_contact_applications 
DROP CONSTRAINT IF EXISTS organization_contact_applications_reviewed_by_fkey,
ADD CONSTRAINT organization_contact_applications_reviewed_by_fkey 
FOREIGN KEY (reviewed_by) REFERENCES auth.users(id);

ALTER TABLE public.organization_contact_applications 
DROP CONSTRAINT IF EXISTS organization_contact_applications_converted_by_fkey,
ADD CONSTRAINT organization_contact_applications_converted_by_fkey 
FOREIGN KEY (converted_by) REFERENCES auth.users(id);

-- Also fix status history if missing
ALTER TABLE public.organization_application_status_history
DROP CONSTRAINT IF EXISTS organization_application_status_history_changed_by_fkey,
ADD CONSTRAINT organization_application_status_history_changed_by_fkey
FOREIGN KEY (changed_by) REFERENCES auth.users(id);

