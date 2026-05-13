# CommonGround — Manual Setup Checklist

The infrastructure is stabilized and the core architecture is synchronized. To make the platform fully operational, the following manual steps are required in your Supabase and Peach Payments accounts.

## 1. Supabase Dashboard Setup

### A. Storage Buckets
The application expects storage for documents and media. Create the following buckets in **Storage** and set them to **Public**:
- `ngo-assets`: For NGO logos and documentation.
- `initiative-media`: For project photos and videos.
- `transparency-reports`: For PDF impact reports.
- `receipts`: For downloadable contribution receipts.

### B. Auth / SMTP
By default, Supabase has a rate limit on emails. For production:
1. Go to **Authentication > Providers > Email**.
2. Enable "Confirm Email".
3. Configure **SMTP Settings** using a provider like Postmark, SendGrid, or Resend to ensure members receive their welcome emails.

### C. NGO Onboarding (Manual for now)
To onboard your first NGO partners:
1. Ask the NGO owner to sign up as a member.
2. In the **SQL Editor**, run the following (replace IDs):
   ```sql
   -- 1. Create the NGO record
   INSERT INTO public.ngos (name, category, mission)
   VALUES ('Organization Name', 'Category', 'Mission Statement')
   RETURNING id; -- Note this ID

   -- 2. Link the user to the NGO and change role
   UPDATE public.profiles SET ngo_id = 'NGO_ID_HERE' WHERE email = 'owner@email.com';
   UPDATE public.user_roles SET role = 'ngo' WHERE user_id = (SELECT id FROM profiles WHERE email = 'owner@email.com');
   ```

## 2. Peach Payments Integration

### A. Webhook Endpoint
You need a Supabase Edge Function to receive payment confirmations.
1. Create a function: `supabase functions new peach-webhook`.
2. Point your Peach Payments Dashboard webhook URL to:
   `https://vzsifigcowusabfmnudk.supabase.co/functions/v1/peach-webhook`
3. The function should validate the signature and insert records into `payment_events`.

### B. Secrets
Add your Peach API keys to Supabase Vault/Secrets:
```bash
supabase secrets set PEACH_ENTITY_ID=xxxx PEACH_API_KEY=xxxx
```

## 3. Frontend Deployment
Ensure your deployment environment (Vercel, Netlify, etc.) has these variables:
- `VITE_SUPABASE_URL`: `https://vzsifigcowusabfmnudk.supabase.co`
- `VITE_SUPABASE_ANON_KEY`: (Your project's public anon key)

---
*Refer to AGENTS.md for the architectural rules governing these systems.*
