-- Create custom types
DO $$ BEGIN
    CREATE TYPE public.app_role AS ENUM ('admin', 'organization', 'member');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.subscription_status AS ENUM ('active', 'pending', 'cancelled', 'past_due');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.payment_status AS ENUM ('success', 'failed', 'pending');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  role public.app_role DEFAULT 'member'::public.app_role NOT NULL,
  UNIQUE(user_id, role)
);

-- Create organizations table
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  website_url TEXT,
  is_verified BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create initiatives table
CREATE TABLE IF NOT EXISTS public.initiatives (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  goal_amount_mur DECIMAL,
  current_amount_mur DECIMAL DEFAULT 0,
  image_url TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  amount_mur DECIMAL NOT NULL,
  status public.subscription_status DEFAULT 'pending'::public.subscription_status NOT NULL,
  peach_subscription_id TEXT,
  next_billing_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create payments table
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  subscription_id UUID REFERENCES public.subscriptions ON DELETE SET NULL,
  amount_mur DECIMAL NOT NULL,
  status public.payment_status DEFAULT 'pending'::public.payment_status NOT NULL,
  peach_payment_id TEXT,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create payment_events table (Audit Trail)
CREATE TABLE IF NOT EXISTS public.payment_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create receipts table
CREATE TABLE IF NOT EXISTS public.receipts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_id UUID REFERENCES public.payments ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  receipt_number TEXT UNIQUE NOT NULL,
  amount_mur DECIMAL NOT NULL,
  pdf_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create allocations table
CREATE TABLE IF NOT EXISTS public.allocations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_id UUID REFERENCES public.payments ON DELETE CASCADE NOT NULL,
  initiative_id UUID REFERENCES public.initiatives ON DELETE CASCADE NOT NULL,
  amount_mur DECIMAL NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.initiatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.allocations ENABLE ROW LEVEL SECURITY;

-- Helper function to check roles
CREATE OR REPLACE FUNCTION public.has_role(requested_role public.app_role)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = requested_role
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- RLS Policies

-- Profiles
DO $$ BEGIN
    CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.has_role('admin'));
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- User Roles
DO $$ BEGIN
    CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (public.has_role('admin'));
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Organizations
DO $$ BEGIN
    CREATE POLICY "Anyone can view verified Organizations" ON public.organizations FOR SELECT USING (is_verified = true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Admins can manage Organizations" ON public.organizations FOR ALL USING (public.has_role('admin'));
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Initiatives
DO $$ BEGIN
    CREATE POLICY "Anyone can view initiatives" ON public.initiatives FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Organizations can manage own initiatives" ON public.initiatives FOR ALL USING (
      EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid()
        AND role = 'organization'
      )
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Subscriptions
DO $$ BEGIN
    CREATE POLICY "Users can view own subscriptions" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Admins can view all subscriptions" ON public.subscriptions FOR SELECT USING (public.has_role('admin'));
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Payments
DO $$ BEGIN
    CREATE POLICY "Users can view own payments" ON public.payments FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Admins can view all payments" ON public.payments FOR SELECT USING (public.has_role('admin'));
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Receipts
DO $$ BEGIN
    CREATE POLICY "Users can view own receipts" ON public.receipts FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Admins can view all receipts" ON public.receipts FOR SELECT USING (public.has_role('admin'));
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Allocations
DO $$ BEGIN
    CREATE POLICY "Users can view own allocations" ON public.allocations FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM public.payments
        WHERE public.payments.id = public.allocations.payment_id
        AND public.payments.user_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;
