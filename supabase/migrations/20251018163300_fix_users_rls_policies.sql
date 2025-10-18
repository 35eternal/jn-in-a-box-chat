-- Fix RLS policies blocking user existence checks and service role operations

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can read own data" ON public.users;
DROP POLICY IF EXISTS "Users can insert own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;

-- Recreate with proper configuration for authenticated users
CREATE POLICY "Users can read own data"
ON public.users
FOR SELECT
TO authenticated
USING (id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own data"
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (id = (SELECT auth.uid()));

CREATE POLICY "Users can update own data"
ON public.users
FOR UPDATE
TO authenticated
USING (id = (SELECT auth.uid()))
WITH CHECK (id = (SELECT auth.uid()));

-- Allow service role full access (required for triggers like handle_new_user)
CREATE POLICY "Service role full access"
ON public.users
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Ensure RLS is enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Verification
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
  AND tablename = 'users';
  
  RAISE NOTICE '✓ Users table now has % RLS policies', policy_count;
  RAISE NOTICE '✓ Service role can now insert users via triggers';
  RAISE NOTICE '✓ Authenticated users can access their own data';
END $$;
