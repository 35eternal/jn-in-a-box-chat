-- Lock down webhooks table by removing anonymous access
-- Ensures only authenticated admins or service role can query/manage webhooks

-- Drop legacy anonymous read policy if it still exists
DROP POLICY IF EXISTS "Allow anonymous read access" ON public.webhooks;

-- Explicitly forbid anonymous role from accessing the table
REVOKE ALL ON public.webhooks FROM anon;

-- Safety check: confirm no policies grant anon privileges
DO $$
DECLARE
  anon_policies INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO anon_policies
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'webhooks'
    AND array_position(roles, 'anon') IS NOT NULL;

  IF anon_policies > 0 THEN
    RAISE EXCEPTION 'Anonymous policies remain on webhooks table. Please review manually.';
  ELSE
    RAISE NOTICE '✓ Anonymous access to public.webhooks removed';
  END IF;
END $$;
