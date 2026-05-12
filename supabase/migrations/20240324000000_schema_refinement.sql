-- Refine schema to perfectly match CommonGround documentation

-- Profiles refinement
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS country TEXT;

-- Subscriptions refinement
ALTER TABLE public.subscriptions
ADD COLUMN IF NOT EXISTS billing_cycle TEXT DEFAULT 'monthly',
ADD COLUMN IF NOT EXISTS start_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- Payments refinement
ALTER TABLE public.payments
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'MUR',
ADD COLUMN IF NOT EXISTS processor_response JSONB;

-- Payment Events refinement
ALTER TABLE public.payment_events
ADD COLUMN IF NOT EXISTS retries INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS processing_status TEXT DEFAULT 'received';

-- Ensure all tables mentioned are present with correct fields
-- Profiles was already updated with email in previous migrations

-- Initiatives: Ensure "media" (image_url/media_url) is present
-- (Already handled by image_url in 20240320 and media_url in 20240322)

-- NGOs: Ensure all fields from section 10 are present
-- (Already handled in 20240320 and 20240322)
