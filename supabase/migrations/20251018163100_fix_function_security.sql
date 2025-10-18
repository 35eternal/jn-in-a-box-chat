-- ============================================
-- FIX SECURITY WARNINGS FOR HD-PHYSIQUE APP
-- ============================================
-- This migration fixes function security warnings by setting immutable search_path

-- Fix: Function `public.handle_new_user` has a role mutable search_path
-- This function runs when a new user signs up via Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp  -- This fixes the security warning
AS $$
BEGIN
  -- Insert new user into users table with user_metadata
  INSERT INTO public.users (id, email, user_metadata, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    '{}'::jsonb,
    NOW(),
    NOW()
  );
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- If user already exists, just continue
    RETURN NEW;
END;
$$;

-- Fix: Function `public.update_updated_at_column` has a role mutable search_path
-- This function runs automatically when any row is updated
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp  -- This fixes the security warning
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Verify RLS is enabled on all app tables
DO $$
DECLARE
  tbl RECORD;
  rls_enabled BOOLEAN;
BEGIN
  RAISE NOTICE '=== Checking RLS Status ===';
  
  FOR tbl IN 
    SELECT schemaname, tablename 
    FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename IN ('users', 'chats', 'messages', 'webhooks')
  LOOP
    SELECT c.relrowsecurity INTO rls_enabled
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = tbl.tablename
    AND n.nspname = tbl.schemaname;
    
    IF rls_enabled THEN
      RAISE NOTICE '✓ RLS enabled on %.%', tbl.schemaname, tbl.tablename;
    ELSE
      RAISE WARNING '✗ RLS NOT enabled on %.%', tbl.schemaname, tbl.tablename;
    END IF;
  END LOOP;
  
  RAISE NOTICE '=== RLS Check Complete ===';
END $$;
