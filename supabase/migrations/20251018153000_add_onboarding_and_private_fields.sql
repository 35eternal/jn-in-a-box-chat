-- Add onboarding and private mode fields
-- Migration to support onboarding wizard and private chat functionality

-- Add user_metadata JSONB column to users table
-- This will store has_completed_onboarding and suggested_questions
ALTER TABLE users ADD COLUMN IF NOT EXISTS user_metadata JSONB DEFAULT '{}'::jsonb;

-- Add is_private boolean column to chats table
-- Private chats won't be saved to history or used for training
ALTER TABLE chats ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false;

-- Create index for better performance when querying private chats
CREATE INDEX IF NOT EXISTS idx_chats_is_private ON chats(is_private);

-- Create index for user_metadata for faster queries
CREATE INDEX IF NOT EXISTS idx_users_metadata ON users USING gin(user_metadata);
