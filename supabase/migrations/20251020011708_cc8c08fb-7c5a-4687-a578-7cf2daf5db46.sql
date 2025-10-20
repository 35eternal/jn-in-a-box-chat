-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all roles"
ON public.user_roles
FOR ALL
USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

-- Insert admin role for spartanballer18@gmail.com
-- First, get the user_id from auth.users
DO $$
DECLARE
  target_user_id UUID;
BEGIN
  -- Find the user by email
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = 'spartanballer18@gmail.com';
  
  -- If user exists, grant admin role
  IF target_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (target_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
    
    RAISE NOTICE 'Admin role granted to spartanballer18@gmail.com';
  ELSE
    RAISE NOTICE 'User spartanballer18@gmail.com not found - will be granted admin on signup';
  END IF;
END $$;

-- Insert the two webhooks
INSERT INTO public.webhooks (name, url, priority, is_active)
VALUES 
  ('HD Operator Internal', 'https://zaytoven.app.n8n.cloud/webhook/hd-operator-internal', 1, true),
  ('HD Operator Test', 'https://zaytoven.app.n8n.cloud/webhook-test/hd-operator-internal', 2, true)
ON CONFLICT DO NOTHING;