-- Fix RLS policies for webhooks table to allow frontend access
-- This migration replaces restrictive role-based policies with permissive public policies

-- Drop the existing restrictive policies
DROP POLICY IF EXISTS "Allow anonymous read access" ON webhooks;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON webhooks;
DROP POLICY IF EXISTS "Allow all operations for service role" ON webhooks;

-- Create new permissive policies for development
-- Note: In production, you should restrict write operations to authenticated admin users

-- Allow anyone to read webhooks (for the Edge Function and frontend)
CREATE POLICY "Allow public read access"
  ON webhooks FOR SELECT
  USING (true);

-- Allow anyone to insert webhooks (for development)
CREATE POLICY "Allow public insert"
  ON webhooks FOR INSERT
  WITH CHECK (true);

-- Allow anyone to update webhooks (for development)
CREATE POLICY "Allow public update"
  ON webhooks FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Allow anyone to delete webhooks (for development)
CREATE POLICY "Allow public delete"
  ON webhooks FOR DELETE
  USING (true);

-- Note: These policies are permissive for development purposes.
-- In production, consider restricting INSERT/UPDATE/DELETE to authenticated admin users
-- while keeping SELECT public for the Edge Function to query active webhooks.
