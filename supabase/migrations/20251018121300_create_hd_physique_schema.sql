-- HD-Physique Database Schema Migration
-- Creates users, chats, and messages tables with RLS policies

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chats table (multiple conversations per user)
CREATE TABLE IF NOT EXISTS chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'New Chat',
  personalization JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages table (chat history)
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can read own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own data" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for chats table
CREATE POLICY "Users can read own chats" ON chats
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own chats" ON chats
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own chats" ON chats
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own chats" ON chats
  FOR DELETE USING (user_id = auth.uid());

-- RLS Policies for messages table
CREATE POLICY "Users can read own messages" ON messages
  FOR SELECT USING (
    chat_id IN (SELECT id FROM chats WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can insert own messages" ON messages
  FOR INSERT WITH CHECK (
    chat_id IN (SELECT id FROM chats WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update own messages" ON messages
  FOR UPDATE USING (
    chat_id IN (SELECT id FROM chats WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can delete own messages" ON messages
  FOR DELETE USING (
    chat_id IN (SELECT id FROM chats WHERE user_id = auth.uid())
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chats_user_id ON chats(user_id);
CREATE INDEX IF NOT EXISTS idx_chats_created_at ON chats(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chats_updated_at BEFORE UPDATE ON chats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
