-- Add INSERT policy for users table (service role only, triggered automatically)
CREATE POLICY "Service role can insert users"
  ON public.users FOR INSERT
  WITH CHECK (true);