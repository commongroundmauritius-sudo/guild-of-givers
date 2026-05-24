-- Create admin_actions table for the 'blame system'
CREATE TABLE public.admin_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES auth.users(id),
    action_type TEXT NOT NULL,
    target_id UUID,
    target_type TEXT,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;

-- Grant access
GRANT SELECT, INSERT ON public.admin_actions TO authenticated;

-- Admin-only visibility policy
CREATE POLICY "Admins can view all actions" ON public.admin_actions
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'::app_role
    )
);

-- Policy to allow any authenticated user with admin role to insert logs
CREATE POLICY "Admins can insert actions" ON public.admin_actions
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'::app_role
    )
);
