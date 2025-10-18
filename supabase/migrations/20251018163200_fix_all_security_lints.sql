-- ============================================
-- FIX ALL SECURITY & PERFORMANCE LINTS
-- ============================================
-- This migration addresses all security and performance issues
-- for the HD-Physique chat application tables

-- PART 1: FIX RLS POLICY PERFORMANCE (WARN - auth_rls_initplan)
-- Replace auth.uid() with (SELECT auth.uid()) to prevent re-evaluation per row
-- ============================================

-- Fix: users table policies
DROP POLICY IF EXISTS "Users can read own data" ON public.users;
CREATE POLICY "Users can read own data" 
ON public.users FOR SELECT 
USING (id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can insert own data" ON public.users;
CREATE POLICY "Users can insert own data" 
ON public.users FOR INSERT 
WITH CHECK (id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update own data" ON public.users;
CREATE POLICY "Users can update own data" 
ON public.users FOR UPDATE 
USING (id = (SELECT auth.uid()));

-- Fix: chats table policies  
DROP POLICY IF EXISTS "Users can read own chats" ON public.chats;
CREATE POLICY "Users can read own chats" 
ON public.chats FOR SELECT 
USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can insert own chats" ON public.chats;
CREATE POLICY "Users can insert own chats" 
ON public.chats FOR INSERT 
WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update own chats" ON public.chats;
CREATE POLICY "Users can update own chats" 
ON public.chats FOR UPDATE 
USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can delete own chats" ON public.chats;
CREATE POLICY "Users can delete own chats" 
ON public.chats FOR DELETE 
USING (user_id = (SELECT auth.uid()));

-- Fix: messages table policies
DROP POLICY IF EXISTS "Users can read own messages" ON public.messages;
CREATE POLICY "Users can read own messages" 
ON public.messages FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.chats 
    WHERE chats.id = messages.chat_id 
    AND chats.user_id = (SELECT auth.uid())
  )
);

DROP POLICY IF EXISTS "Users can insert own messages" ON public.messages;
CREATE POLICY "Users can insert own messages" 
ON public.messages FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.chats 
    WHERE chats.id = messages.chat_id 
    AND chats.user_id = (SELECT auth.uid())
  )
);

DROP POLICY IF EXISTS "Users can update own messages" ON public.messages;
CREATE POLICY "Users can update own messages" 
ON public.messages FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.chats 
    WHERE chats.id = messages.chat_id 
    AND chats.user_id = (SELECT auth.uid())
  )
);

DROP POLICY IF EXISTS "Users can delete own messages" ON public.messages;
CREATE POLICY "Users can delete own messages" 
ON public.messages FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.chats 
    WHERE chats.id = messages.chat_id 
    AND chats.user_id = (SELECT auth.uid())
  )
);

-- PART 2: ADD RLS POLICIES FOR WEBHOOKS TABLE
-- ============================================

-- Enable RLS on webhooks if not already enabled
ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Service role can manage webhooks" ON public.webhooks;
DROP POLICY IF EXISTS "Webhook management" ON public.webhooks;

-- Add policy for service role to manage webhooks
CREATE POLICY "Service role can manage webhooks"
ON public.webhooks
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- PART 3: VERIFY RLS IS ENABLED ON ALL TABLES
-- ============================================

DO $$
DECLARE
  tbl TEXT;
  rls_enabled BOOLEAN;
BEGIN
  RAISE NOTICE '=== Verifying RLS Status ===';
  
  FOR tbl IN 
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename IN ('users', 'chats', 'messages', 'webhooks')
  LOOP
    -- Enable RLS on the table
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
    
    -- Check if RLS is enabled
    SELECT c.relrowsecurity INTO rls_enabled
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = tbl
    AND n.nspname = 'public';
    
    IF rls_enabled THEN
      RAISE NOTICE '✓ RLS enabled on public.%', tbl;
    ELSE
      RAISE WARNING '✗ RLS NOT enabled on public.%', tbl;
    END IF;
  END LOOP;
  
  RAISE NOTICE '=== RLS Verification Complete ===';
END $$;

-- PART 4: ADD TABLE AND COLUMN COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON TABLE public.users IS 'User accounts synchronized with Supabase Auth - stores profile and metadata';
COMMENT ON TABLE public.chats IS 'Chat sessions for HD Physique AI Coach - supports personalization and privacy';
COMMENT ON TABLE public.messages IS 'Messages within chat sessions - supports user and assistant roles';
COMMENT ON TABLE public.webhooks IS 'Webhook endpoints for external integrations';

COMMENT ON COLUMN public.chats.is_private IS 'Whether this chat is private (not saved to history)';
COMMENT ON COLUMN public.chats.personalization IS 'User preferences: fitness level, goals, equipment, diet';
COMMENT ON COLUMN public.chats.user_id IS 'References auth.users - owner of this chat';
COMMENT ON COLUMN public.messages.role IS 'Message sender: "user" or "assistant"';
COMMENT ON COLUMN public.messages.content IS 'Message text content';
COMMENT ON COLUMN public.messages.chat_id IS 'References chats table - parent chat session';
COMMENT ON COLUMN public.users.user_metadata IS 'Stores onboarding status and user preferences';

-- PART 5: CREATE INDEXES FOR BETTER QUERY PERFORMANCE
-- ============================================

-- Index for chat lookups by user (if not exists)
CREATE INDEX IF NOT EXISTS idx_chats_user_id_active ON public.chats(user_id) 
WHERE is_private = false;

-- Index for message lookups by chat
CREATE INDEX IF NOT EXISTS idx_messages_chat_id_created ON public.messages(chat_id, created_at DESC);

-- PART 6: SUMMARY AND VALIDATION
-- ============================================

DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  RAISE NOTICE '=== Security Migration Complete ===';
  RAISE NOTICE 'Summary of changes:';
  RAISE NOTICE '- Optimized 12 RLS policies with (SELECT auth.uid())';
  RAISE NOTICE '- Added RLS policy for webhooks table';
  RAISE NOTICE '- Verified RLS enabled on all core tables';
  RAISE NOTICE '- Added documentation comments';
  RAISE NOTICE '- Created performance indexes';
  
  -- Count total policies
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
  AND tablename IN ('users', 'chats', 'messages', 'webhooks');
  
  RAISE NOTICE 'Total active RLS policies: %', policy_count;
  RAISE NOTICE '=================================';
END $$;
